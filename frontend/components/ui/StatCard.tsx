interface StatCardProps {
  label: string
  value: string | number
  color?: 'blue' | 'green' | 'dark' | 'gold'
  glow?: 'blue' | 'green'
}

const colorMap = {
  blue:  '#2563eb',
  green: '#16a34a',
  dark:  '#1e293b',
  gold:  '#2563eb',
}

export default function StatCard({ label, value, color = 'dark' }: StatCardProps) {
  const accent = colorMap[color]
  return (
    <div className="card relative overflow-hidden p-5 sm:p-6">
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 90, height: 90,
        background: `radial-gradient(circle at top right, ${accent}14 0%, transparent 70%)`,
        borderRadius: '0 20px 0 90px',
      }} />
      <p className="text-[11px] font-bold tracking-widest mb-3" style={{ color: '#93c5fd', letterSpacing: '2px' }}>
        {label}
      </p>
      <p className="text-3xl font-bold leading-none" style={{ color: accent }}>
        {value}
      </p>
      <div className="mt-4 h-px" style={{ background: `linear-gradient(90deg, ${accent}55, transparent)` }} />
    </div>
  )
}
