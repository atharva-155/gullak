import { useState } from "react";
import BottomSheet from "../components/BottomSheet.jsx";
import AmountInput from "../components/AmountInput.jsx";
import CategorySelector from "../components/CategorySelector.jsx";
import { checkinsApi } from "../api/client.js";
import { daysLeft, formatINR } from "../utils/helpers.js";

export default function JustSpentModal({ goals, weeklyTotal = 0, onClose, onSaved }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const topGoal = [...(goals || [])].sort((a, b) => Number(b.saved_amount || 0) - Number(a.saved_amount || 0))[0];

  async function logSpend() {
    if (!Number(amount) || Number(amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await checkinsApi.create({ amount: Number(amount), category, decision: "spent", goal_id: topGoal?.id });
      await onSaved?.();
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not log this spend.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet title="Just Spent ✓" onClose={onClose}>
      {step === 1 ? (
        <div className="flow-stack">
          <AmountInput value={amount} onChange={setAmount} />
          <CategorySelector value={category} onChange={setCategory} />
          {error && <p className="field-error">{error}</p>}
          <button className="btn btn-warning btn-block" disabled={saving} onClick={logSpend}>Log Spend ✓</button>
        </div>
      ) : (
        <div className="flow-stack">
          <div className="recap-box">
            <p>You just spent {formatINR(amount)} on {category}.</p>
            <p>Your '{topGoal?.name || "top goal"}' is now {Math.max(1, Math.round(Number(amount) / 100))} days further away.</p>
            <p>This week you've spent {formatINR(Number(weeklyTotal) + Number(amount))} total.</p>
            {topGoal && <small>{daysLeft(topGoal.deadline)} days remain for this goal.</small>}
          </div>
          <button className="btn btn-navy btn-block" onClick={onClose}>Got it 👍</button>
        </div>
      )}
    </BottomSheet>
  );
}
