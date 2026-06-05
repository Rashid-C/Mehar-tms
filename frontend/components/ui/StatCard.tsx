interface StatCardProps {
  label: string
  value: string | number
  color?: 'gold' | 'blue' | 'white' | 'green'
  glow?: 'gold' | 'blue'
}

const colorMap = {
  gold:  '#D4AF37',
  blue:  '#60a5fa',
  white: '#ffffff',
  green: '#4ade80',
}

const glowMap = {
  gold: 'rgba(212,175,55,0.12)',
  blue: 'rgba(59,130,246,0.1)',
}

export default function StatCard({ label, value, color = 'white', glow }: StatCardProps) {
  return (
    <div
      className="card relative overflow-hidden p-5 sm:p-6"
      style={glow ? { borderColor: glowMap[glow].replace('0.1', '0.25') } : {}}
    >
      {glow && (
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 80, height: 80,
          background: `radial-gradient(circle, ${glowMap[glow]} 0%, transparent 70%)`,
          borderRadius: '0 14px 0 80px',
        }} />
      )}
      <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '2px' }}>
        {label}
      </p>
      <p className="text-3xl font-bold leading-none" style={{ color: colorMap[color] }}>
        {value}
      </p>
      <div className="mt-4 h-px" style={{ background: `linear-gradient(90deg, ${colorMap[color]}44, transparent)` }} />
    </div>
  )
}
