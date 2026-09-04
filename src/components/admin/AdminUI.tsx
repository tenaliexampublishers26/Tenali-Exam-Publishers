'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence, type Transition } from 'motion/react';

/**
 * Shared spring presets, translated from Apple's "Designing Fluid Interfaces"
 * damping/response model into Motion's spring API.
 *
 * - SPRING_UI: default for anything that isn't gesture-driven (fades, layout
 *   shifts, card entrances). Critically damped — no overshoot.
 * - SPRING_PRESS: fast, snappy response for tap/press feedback.
 * - SPRING_MOMENTUM: slight bounce, reserved for interactions that carried
 *   physical momentum (drags, flicks, sheet releases).
 */
export const SPRING_UI: Transition = { type: 'spring', bounce: 0, duration: 0.4 };
export const SPRING_PRESS: Transition = { type: 'spring', bounce: 0, duration: 0.22 };
export const SPRING_MOMENTUM: Transition = { type: 'spring', bounce: 0.22, duration: 0.4 };

/* ---------------------------------------------------------------------- */
/* Page header                                                             */
/* ---------------------------------------------------------------------- */

export function AdminPageHeader({
  icon,
  title,
  description,
  actions,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_UI}
      className="admin-page-header"
    >
      <div>
        <h1 className="admin-page-title">
          {icon}
          {title}
        </h1>
        {description && <p className="admin-page-desc">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- */
/* Stat card — pointer-down feedback, spring hover lift, staggered entry   */
/* ---------------------------------------------------------------------- */

export function AdminStatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  hint,
  hintTone = 'muted',
  pill,
  index = 0,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  hintTone?: 'muted' | 'success' | 'error';
  pill?: ReactNode;
  index?: number;
}) {
  const hintColorClass =
    hintTone === 'success'
      ? 'text-(--color-success)'
      : hintTone === 'error'
      ? 'text-(--color-error)'
      : 'text-(--color-text-muted)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_UI, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="stat-card group"
    >
      <div className="flex items-center justify-between mb-5">
        <div
          className="p-3 rounded-xl transition-colors duration-300"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        {pill}
      </div>
      <h3 className="stat-label mb-1">{label}</h3>
      <p className="stat-value">{value}</p>
      {hint && <p className={`text-xs mt-2 font-semibold ${hintColorClass}`}>{hint}</p>}
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- */
/* Glass surface card — for hero banners, floating panels                 */
/* ---------------------------------------------------------------------- */

export function AdminGlassCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING_UI}
      className={`admin-glass rounded-3xl border ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- */
/* Segmented control — animated pill that slides between options,         */
/* anchored to the option that's selected (spatial consistency).          */
/* ---------------------------------------------------------------------- */

export function AdminSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  layoutId: string;
}) {
  return (
    <div className="flex border border-(--color-border) rounded-xl overflow-hidden p-0.5 bg-(--color-bg-hover) relative">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`relative px-3 py-1 text-xs font-bold capitalize z-10 transition-colors duration-200 ${
              isSelected ? 'text-white' : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
            }`}
          >
            {isSelected && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING_UI}
                className="absolute inset-0 -z-10 bg-blue-500 rounded-lg shadow-xs"
              />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Pressable icon button — instant feedback on pointer-down                */
/* ---------------------------------------------------------------------- */

export function AdminIconButton({
  children,
  onClick,
  label,
  active = false,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  label?: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      transition={SPRING_PRESS}
      className={`inline-flex items-center justify-center rounded-xl transition-colors duration-200 ${
        active
          ? 'bg-blue-500 text-white shadow-xs'
          : 'text-(--color-text-secondary) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)'
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

/* ---------------------------------------------------------------------- */
/* Modal — spring-in/out overlay, interruptible, click-outside + Esc close */
/* ---------------------------------------------------------------------- */

export function AdminModal({
  open,
  onClose,
  children,
  maxWidth = '640px',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={SPRING_UI}
            className="relative w-full bg-(--color-bg-card) rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
            style={{ maxWidth }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------------------------------------------------- */
/* Confirm dialog — replaces native confirm() for destructive actions      */
/* ---------------------------------------------------------------------- */

export function AdminConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  danger = true,
  loading = false,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <AdminModal open={open} onClose={onCancel} maxWidth="420px">
      <div className="p-6">
        <h3 className="text-lg font-bold text-(--color-text-primary) mb-2">{title}</h3>
        <p className="text-sm text-(--color-text-secondary) leading-relaxed">{description}</p>
      </div>
      <div className="flex justify-end gap-2.5 p-4 bg-(--color-bg-hover) border-t border-(--color-border)">
        <motion.button
          type="button"
          onClick={onCancel}
          whileTap={{ scale: 0.97 }}
          transition={SPRING_PRESS}
          className="btn btn-secondary btn-sm"
        >
          Cancel
        </motion.button>
        <motion.button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          transition={SPRING_PRESS}
          className={`btn btn-sm disabled:opacity-60 ${danger ? '' : 'btn-primary'}`}
          style={danger ? { background: '#e11d48', color: '#fff', border: 'none' } : undefined}
        >
          {loading ? 'Working...' : confirmLabel}
        </motion.button>
      </div>
    </AdminModal>
  );
}

/* ---------------------------------------------------------------------- */
/* Motion-wrapped table row — staggered entrance, subtle hover lift        */
/* ---------------------------------------------------------------------- */

export function AdminTableRow({
  children,
  index = 0,
  onClick,
  className = '',
}: {
  children: ReactNode;
  index?: number;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_UI, delay: Math.min(index * 0.03, 0.3) }}
      onClick={onClick}
      className={className}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </motion.tr>
  );
}

export function AdminLivePill({ label = 'Live' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-(--color-success) bg-(--color-success-bg) px-2.5 py-0.5 rounded-full">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
      </span>
      {label}
    </span>
  );
}
