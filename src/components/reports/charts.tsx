'use client'

// Recharts wrappers for the report dashboards. Brand primary #1565D8;
// comparison series in neutral slate; semantic amber/red reserved for
// warning/overdue meanings only.

import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LabelList,
  ScatterChart, Scatter
} from 'recharts'
import { formatINR, formatINRFull, monthLabel } from './format'

const BLUE = '#1565D8'
const BLUE_LIGHT = '#93C5FD'
const SLATE = '#CBD5E1'
const AMBER = '#F59E0B'
const RED = '#DC2626'

const axisStyle = { fontSize: 11, fill: '#64748B' }
const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
}

export function FeeTrendChart({
  data
}: {
  data: { month: string; billed: number; collected: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="month" tickFormatter={monthLabel} tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={v => formatINR(v)} tick={axisStyle} tickLine={false} axisLine={false} width={56} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={l => monthLabel(String(l))}
          formatter={((v: number, name: string) => [formatINRFull(v), name === 'billed' ? 'Billed' : 'Collected']) as never}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} formatter={v => (v === 'billed' ? 'Billed' : 'Collected')} />
        <Bar dataKey="billed" fill={BLUE_LIGHT} radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Line dataKey="collected" stroke={BLUE} strokeWidth={2.5} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  FOLLOW_UP_PENDING: 'Follow-up pending',
  CONVERTED: 'Converted',
  NOT_INTERESTED: 'Not interested'
}

export function FunnelChart({
  data,
  compareLabel
}: {
  data: { status: string; count: number; prevCount: number | null }[]
  compareLabel?: string | null
}) {
  const rows = data.map(d => ({ ...d, label: STATUS_LABELS[d.status] ?? d.status }))
  const hasPrev = compareLabel && rows.some(r => r.prevCount !== null)
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 32, left: 8, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" tick={axisStyle} width={120} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {hasPrev && (
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={v => (v === 'count' ? 'This year' : compareLabel)}
          />
        )}
        <Bar dataKey="count" fill={BLUE} radius={[0, 3, 3, 0]} maxBarSize={16}>
          <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: '#334155' }} />
        </Bar>
        {hasPrev && <Bar dataKey="prevCount" fill={SLATE} radius={[0, 3, 3, 0]} maxBarSize={16} />}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SourceBars({
  data
}: {
  data: { source: string; leads: number; converted: number; conversionPct: number }[]
}) {
  const rows = data.slice(0, 8).map(d => ({
    ...d,
    label: d.source.replace(/_/g, ' '),
    pct: Math.round(d.conversionPct * 100)
  }))
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, rows.length * 34)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 48, left: 8, bottom: 0 }}>
        <XAxis type="number" hide domain={[0, 100]} />
        <YAxis type="category" dataKey="label" tick={axisStyle} width={110} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={((v: number, _n: string, item: { payload: { converted: number; leads: number; label: string } }) => [
            `${v}% conversion · ${item.payload.converted}/${item.payload.leads} leads`,
            item.payload.label
          ]) as never}
        />
        <Bar dataKey="pct" fill={BLUE} radius={[0, 3, 3, 0]} maxBarSize={16}>
          <LabelList
            dataKey="leads"
            position="right"
            formatter={((v: number) => `${v} lead${v === 1 ? '' : 's'}`) as never}
            style={{ fontSize: 11, fill: '#64748B' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CapacityBars({
  data
}: {
  data: { grade: string; totalSeats: number; filledSeats: number }[]
}) {
  const rows = data.map(d => ({
    ...d,
    open: Math.max(0, d.totalSeats - d.filledSeats),
    pct: d.totalSeats > 0 ? d.filledSeats / d.totalSeats : 0
  }))
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, rows.length * 34)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 32, left: 8, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="grade" tick={axisStyle} width={90} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={((v: number, name: string) => [v, name === 'filledSeats' ? 'Filled' : 'Open']) as never}
        />
        <Bar dataKey="filledSeats" stackId="cap" maxBarSize={16}>
          {rows.map((r, i) => (
            <Cell key={i} fill={r.pct >= 0.9 ? AMBER : BLUE} />
          ))}
        </Bar>
        <Bar dataKey="open" stackId="cap" fill="#E2E8F0" radius={[0, 3, 3, 0]} maxBarSize={16}>
          <LabelList
            dataKey="pct"
            position="right"
            formatter={((v: number) => `${Math.round(v * 100)}%`) as never}
            style={{ fontSize: 11, fill: '#64748B' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

const BUCKET_COLORS = [BLUE_LIGHT, BLUE, AMBER, RED]

export function AgeingChart({
  data
}: {
  data: { bucket: string; amount: number; count: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="bucket" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={v => formatINR(v)} tick={axisStyle} tickLine={false} axisLine={false} width={56} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={((v: number, _n: string, item: { payload: { count: number; bucket: string } }) => [
            `${formatINRFull(v)} · ${item.payload.count} invoice${item.payload.count === 1 ? '' : 's'}`,
            `${item.payload.bucket} days`
          ]) as never}
        />
        <Bar dataKey="amount" radius={[3, 3, 0, 0]} maxBarSize={48}>
          {data.map((_, i) => (
            <Cell key={i} fill={BUCKET_COLORS[i] ?? RED} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

const DONUT_COLORS = ['#1565D8', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#EFF6FF', '#CBD5E1', '#94A3B8']

export function MethodDonut({
  data
}: {
  data: { method: string; amount: number; count: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="method"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={((v: number, name: string) => [formatINRFull(v), name.replace(/_/g, ' ')]) as never}
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          formatter={v => String(v).replace(/_/g, ' ')}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function SimpleBars({
  data,
  xKey,
  yKey,
  yLabel
}: {
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  yLabel?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} interval={0} angle={data.length > 8 ? -30 : 0} height={data.length > 8 ? 60 : 30} textAnchor={data.length > 8 ? 'end' : 'middle'} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={((v: number) => [v, yLabel ?? yKey]) as never} />
        <Bar dataKey={yKey} fill={BLUE} radius={[3, 3, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function PerfScatter({
  data
}: {
  data: { name: string; responseHours: number | null; conversionPct: number; assigned: number }[]
}) {
  const rows = data
    .filter(d => d.responseHours !== null)
    .map(d => ({ ...d, pct: Math.round(d.conversionPct * 100) }))
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          type="number" dataKey="responseHours" name="Median response (h)"
          tick={axisStyle} tickLine={false} axisLine={false}
          label={{ value: 'Median response (hours)', position: 'insideBottom', offset: -4, style: { fontSize: 10, fill: '#94A3B8' } }}
        />
        <YAxis
          type="number" dataKey="pct" name="Conversion %"
          tick={axisStyle} tickLine={false} axisLine={false} width={40}
          label={{ value: 'Conversion %', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#94A3B8' } }}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={((v: number, name: string) => [name === 'pct' ? `${v}%` : `${v}h`, name === 'pct' ? 'Conversion' : 'Response']) as never}
          labelFormatter={() => ''}
        />
        <Scatter data={rows} fill={BLUE} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
