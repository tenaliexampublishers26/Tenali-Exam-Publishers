/**
 * ProductCardSkeleton
 * ───────────────────
 * Placeholder shown while product data is streaming from the server.
 * Dimensions exactly match ProductCard to prevent layout shift.
 * Pure CSS shimmer — zero JavaScript overhead.
 */
import styles from './ProductCardSkeleton.module.css';

export default function ProductCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      {/* Image placeholder */}
      <div className={styles.imagePlaceholder} />

      {/* Body */}
      <div className={styles.body}>
        {/* Category + bundle row */}
        <div className={styles.row}>
          <div className={`${styles.shimmer} ${styles.tagSmall}`} />
          <div className={`${styles.shimmer} ${styles.tagSmall}`} />
        </div>

        {/* Title */}
        <div className={`${styles.shimmer} ${styles.titleLine}`} />
        <div className={`${styles.shimmer} ${styles.titleLineShort}`} />

        {/* Highlights */}
        <div className={styles.row}>
          <div className={`${styles.shimmer} ${styles.highlight}`} />
          <div className={`${styles.shimmer} ${styles.highlight}`} />
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Price row */}
        <div className={styles.row}>
          <div className={`${styles.shimmer} ${styles.price}`} />
          <div className={`${styles.shimmer} ${styles.edition}`} />
        </div>

        {/* CTA button */}
        <div className={`${styles.shimmer} ${styles.button}`} />
      </div>
    </div>
  );
}
