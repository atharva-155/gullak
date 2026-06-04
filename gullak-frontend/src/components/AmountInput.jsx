export default function AmountInput({ value, onChange, label = "Amount" }) {
  return (
    <label className="amount-input">
      <span>{label}</span>
      <div>
        <strong>₹</strong>
        <input
          type="number"
          min="1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0"
          autoFocus
        />
      </div>
    </label>
  );
}
