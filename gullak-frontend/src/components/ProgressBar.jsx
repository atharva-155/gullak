export default function ProgressBar({ value = 0 }) {
  const safeValue = Math.min(100, Math.max(0, Number(value || 0)));
  return (
    <div className="progress-track" aria-label={`${Math.round(safeValue)} percent complete`}>
      <div className="progress-fill" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
