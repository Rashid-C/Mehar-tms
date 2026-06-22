interface PageHeaderProps {
  title: string
  subtitle?: string
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h2 className="font-bold text-2xl sm:text-3xl leading-tight" style={{ color: '#1e1b4b' }}>{title}</h2>
      {subtitle && (
        <p className="text-xs font-semibold tracking-widest mt-1.5" style={{ color: '#a5b4fc', letterSpacing: '2px' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
