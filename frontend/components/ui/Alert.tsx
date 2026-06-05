interface AlertProps {
  type: 'error' | 'success'
  message: string
}

export default function Alert({ type, message }: AlertProps) {
  if (!message) return null
  const isError = type === 'error'
  return (
    <div
      className="rounded-xl px-4 py-3 mb-5 text-sm"
      style={{
        background: isError ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
        border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(74,222,128,0.3)'}`,
        color: isError ? '#f87171' : '#4ade80',
      }}
    >
      {message}
    </div>
  )
}
