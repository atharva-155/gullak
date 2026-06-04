export const categories = [
  { name: "Food", emoji: "🍕" },
  { name: "Shopping", emoji: "🛍️" },
  { name: "Entertainment", emoji: "🎮" },
  { name: "Travel", emoji: "✈️" },
  { name: "Other", emoji: "📦" }
];

export const goalEmojis = ["🏖️", "🎮", "📱", "🎓", "🚗", "💊"];

export function formatINR(value = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function daysLeft(deadline) {
  if (!deadline) return 0;
  const today = new Date();
  const end = new Date(deadline);
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end - today) / 86400000));
}

export function progressPercent(goal) {
  const target = Number(goal?.target_amount || 0);
  if (target <= 0) return 0;
  return Math.min(100, Math.round((Number(goal?.saved_amount || 0) / target) * 100));
}

export function getRealityCheckMessage(amount, goals, category) {
  const parsedAmount = Number(amount || 0);
  const fallbackGoal = { name: "your goal", target_amount: 1, saved_amount: 0, deadline: null };
  const topGoal = [...(goals || [])].sort((a, b) => Number(b.saved_amount || 0) - Number(a.saved_amount || 0))[0] || fallbackGoal;
  const remaining = Math.max(1, Number(topGoal.target_amount || 0) - Number(topGoal.saved_amount || 0));
  const percent = (parsedAmount / remaining) * 100;
  const roundedPercent = Math.round(percent);
  const chai = Math.max(1, Math.round(parsedAmount / 15));
  const canteen = Math.max(1, Math.round(parsedAmount / 60));
  const movies = Math.max(1, Math.round(parsedAmount / 200));
  const comparison = `That's ${chai} cups of chai • ${canteen} canteen meals • ${movies} movie tickets`;

  if (percent > 50) {
    return {
      goal: topGoal,
      headline: `This one spend = ${roundedPercent}% of your '${topGoal.name}' budget. Think twice.`,
      comparison,
      intensity: "high"
    };
  }

  if (percent >= 15) {
    return {
      goal: topGoal,
      headline: `Hold up. ${formatINR(parsedAmount)} is a big chunk — ${roundedPercent}% of your '${topGoal.name}' goal. Sure?`,
      comparison,
      intensity: "high"
    };
  }

  if (percent >= 5) {
    return {
      goal: topGoal,
      headline: `${formatINR(parsedAmount)} = ${roundedPercent}% of your '${topGoal.name}' goal. That's ${canteen} canteen meals worth.`,
      comparison,
      intensity: "medium"
    };
  }

  const savedDays = Math.max(1, Math.round(parsedAmount / Math.max(1, remaining / Math.max(1, daysLeft(topGoal.deadline)))));
  return {
    goal: topGoal,
    headline: `Small spend, but every rupee counts. Skip it and you're ${savedDays} days closer to '${topGoal.name}'.`,
    comparison,
    intensity: "low"
  };
}
