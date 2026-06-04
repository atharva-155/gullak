import ProgressBar from "./ProgressBar.jsx";
import { daysLeft, formatINR, progressPercent } from "../utils/helpers.js";

export default function GoalCard({ goal, compact = false, group = false, onAddFunds, onEdit, onDelete, onNudge }) {
  const percent = progressPercent(goal);
  const members = goal.members || [];

  return (
    <article className={`goal-card ${compact ? "compact" : ""}`}>
      <div className="goal-main">
        <div className="goal-title">
          <span className="goal-emoji">{goal.emoji || "🎯"}</span>
          <div>
            <h3>{goal.name}</h3>
            <p>{daysLeft(goal.deadline)} days left · {formatINR(goal.saved_amount)} of {formatINR(goal.target_amount)}</p>
          </div>
        </div>
        <span className="percent-pill">{percent}%</span>
      </div>
      <ProgressBar value={percent} />
      {group && (
        <div className="members-row">
          <div className="avatar-stack">
            {members.slice(0, 5).map((member) => (
              <span className="avatar" key={member.user_id || member.id}>{member.name?.[0]?.toUpperCase() || "G"}</span>
            ))}
          </div>
          <span>Each person's share: {formatINR(goal.per_member_share || 0)}</span>
        </div>
      )}
      {!compact && group && members.length > 0 && (
        <div className="member-breakdown">
          {members.map((member) => (
            <div key={member.user_id || member.id}>
              <span>{member.name} @{member.username}</span>
              <strong>{formatINR(member.saved_amount || 0)}</strong>
              {onNudge && (
                <button className="btn btn-small btn-soft" onClick={() => onNudge(goal.id, member.user_id)}>👋 Nudge</button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="card-actions">
        <button className="btn btn-primary" onClick={() => onAddFunds(goal, group)}>💰 {group ? "Contribute" : "Add Funds"}</button>
        {!compact && onEdit && <button className="btn btn-soft" onClick={() => onEdit(goal)}>✏️ Edit</button>}
        {!compact && onDelete && <button className="btn btn-danger" onClick={() => onDelete(goal)}>🗑️ Delete</button>}
      </div>
    </article>
  );
}
