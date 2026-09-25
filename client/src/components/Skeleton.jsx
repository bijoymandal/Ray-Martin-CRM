/**
 * Base Flipkart-Style Skeleton Component
 * Provides the signature smooth light-to-right sweep shimmer effect.
 */
export const Skeleton = ({
  variant = 'rounded',
  width,
  height,
  className = '',
  style = {},
  children,
}) => {
  const variantClasses = {
    text: 'h-4 rounded-md my-1',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
    rectangular: 'rounded-none',
  };

  const computedStyle = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...style,
  };

  return (
    <div
      className={`skeleton ${variantClasses[variant] || 'rounded-xl'} ${className}`}
      style={computedStyle}
    >
      {children}
    </div>
  );
};

/**
 * Flipkart Product Card Skeleton
 * Accurately mimics Flipkart's e-commerce product card loading experience:
 * - Square image placeholder with subtle overlay tags
 * - Category / subtitle bar
 * - 2-line title bar
 * - Flipkart-style Rating Badge pill (4.2 ★)
 * - Price block: Bold Price + Strikethrough MRP + Green Discount % tag
 * - Flipkart Assured / Delivery tag & Quick Actions
 */
export const FlipkartProductCardSkeleton = ({ className = '' }) => {
  return (
    <div
      className={`glass-card p-4 flex flex-col justify-between border border-slate-200/70 dark:border-white/5 relative overflow-hidden group ${className}`}
    >
      {/* Top Media Area */}
      <div>
        <div className="relative aspect-square w-full rounded-xl skeleton flex items-center justify-center overflow-hidden">
          {/* Subtle placeholder icon */}
          <div className="w-10 h-10 rounded-full border-2 border-slate-300/40 dark:border-white/10 flex items-center justify-center opacity-40">
            <div className="w-4 h-4 rounded-full bg-slate-300/40 dark:bg-white/10" />
          </div>

          {/* Flipkart Wishlist Heart placeholder top-right */}
          <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full skeleton" />

          {/* Flipkart Discount badge placeholder top-left */}
          <div className="absolute top-2.5 left-2.5 w-14 h-5 rounded-md skeleton" />
        </div>

        {/* Category & Title */}
        <div className="mt-3.5 space-y-2">
          {/* Category path */}
          <div className="w-2/5 h-2.5 rounded skeleton" />

          {/* Title line 1 & line 2 */}
          <div className="w-11/12 h-3.5 rounded skeleton" />
          <div className="w-3/5 h-3.5 rounded skeleton" />
        </div>

        {/* Flipkart Rating Badge (4.2 ★) */}
        <div className="mt-3 flex items-center gap-2">
          <div className="w-12 h-5 rounded-md skeleton" />
          <div className="w-16 h-3 rounded skeleton" />
        </div>

        {/* Flipkart Price Block */}
        <div className="mt-3 flex items-baseline gap-2">
          {/* Current selling price */}
          <div className="w-20 h-5 rounded skeleton" />
          {/* MRP strikethrough */}
          <div className="w-12 h-3.5 rounded skeleton" />
          {/* Discount percentage tag */}
          <div className="w-14 h-4 rounded skeleton" />
        </div>

        {/* Flipkart Assured / Stock tag */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="w-20 h-3.5 rounded-full skeleton" />
          <div className="w-16 h-3 rounded skeleton" />
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div className="w-20 h-7 rounded-lg skeleton" />
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg skeleton" />
          <div className="w-7 h-7 rounded-lg skeleton" />
        </div>
      </div>
    </div>
  );
};

/**
 * Flipkart Product Grid Skeleton
 * Renders an e-commerce catalog grid of FlipkartProductCardSkeleton items.
 */
export const FlipkartProductGridSkeleton = ({ count = 8, className = '' }) => {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 ${className}`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <FlipkartProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};

/**
 * Flipkart Table / List View Skeleton
 * Renders a clean, structured table with image thumbnails, titles, badges, and action bars.
 */
export const FlipkartTableSkeleton = ({
  rows = 6,
  cols = 6,
  hasThumbnail = true,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <table className="w-full text-left border-collapse text-xs">
        {/* Table Header Shimmer */}
        <thead>
          <tr className="border-b border-slate-200/60 dark:border-white/5">
            {Array.from({ length: cols }).map((_, idx) => (
              <th key={idx} className="p-4">
                <div
                  className={`h-3 rounded skeleton ${
                    idx === 0 ? 'w-24' : idx === cols - 1 ? 'w-16 ml-auto' : 'w-20'
                  }`}
                />
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body Shimmer Rows */}
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-50/30 dark:hover:bg-white/1">
              {/* Primary Col (Thumbnail + Title/Subtitle) */}
              <td className="p-4">
                <div className="flex items-center gap-3">
                  {hasThumbnail && (
                    <div className="w-10 h-10 rounded-lg skeleton shrink-0" />
                  )}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div
                      className="h-3.5 rounded skeleton"
                      style={{ width: `${60 + (rowIdx % 4) * 10}%` }}
                    />
                    <div className="w-24 h-2.5 rounded skeleton" />
                  </div>
                </div>
              </td>

              {/* Data Columns */}
              {Array.from({ length: cols - 2 }).map((_, colIdx) => (
                <td key={colIdx} className="p-4">
                  {colIdx % 2 === 0 ? (
                    // Pill / Badge style
                    <div className="w-20 h-5 rounded-full skeleton mx-auto" />
                  ) : (
                    // Text / Metric line
                    <div className="w-24 h-3.5 rounded skeleton mx-auto" />
                  )}
                </td>
              ))}

              {/* Actions Column */}
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-7 h-7 rounded-lg skeleton" />
                  <div className="w-7 h-7 rounded-lg skeleton" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Flipkart Stat / Metric Cards Skeleton
 * Used on Dashboards and module KPI bars.
 */
export const FlipkartStatCardSkeleton = ({
  count = 4,
  colsClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  className = '',
}) => {
  return (
    <div className={`grid ${colsClass} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="glass-card p-5 flex flex-col justify-between border border-slate-200/60 dark:border-white/5"
        >
          <div className="flex items-center justify-between">
            {/* Title / Label bar */}
            <div className="w-24 h-3.5 rounded skeleton" />
            {/* Icon box */}
            <div className="w-9 h-9 rounded-xl skeleton" />
          </div>

          {/* Large Number Value */}
          <div className="my-3">
            <div className="w-32 h-7 rounded-lg skeleton" />
          </div>

          {/* Subtitle / Trend Badge */}
          <div className="flex items-center gap-2">
            <div className="w-14 h-4 rounded-full skeleton" />
            <div className="w-28 h-2.5 rounded skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Flipkart Kanban Board Skeleton
 * For task workflows and pipeline boards.
 */
export const FlipkartKanbanSkeleton = ({ columns = 4, className = '' }) => {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 ${className}`}
    >
      {Array.from({ length: columns }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="glass-card p-4 flex flex-col gap-4 border border-slate-200/60 dark:border-white/5 min-h-[480px]"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full skeleton" />
              <div className="w-20 h-4 rounded skeleton" />
            </div>
            <div className="w-6 h-4 rounded-full skeleton" />
          </div>

          {/* Task Card Skeletons */}
          {Array.from({ length: 3 }).map((_, cardIdx) => (
            <div
              key={cardIdx}
              className="p-3.5 rounded-xl border border-slate-200/60 dark:border-white/5 bg-white/40 dark:bg-white/2 space-y-3"
            >
              {/* Card Tag / Priority */}
              <div className="flex items-center justify-between">
                <div className="w-14 h-4 rounded-md skeleton" />
                <div className="w-12 h-3 rounded skeleton" />
              </div>

              {/* Title lines */}
              <div className="space-y-1.5">
                <div className="w-full h-3.5 rounded skeleton" />
                <div className="w-3/4 h-3.5 rounded skeleton" />
              </div>

              {/* School / Institution tag */}
              <div className="w-32 h-3 rounded skeleton" />

              {/* Footer: Assignee avatar & checklist count */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full skeleton" />
                  <div className="w-16 h-3 rounded skeleton" />
                </div>
                <div className="w-10 h-4 rounded-full skeleton" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Flipkart School / Institution Card Grid Skeleton
 * Specialized for School Visits and Master Data grids.
 */
export const FlipkartSchoolCardSkeleton = ({ count = 6, className = '' }) => {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="glass-card p-5 flex flex-col justify-between border border-slate-200/60 dark:border-white/5 space-y-4"
        >
          {/* Top Banner & District Tag */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <div className="w-16 h-4 rounded-md skeleton" />
              <div className="w-4/5 h-4 rounded skeleton" />
            </div>
            <div className="w-16 h-5 rounded-full skeleton" />
          </div>

          {/* School Details */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-50/50 dark:bg-white/2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full skeleton" />
              <div className="w-32 h-3 rounded skeleton" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full skeleton" />
              <div className="w-24 h-3 rounded skeleton" />
            </div>
          </div>

          {/* Footer: Date & Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div className="w-20 h-3 rounded skeleton" />
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg skeleton" />
              <div className="w-7 h-7 rounded-lg skeleton" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
