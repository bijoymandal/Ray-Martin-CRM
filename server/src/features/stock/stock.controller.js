const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to determine StockStatus based on quantity and threshold
const computeStockStatus = (quantity, minThreshold) => {
  if (quantity <= 0) return 'OUT_OF_STOCK';
  if (quantity <= minThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
};

// Activity log helper
const logActivity = async (req, action, resource, details, oldVal = null, newVal = null) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: req.user?.id || null,
        userEmail: req.user?.email || null,
        userName: req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : null,
        action,
        resource,
        details,
        oldValues: oldVal,
        newValues: newVal,
      },
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

// ─── GET STOCK OVERVIEW SUMMARY METRICS ──────────────────────────────────────
exports.getStockSummary = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        price: true,
        discountedPrice: true,
        stockQuantity: true,
        minStockThreshold: true,
        stockStatus: true,
      },
    });

    let totalQuantity = 0;
    let totalAssetValue = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      const qty = p.stockQuantity || 0;
      const unitPrice = p.discountedPrice > 0 ? p.discountedPrice : p.price || 0;
      totalQuantity += qty;
      totalAssetValue += qty * unitPrice;

      const status = computeStockStatus(qty, p.minStockThreshold || 10);
      if (status === 'IN_STOCK') inStockCount++;
      else if (status === 'LOW_STOCK') lowStockCount++;
      else if (status === 'OUT_OF_STOCK') outOfStockCount++;
    }

    // Recent movements counts
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const movementsThisMonth = await prisma.stockMovement.findMany({
      where: { createdAt: { gte: startOfMonth } },
    });

    let inwardMonth = 0;
    let outwardMonth = 0;
    let specimenMonth = 0;

    for (const m of movementsThisMonth) {
      if (m.type === 'INWARD') inwardMonth += m.quantity;
      else if (m.type === 'OUTWARD') outwardMonth += m.quantity;
      else if (m.type === 'SPECIMEN_ISSUE') specimenMonth += m.quantity;
    }

    res.json({
      success: true,
      data: {
        totalProducts: products.length,
        totalQuantity,
        totalAssetValue,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        inwardMonth,
        outwardMonth,
        specimenMonth,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET PRODUCTS STOCK INVENTORY LIST ───────────────────────────────────────
exports.getProductsStock = async (req, res, next) => {
  try {
    const { status, search, categoryId } = req.query;

    const where = {};
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          include: {
            subject: {
              include: {
                class: {
                  include: { board: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Compute live stock status for each product
    let list = products.map((p) => {
      const computedStatus = computeStockStatus(p.stockQuantity, p.minStockThreshold);
      return {
        ...p,
        stockStatus: computedStatus,
        assetValue: (p.discountedPrice || p.price) * p.stockQuantity,
      };
    });

    if (status && status !== 'ALL') {
      list = list.filter((p) => p.stockStatus === status);
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    next(err);
  }
};

// ─── ADJUST PRODUCT STOCK (INWARD / OUTWARD / ADJUSTMENT) ───────────────────
exports.adjustStock = async (req, res, next) => {
  try {
    const { productId, type, quantity, reason, referenceNo, minStockThreshold } = req.body;

    if (!productId || !type || quantity === undefined) {
      res.status(400);
      throw new Error('Product ID, type (INWARD/OUTWARD/ADJUSTMENT), and quantity are required');
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      res.status(400);
      throw new Error('Quantity must be a positive integer');
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const previousStock = product.stockQuantity || 0;
    let newStock = previousStock;

    if (type === 'INWARD') {
      newStock = previousStock + parsedQty;
    } else if (type === 'OUTWARD' || type === 'SPECIMEN_ISSUE') {
      if (previousStock < parsedQty) {
        res.status(400);
        throw new Error(`Insufficient stock. Current stock is ${previousStock}, cannot deduct ${parsedQty}.`);
      }
      newStock = previousStock - parsedQty;
    } else if (type === 'ADJUSTMENT') {
      // In adjustment, quantity is the absolute new stock value or diff
      newStock = parsedQty;
    } else {
      res.status(400);
      throw new Error('Invalid movement type');
    }

    const threshold = minStockThreshold !== undefined ? parseInt(minStockThreshold, 10) : product.minStockThreshold || 10;
    const newStockStatus = computeStockStatus(newStock, threshold);

    // Update Product stock quantity & status
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        stockQuantity: newStock,
        minStockThreshold: threshold,
        stockStatus: newStockStatus,
      },
    });

    // Create Stock Movement record
    const createdBy = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email : 'System Admin';

    const movement = await prisma.stockMovement.create({
      data: {
        productId,
        type,
        quantity: Math.abs(type === 'ADJUSTMENT' ? newStock - previousStock : parsedQty),
        previousStock,
        newStock,
        reason: reason ? reason.trim() : `Stock ${type.toLowerCase()} transaction`,
        referenceNo: referenceNo ? referenceNo.trim() : null,
        createdBy,
      },
    });

    await logActivity(
      req,
      'UPDATE',
      'STOCK',
      `Adjusted stock for ${product.name} (${type}: ${parsedQty}). Stock changed from ${previousStock} to ${newStock}.`,
      { stockQuantity: previousStock },
      { stockQuantity: newStock }
    );

    res.json({
      success: true,
      message: `Stock updated successfully for ${product.name}`,
      data: { product: updatedProduct, movement },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET STOCK MOVEMENTS TRANSACTION LEDGER ─────────────────────────────────
exports.getStockMovements = async (req, res, next) => {
  try {
    const { productId, type, search } = req.query;

    const where = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { referenceNo: { contains: search, mode: 'insensitive' } },
        { createdBy: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            discountedPrice: true,
            sku: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    res.json({ success: true, count: movements.length, data: movements });
  } catch (err) {
    next(err);
  }
};

// ─── GET LOW STOCK & OUT OF STOCK ALERTS ───────────────────────────────────
exports.getStockAlerts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: {
          include: {
            subject: {
              include: {
                class: {
                  include: { board: true },
                },
              },
            },
          },
        },
      },
      orderBy: { stockQuantity: 'asc' },
    });

    const alerts = products
      .map((p) => ({
        ...p,
        computedStatus: computeStockStatus(p.stockQuantity, p.minStockThreshold),
      }))
      .filter((p) => p.computedStatus === 'LOW_STOCK' || p.computedStatus === 'OUT_OF_STOCK');

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    next(err);
  }
};
