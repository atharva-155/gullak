import { useState } from "react";
import BottomSheet from "../components/BottomSheet.jsx";
import { goalEmojis } from "../utils/helpers.js";

export default function GoalFormModal({ initialGoal, onClose, onSave }) {
  const [form, setForm] = useState({
    name: initialGoal?.name || "",
    target_amount: initialGoal?.target_amount || "",
    deadline: initialGoal?.deadline || "",
    emoji: initialGoal?.emoji || goalEmojis[0]
  });
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.name || !Number(form.target_amount) || !form.deadline) {
      setError("Name, target amount, and deadline are required.");
      return;
    }
    await onSave({ ...form, target_amount: Number(form.target_amount) });
  }

  return (
    <BottomSheet title={initialGoal ? "Edit Goal" : "Add New Goal"} onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <label>Goal Name<input value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
        <label>Target Amount<input type="number" value={form.target_amount} onChange={(event) => update("target_amount", event.target.value)} /></label>
        <label>Deadline<input type="date" value={form.deadline} onChange={(event) => update("deadline", event.target.value)} /></label>
        <div className="emoji-picker">
          {goalEmojis.map((emoji) => (
            <button type="button" className={form.emoji === emoji ? "selected" : ""} key={emoji} onClick={() => update("emoji", emoji)}>{emoji}</button>
          ))}
        </div>
        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-primary btn-block" type="submit">Save Goal</button>
      </form>
    </BottomSheet>
  );
}
