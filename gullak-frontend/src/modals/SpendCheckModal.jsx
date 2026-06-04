import { useMemo, useState } from "react";
import BottomSheet from "../components/BottomSheet.jsx";
import AmountInput from "../components/AmountInput.jsx";
import CategorySelector from "../components/CategorySelector.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { checkinsApi, goalsApi } from "../api/client.js";
import { formatINR, getRealityCheckMessage, progressPercent } from "../utils/helpers.js";

export default function SpendCheckModal({ goals, onClose, onSaved }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [savedGoal, setSavedGoal] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const check = useMemo(() => getRealityCheckMessage(Number(amount), goals, category), [amount, goals, category]);

  function validate() {
    if (!Number(amount) || Number(amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return false;
    }
    setError("");
    return true;
  }

  async function skipAndSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await checkinsApi.create({ amount: Number(amount), category, decision: "skipped", goal_id: check.goal?.id });
      if (check.goal?.id) {
        const updated = await goalsApi.addSavings(check.goal.id, Number(amount));
        setSavedGoal(updated);
      } else {
        setSavedGoal(check.goal);
      }
      await onSaved?.();
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save this check-in.");
    } finally {
      setSaving(false);
    }
  }

  async function spendAnyway() {
    if (!validate()) return;
    setSaving(true);
    try {
      await checkinsApi.create({ amount: Number(amount), category, decision: "spent", goal_id: check.goal?.id });
      await onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not log this spend.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet title="About to Spend 💸" onClose={onClose}>
      {step === 1 && (
        <div className="flow-stack">
          <AmountInput value={amount} onChange={setAmount} />
          <CategorySelector value={category} onChange={setCategory} />
          {error && <p className="field-error">{error}</p>}
          <button className="btn btn-primary btn-block" onClick={() => validate() && setStep(2)}>Check Impact →</button>
        </div>
      )}

      {step === 2 && (
        <div className="flow-stack">
          <div className="big-amount">{formatINR(amount)}</div>
          <h3 className={`reality ${check.intensity}`}>{check.headline}</h3>
          <div className="comparison-box">{check.comparison}</div>
          {error && <p className="field-error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={saving} onClick={skipAndSave}>Skip & Save 💚</button>
          <button className="btn btn-warning btn-block" onClick={() => setStep(1)}>Reduce Amount ✏️</button>
          <button className="btn btn-muted btn-block" disabled={saving} onClick={spendAnyway}>Spend Anyway</button>
        </div>
      )}

      {step === 3 && (
        <div className="flow-stack celebrate">
          <div className="checkmark">✓</div>
          <h3>{formatINR(amount)} saved! 🎉</h3>
          <p>Added to '{savedGoal?.name || check.goal?.name}'</p>
          <ProgressBar value={progressPercent(savedGoal || check.goal)} />
          <button className="btn btn-primary btn-block" onClick={onClose}>Back to Home 🏠</button>
        </div>
      )}
    </BottomSheet>
  );
}
