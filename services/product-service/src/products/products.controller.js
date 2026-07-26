const prisma = require('../../lib/prisma');
const { logActivity } = require('../../lib/activity-logger');

// Get all products (Paginated)
exports.getAll = async (req, res, next) => {
  try {
    const { categoryId } = req.query;
    const filter = categoryId ? { categoryId } : {};

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await prisma.product.count({
      where: filter,
    });

    const products = await prisma.product.findMany({
      where: filter,
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Create product
exports.create = async (req, res, next) => {
  try {
    const { name, description, price, discount, status, offer, coupon, categoryId } = req.body;

    if (!name || price === undefined || !categoryId) {
      res.status(400);
      throw new Error('Product Name, Price, and Category are required');
    }

    // Verify Category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      res.status(404);
      throw new Error('Selected Category not found');
    }

    const rawPrice = parseFloat(price);
    const rawDiscount = discount ? parseFloat(discount) : 0;
    // Auto calculate and round off final price: discountedPrice = Math.round(price - (price * discount / 100))
    const discountedPrice = Math.round(rawPrice - (rawPrice * rawDiscount / 100));

    const statusVal = status === undefined ? true : String(status) === 'true';
    const offerVal = offer === undefined ? false : String(offer) === 'true';

    // File processing
    let mainImageUrl = null;
    let galleryUrls = [];

    if (req.files) {
      if (req.files['image'] && req.files['image'][0]) {
        mainImageUrl = `/uploads/${req.files['image'][0].filename}`;
      }
      if (req.files['gallery']) {
        galleryUrls = req.files['gallery'].map(file => `/uploads/${file.filename}`);
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: rawPrice,
        discount: rawDiscount,
        discountedPrice,
        status: statusVal,
        offer: offerVal,
        coupon: coupon || null,
        image: mainImageUrl,
        gallery: galleryUrls,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    await logActivity(
      req,
      'CREATE',
      'PRODUCT',
      `Created product: ${product.name} ($${product.price})`,
      null,
      product
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Update product
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, discount, status, offer, coupon, categoryId, existingGallery } = req.body;

    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        res.status(404);
        throw new Error('Selected Category not found');
      }
    }

    const rawPrice = price !== undefined ? parseFloat(price) : product.price;
    const rawDiscount = discount !== undefined ? parseFloat(discount) : product.discount;
    const discountedPrice = Math.round(rawPrice - (rawPrice * rawDiscount / 100));

    const statusVal = status === undefined ? product.status : String(status) === 'true';
    const offerVal = offer === undefined ? product.offer : String(offer) === 'true';

    // File processing
    let mainImageUrl = product.image;
    if (req.files && req.files['image'] && req.files['image'][0]) {
      mainImageUrl = `/uploads/${req.files['image'][0].filename}`;
    }

    // Process gallery updates
    let finalGallery = [];
    if (existingGallery) {
      // Keep selected old gallery paths
      finalGallery = Array.isArray(existingGallery) ? existingGallery : [existingGallery];
    }

    if (req.files && req.files['gallery']) {
      const newUrls = req.files['gallery'].map(file => `/uploads/${file.filename}`);
      finalGallery = [...finalGallery, ...newUrls];
    } else if (!existingGallery && !req.files) {
      // If no gallery sent at all, retain old gallery
      finalGallery = product.gallery;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : product.name,
        description: description !== undefined ? description : product.description,
        price: rawPrice,
        discount: rawDiscount,
        discountedPrice,
        status: statusVal,
        offer: offerVal,
        coupon: coupon !== undefined ? coupon : product.coupon,
        image: mainImageUrl,
        gallery: finalGallery,
        categoryId: categoryId !== undefined ? categoryId : product.categoryId,
      },
      include: {
        category: true,
      },
    });

    await logActivity(
      req,
      'UPDATE',
      'PRODUCT',
      `Updated product: ${updatedProduct.name}`,
      product,
      updatedProduct
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Delete product
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    await prisma.product.delete({
      where: { id },
    });

    await logActivity(
      req,
      'DELETE',
      'PRODUCT',
      `Deleted product: ${product.name}`,
      product,
      null
    );

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
