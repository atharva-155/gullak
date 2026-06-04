import { useMemo, useState } from "react";
import BottomSheet from "../components/BottomSheet.jsx";
import { formatINR, goalEmojis } from "../utils/helpers.js";

export default function GroupGoalFormModal({ friends, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", target_amount: "", deadline: "", emoji: goalEmojis[0], member_ids: [] });
  const [error, setError] = useState("");
  const share = useMemo(() => Number(form.target_amount || 0) / Math.max(1, form.member_ids.length + 1), [form]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleMember(id) {
    setForm((current) => ({
      ...current,
      member_ids: current.member_ids.includes(id)
        ? current.member_ids.filter((memberId) => memberId !== id)
        : [...current.member_ids, id]
    }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.name || !Number(form.target_amount) || !form.deadline || form.member_ids.length === 0) {
      setError("Add goal details and choose at least one friend.");
      return;
    }
    await onSave({ ...form, target_amount: Number(form.target_amount) });
  }

  return (
    <BottomSheet title="Create Group Goal" onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <label>Goal Name<input value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
        <label>Target Amount<input type="number" value={form.target_amount} onChange={(event) => update("target_amount", event.target.value)} /></label>
        <label>Deadline<input type="date" value={form.deadline} onChange={(event) => update("deadline", event.target.value)} /></label>
        <div className="emoji-picker">
          {goalEmojis.map((emoji) => (
            <button type="button" className={form.emoji === emoji ? "selected" : ""} key={emoji} onClick={() => update("emoji", emoji)}>{emoji}</button>
          ))}
        </div>
        <div className="friend-select-list">
          {friends.map((friend) => (
            <label className="checkbox-row" key={friend.id}>
              <input type="checkbox" checked={form.member_ids.includes(friend.id)} onChange={() => toggleMember(friend.id)} />
              <span>{friend.name} @{friend.username}</span>
            </label>
          ))}
        </div>
        <p className="share-line">Each person's share: {formatINR(share)}</p>
        <small>You'll be automatically added as a member.</small>
        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-primary btn-block" type="submit">Save Group Goal</button>
      </form>
    </BottomSheet>
  );
}
