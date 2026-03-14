'use client'

/**
 * Portal analytics charts — client component because Recharts requires the browser.
 */
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

interface DailyDataPoint {
  date: string
  visits: number
}

interface ClientDataPoint {
  name: string
  visits: number
}

interface ActivityDataPoint {
  name: string
  value: number
}

interface Props {
  dailyData: DailyDataPoint[]
  topClientsData: ClientDataPoint[]
  activityBreakdown: ActivityDataPoint[]
}

export function PortalAnalyticsCharts({ dailyData, topClientsData, activityBreakdown }: Props) {
  // Format date labels to show month/day
  const formattedDaily = dailyData.map((d) => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  // Only show every 5th label to avoid crowding
  const tickFormatter = (_: string, index: number) =>
    index % 5 === 0 ? formattedDaily[index]?.label ?? '' : ''

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Line chart: daily visits (spans 2 columns) */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Daily Portal Visits (30d)</h2>
        {dailyData.every((d) => d.visits === 0) ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            No visit data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={formattedDaily} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={tickFormatter}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#0f172a', fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="visits"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie chart: activity breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Activity Types</h2>
        {activityBreakdown.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            No activity yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={activityBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                outerRadius={65}
                stroke="none"
              >
                {activityBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar chart: top clients */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Top Clients by Portal Visits</h2>
        {topClientsData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
            No client activity yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={topClientsData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#475569' }}
                width={120}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="visits" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
