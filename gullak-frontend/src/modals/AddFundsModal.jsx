import { useState } from "react";
import BottomSheet from "../components/BottomSheet.jsx";
import AmountInput from "../components/AmountInput.jsx";
import { formatINR } from "../utils/helpers.js";

export default function AddFundsModal({ goal, isGroup, onClose, onSave }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    if (!Number(amount) || Number(amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    await onSave(goal, Number(amount), isGroup);
  }

  return (
    <BottomSheet title="Add Funds" onClose={onClose}>
      <div className="flow-stack">
        <div className="selected-goal">
          <span>{goal?.emoji || "🎯"}</span>
          <div>
            <strong>{goal?.name}</strong>
            <small>{formatINR(goal?.saved_amount)} saved so far</small>
          </div>
        </div>
        <AmountInput value={amount} onChange={setAmount} label={isGroup ? "Contribution" : "Savings"} />
        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-primary btn-block" onClick={submit}>Add to Savings 💚</button>
      </div>
    </BottomSheet>
  );
}
