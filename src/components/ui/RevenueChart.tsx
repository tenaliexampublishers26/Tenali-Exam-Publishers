'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { formatPrice } from '@/lib/utils';

interface ChartDataPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
  showMiniCards?: boolean;
}

// Utility: generate smooth cubic bezier path through points
function smoothLine(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const tension = 0.35;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

export default function RevenueChart({ data, loading = false, showMiniCards = true }: RevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isAnimated, setIsAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animate on mount
  useEffect(() => {
    if (!loading && data && data.length > 0) {
      const timer = setTimeout(() => setIsAnimated(true), 50);
      return () => clearTimeout(timer);
    }
    setIsAnimated(false);
  }, [loading, data]);

  // SVG dimensions
  const width = 700;
  const height = 280;
  const paddingLeft = 58;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 44;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Computed values
  const { maxRevenue, maxOrders, revenuePoints, orderBarData, linePath, areaPath, yTicks } = useMemo(() => {
    if (!data || data.length === 0) {
      return { maxRevenue: 0, maxOrders: 0, revenuePoints: [], orderBarData: [], linePath: '', areaPath: '', yTicks: [] };
    }

    const maxRev = Math.max(...data.map((d) => d.revenue), 100);
    const maxOrd = Math.max(...data.map((d) => d.orders), 1);

    const revPoints = data.map((d, i) => {
      const x = paddingLeft + (i / (data.length - 1 || 1)) * chartWidth;
      const y = paddingTop + chartHeight - (d.revenue / maxRev) * chartHeight;
      return { x, y, ...d, index: i };
    });

    // Order bar data
    const barWidth = Math.max(8, Math.min(28, chartWidth / data.length - 6));
    const ordBars = data.map((d, i) => {
      const x = paddingLeft + (i / (data.length - 1 || 1)) * chartWidth;
      const barHeight = (d.orders / maxOrd) * (chartHeight * 0.35);
      return {
        x: x - barWidth / 2,
        y: paddingTop + chartHeight - barHeight,
        width: barWidth,
        height: barHeight,
        orders: d.orders,
        index: i,
      };
    });

    const line = smoothLine(revPoints);
    const area = line
      ? `${line} L ${revPoints[revPoints.length - 1].x} ${paddingTop + chartHeight} L ${revPoints[0].x} ${paddingTop + chartHeight} Z`
      : '';

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
      val: maxRev * pct,
      y: paddingTop + chartHeight - pct * chartHeight,
    }));

    return { maxRevenue: maxRev, maxOrders: maxOrd, revenuePoints: revPoints, orderBarData: ordBars, linePath: line, areaPath: area, yTicks: ticks };
  }, [data, chartWidth, chartHeight]);

  if (loading || !data || data.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center bg-(--color-bg-card) border border-(--color-border) rounded-2xl">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative size-10">
              <div className="absolute inset-0 border-3 border-blue-500/20 rounded-full" />
              <div className="absolute inset-0 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-xs font-semibold text-(--color-text-muted)">Crunching revenue numbers...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-(--color-text-muted) opacity-40">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className="text-xs font-semibold text-(--color-text-muted)">No revenue data available</span>
          </div>
        )}
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current || revenuePoints.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;

    let closestPoint = revenuePoints[0];
    let minDiff = Math.abs(revenuePoints[0].x - svgX);
    for (let i = 1; i < revenuePoints.length; i++) {
      const diff = Math.abs(revenuePoints[i].x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestPoint = revenuePoints[i];
      }
    }
    setHoveredIndex(closestPoint.index);

    const tooltipX = (closestPoint.x / width) * rect.width;
    const tooltipY = (closestPoint.y / height) * rect.height;
    setTooltipPos({ x: tooltipX, y: tooltipY });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Avg revenue for the reference line
  const avgRevenue = data.reduce((sum, d) => sum + d.revenue, 0) / data.length;
  const avgY = paddingTop + chartHeight - (avgRevenue / maxRevenue) * chartHeight;
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Top Summary Mini-Cards */}
      {showMiniCards && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/30">
            <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">Revenue</span>
            <span className="text-[11px] font-extrabold text-blue-900 dark:text-blue-100">{formatPrice(totalRevenue)}</span>
          </div>
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200/50 dark:border-violet-800/30">
            <div className="size-2 rounded-sm bg-violet-500" />
            <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300">Orders</span>
            <span className="text-[11px] font-extrabold text-violet-900 dark:text-violet-100">{totalOrders}</span>
          </div>
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/30">
            <svg width="10" height="10" viewBox="0 0 10 2" className="text-emerald-500">
              <line x1="0" y1="1" x2="10" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" />
            </svg>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Avg</span>
            <span className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-100">{formatPrice(avgRevenue)}</span>
          </div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        className="overflow-visible select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {/* Revenue area gradient */}
          <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
          </linearGradient>

          {/* Line gradient */}
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>

          {/* Glow filter for the line */}
          <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#3b82f6" floodOpacity="0.3" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Glow for hovered dot */}
          <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#3b82f6" floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Order bar gradient */}
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.15" />
          </linearGradient>

          {/* Clip for animation */}
          <clipPath id="chartReveal">
            <rect
              x={paddingLeft}
              y={0}
              width={isAnimated ? chartWidth + paddingRight : 0}
              height={height}
              style={{ transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </clipPath>
        </defs>

        {/* Background subtle grid pattern */}
        {yTicks.map((tick, idx) => (
          <g key={`grid-${idx}`}>
            <line
              x1={paddingLeft}
              y1={tick.y}
              x2={width - paddingRight}
              y2={tick.y}
              stroke="var(--color-border)"
              strokeWidth={0.8}
              strokeDasharray={idx === 0 ? 'none' : '6 4'}
              opacity={0.6}
            />
            <text
              x={paddingLeft - 10}
              y={tick.y + 3.5}
              textAnchor="end"
              className="fill-(--color-text-muted) font-bold"
              style={{ fontSize: '9px', letterSpacing: '0.3px' }}
            >
              {tick.val >= 1000 ? `₹${(tick.val / 1000).toFixed(tick.val >= 10000 ? 0 : 1)}k` : `₹${tick.val.toFixed(0)}`}
            </text>
          </g>
        ))}

        {/* X axis labels */}
        {revenuePoints.map((p, idx) => {
          const skipFactor = Math.ceil(data.length / 8) || 1;
          if (idx % skipFactor !== 0 && idx !== data.length - 1) return null;
          const isHovered = hoveredIndex === idx;
          return (
            <text
              key={`xlabel-${idx}`}
              x={p.x}
              y={height - paddingBottom + 20}
              textAnchor="middle"
              className="font-bold"
              style={{
                fontSize: isHovered ? '10px' : '9px',
                fill: isHovered ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                transition: 'all 0.2s ease',
                letterSpacing: '0.3px',
              }}
            >
              {p.label}
            </text>
          );
        })}

        {/* Average revenue reference line */}
        <g clipPath="url(#chartReveal)">
          <line
            x1={paddingLeft}
            y1={avgY}
            x2={width - paddingRight}
            y2={avgY}
            stroke="#10b981"
            strokeWidth={1.2}
            strokeDasharray="5 3"
            opacity={0.6}
          />
        </g>

        {/* Order volume bars (behind the line) */}
        <g clipPath="url(#chartReveal)">
          {orderBarData.map((bar, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <rect
                key={`bar-${idx}`}
                x={bar.x}
                y={isAnimated ? bar.y : paddingTop + chartHeight}
                width={bar.width}
                height={isAnimated ? bar.height : 0}
                rx={bar.width / 2}
                fill={isHovered ? '#8b5cf6' : 'url(#barGrad)'}
                opacity={isHovered ? 0.7 : 0.45}
                style={{
                  transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.04}s`,
                }}
              />
            );
          })}
        </g>

        {/* Revenue area fill */}
        <g clipPath="url(#chartReveal)">
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#revenueAreaGrad)"
              opacity={isAnimated ? 1 : 0}
              style={{ transition: 'opacity 0.8s ease 0.3s' }}
            />
          )}
        </g>

        {/* Revenue line */}
        <g clipPath="url(#chartReveal)">
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#lineGlow)"
              opacity={isAnimated ? 1 : 0}
              style={{ transition: 'opacity 0.6s ease 0.2s' }}
            />
          )}
        </g>

        {/* Hover vertical guide */}
        {hoveredIndex !== null && (
          <line
            x1={revenuePoints[hoveredIndex].x}
            y1={paddingTop}
            x2={revenuePoints[hoveredIndex].x}
            y2={paddingTop + chartHeight}
            stroke="#3b82f6"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.5}
          />
        )}

        {/* Data point dots */}
        {revenuePoints.map((p, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <g key={`dot-${idx}`}>
              {/* Outer glow ring on hover */}
              {isHovered && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={14}
                  fill="#3b82f6"
                  opacity={0.08}
                  style={{ transition: 'all 0.2s ease' }}
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : 3.5}
                fill={isHovered ? '#3b82f6' : 'var(--color-bg-card)'}
                stroke={isHovered ? '#60a5fa' : '#3b82f6'}
                strokeWidth={isHovered ? 3 : 2}
                filter={isHovered ? 'url(#dotGlow)' : undefined}
                className="cursor-pointer"
                style={{ transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </g>
          );
        })}
      </svg>

      {/* Premium Tooltip */}
      {hoveredIndex !== null && revenuePoints[hoveredIndex] && (
        <div
          className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-[calc(100%+16px)]"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            animation: 'fadeInUp 0.15s ease forwards',
          }}
        >
          <div className="relative bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-slate-700/40 px-4 py-3 min-w-36">
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-slate-900/95 dark:bg-slate-800/95 border-r border-b border-slate-700/40 rotate-45" />

            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              {revenuePoints[hoveredIndex].label}
            </div>

            <div className="flex items-baseline gap-1.5 mb-1.5">
              <span className="text-lg font-black text-blue-400 tracking-tight">
                {formatPrice(revenuePoints[hoveredIndex].revenue)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 text-violet-400 font-bold">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><rect width="8" height="8" rx="2" /></svg>
                {revenuePoints[hoveredIndex].orders}
              </span>
              <span className="text-slate-400 font-medium">
                {revenuePoints[hoveredIndex].orders === 1 ? 'order' : 'orders'}
              </span>
            </div>

            {/* Avg comparison */}
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              <span className={`text-[10px] font-bold ${
                revenuePoints[hoveredIndex].revenue >= avgRevenue ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {revenuePoints[hoveredIndex].revenue >= avgRevenue ? '↑' : '↓'}{' '}
                {Math.abs(((revenuePoints[hoveredIndex].revenue - avgRevenue) / (avgRevenue || 1)) * 100).toFixed(0)}%
                <span className="text-slate-500 font-medium ml-1">vs avg</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, calc(-100% - 8px)); }
          to { opacity: 1; transform: translate(-50%, calc(-100% - 16px)); }
        }
      `}</style>
    </div>
  );
}
