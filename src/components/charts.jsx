import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtNum } from '../lib/format';
import { useCssVars } from '../lib/hooks';
import { cx } from './ui';

const THEME_VARS = ['chart', 'chart-grid', 'ink-3', 'line'];

function ChartTip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="glass-solid rounded-lg px-3 py-2.5 text-[12.5px]">
      <div className="text-ink-3 font-semibold mb-0.5">{p.tipLabel || label}</div>
      <div className="font-bold text-ink tabular-nums">{fmtNum(payload[0].value)} {unit}</div>
    </div>
  );
}

// Single-series area over time: 2px line, soft gradient, hairline grid,
// crosshair + tooltip on hover. One series, so no legend — the card title names it.
export function TrendChart({ data, xKey, yKey, unit = 'appointments', height = 270, label }) {
  const c = useCssVars(THEME_VARS);
  const total = data.reduce((s, d) => s + (d[yKey] || 0), 0);
  return (
    <div style={{ height }} role="img" aria-label={`${label || 'Trend'}: ${data.map((d) => `${d[xKey]} ${d[yKey]}`).join(', ')}. Total ${total}.`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.chart} stopOpacity={0.18} />
              <stop offset="100%" stopColor={c.chart} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={c['chart-grid']} />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fill: c['ink-3'], fontSize: 12 }} dy={8} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: c['ink-3'], fontSize: 12 }} width={44} />
          <Tooltip content={<ChartTip unit={unit} />} cursor={{ stroke: c['ink-3'], strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={c.chart}
            strokeWidth={2}
            fill="url(#trendFill)"
            dot={false}
            activeDot={{ r: 5, fill: c.chart, stroke: 'var(--sa-page)', strokeWidth: 2 }}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Horizontal magnitude bars as plain HTML: label left, value right, one hue.
// Values are always printed, so nothing depends on reading bar length alone.
export function BarList({ items, empty = 'No data yet' }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <div className="text-ink-3 text-[13px] py-6 text-center">{empty}</div>;
  return (
    <div className="flex flex-col gap-3.5">
      {items.map((item) => (
        <div key={item.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 items-center" title={`${item.title || item.key}: ${fmtNum(item.value)}`}>
          <div className="text-[13px] font-semibold flex items-center gap-2 min-w-0">{item.label}</div>
          <div className="text-[13px] font-bold tabular-nums">{fmtNum(item.value)}</div>
          <div className="col-span-2 h-2 rounded-full bg-hover overflow-hidden">
            <div
              className={cx('h-full rounded-full bg-chart transition-[width] duration-700 ease-out', item.value === 0 && 'opacity-0')}
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
