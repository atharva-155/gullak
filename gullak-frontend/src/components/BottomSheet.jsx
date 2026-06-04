export default function BottomSheet({ title, children, onClose }) {
  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true">
      <button className="sheet-backdrop" aria-label="Close modal" onClick={onClose} />
      <section className="bottom-sheet">
        <div className="sheet-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}
