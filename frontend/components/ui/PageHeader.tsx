interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.3 }}>{title}</h2>
        {subtitle && (
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0', fontWeight: 400 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}
