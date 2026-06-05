import { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  children: ReactNode
}

export default function FormField({ label, required, children }: FormFieldProps) {
  return (
    <div>
      <label className="block mb-2 text-xs font-semibold tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px' }}>
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  )
}
