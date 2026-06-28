interface StatCardProps {
  label: string
  value: string | number
  color?: 'blue' | 'green' | 'dark' | 'gold' | 'amber' | 'red'
  icon?: string
}

const colorMap: Record<string, { accent: string; bg: string; border: string }> = {
  blue:  { accent: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  green: { accent: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  dark:  { accent: '#1e293b', bg: '#f8fafc', border: '#e2e8f0' },
  gold:  { accent: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  amber: { accent: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  red:   { accent: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

export default function StatCard({ label, value, color = 'dark', icon }: StatCardProps) {
  const { accent, bg, border } = colorMap[color] ?? colorMap.dark
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e8ecf0',
      borderRadius: 8,
      padding: '16px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>
          {label}
        </p>
        {icon && (
          <div style={{ width: 32, height: 32, borderRadius: 6, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: accent }}>
            {icon}
          </div>
        )}
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: accent, margin: 0, lineHeight: 1.2 }}>
        {value}
      </p>
    </div>
  )
}
