import { memo, useMemo } from 'react'
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

type HealthChartProps = {
  playerHealth: number
}

const HealthChart = memo(function HealthChart({ playerHealth }: HealthChartProps): React.JSX.Element {
  const safeHealth = Math.max(0, Math.min(100, playerHealth))

  const chartData = useMemo(
    () => [
      { name: 'Health', value: safeHealth, fill: '#3ac7aa' },
      { name: 'Damage', value: 100 - safeHealth, fill: '#d85b55' }
    ],
    [safeHealth]
  )

  return (
    <div className="chart-box" aria-label="Player health chart">
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={74} />
          <Tooltip
            formatter={(value, name) => [`${String(value)}%`, name]}
            contentStyle={{ borderRadius: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
})

export default HealthChart
