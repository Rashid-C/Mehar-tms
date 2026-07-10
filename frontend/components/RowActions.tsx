export default function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button onClick={() => { onEdit(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        className="btn-ghost" style={{ padding: '3px 10px', fontSize: 12 }}>Edit</button>
      <button onClick={onDelete}
        className="btn-danger" style={{ padding: '3px 10px', fontSize: 12 }}>Del</button>
    </div>
  )
}
