interface PageHeaderProps {
  title: string
  subtitle?: string
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-3 mb-1">
        <div style={{ width: 3, height: 22, background: 'linear-gradient(180deg,#D4AF37,#8B6914)', borderRadius: 2, flexShrink: 0 }} />
        <h2 className="text-white font-semibold text-xl">{title}</h2>
      </div>
      {subtitle && (
        <p className="text-xs tracking-widest ml-4" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
