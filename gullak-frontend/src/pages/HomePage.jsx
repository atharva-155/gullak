import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import GoalCard from "../components/GoalCard.jsx";
import Spinner from "../components/Spinner.jsx";
import SpendCheckModal from "../modals/SpendCheckModal.jsx";
import JustSpentModal from "../modals/JustSpentModal.jsx";
import GoalFormModal from "../modals/GoalFormModal.jsx";
import AddFundsModal from "../modals/AddFundsModal.jsx";
import { checkinsApi, dashboardApi, goalsApi, groupGoalsApi } from "../api/client.js";
import { formatINR } from "../utils/helpers.js";

export default function HomePage() {
  const location = useLocation();
  const [summary, setSummary] = useState(null);
  const [goals, setGoals] = useState([]);
  const [groupGoals, setGroupGoals] = useState([]);
  const [weekly, setWeekly] = useState({ total_spent: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [fundGoal, setFundGoal] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [summaryData, goalsData, groupData, weeklyData] = await Promise.all([
        dashboardApi.summary(),
        goalsApi.list(),
        groupGoalsApi.list(),
        checkinsApi.weeklySummary()
      ]);
      setSummary(summaryData);
      setGoals(goalsData);
      setGroupGoals(groupData);
      setWeekly(weeklyData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [location.pathname]);

  async function saveGoal(data) {
    await goalsApi.create(data);
    setModal(null);
    await load();
  }

  async function saveFunds(goal, amount, isGroup) {
    if (isGroup) await groupGoalsApi.contribute(goal.id, amount);
    else await goalsApi.addSavings(goal.id, amount);
    setFundGoal(null);
    await load();
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page">
        {loading ? <div className="center-loader"><Spinner /></div> : (
          <>
            <section className="balance-card">
              <h2>Balance Overview</h2>
              <div className="metric-grid">
                <div><span>Monthly Budget</span><strong>{formatINR(summary?.monthly_budget)}</strong></div>
                <div><span>Spent So Far</span><strong>{formatINR(summary?.total_spent)}</strong></div>
                <div><span>Saved So Far</span><strong>{formatINR(summary?.total_saved)}</strong></div>
              </div>
            </section>
            <div className="action-grid">
              <button className="big-action spend-check" onClick={() => setModal("spend")}>About to Spend 💸</button>
              <button className="big-action just-spent" onClick={() => setModal("spent")}>Just Spent ✓</button>
            </div>
            <section className="section-block">
              <div className="section-heading">
                <h2>🎯 My Goals</h2>
                <button className="btn btn-primary" onClick={() => setModal("goal")}>+ Add Goal</button>
              </div>
              <div className="goal-list">
                {goals.length ? goals.map((goal) => <GoalCard key={goal.id} goal={goal} compact onAddFunds={(g) => setFundGoal({ goal: g, isGroup: false })} />) : <p className="empty-state">Set your first goal to get started</p>}
              </div>
            </section>
            <section className="section-block">
              <div className="section-heading"><h2>👥 Group Goals</h2></div>
              <div className="goal-list">
                {groupGoals.length ? groupGoals.map((goal) => <GoalCard key={goal.id} goal={goal} compact group onAddFunds={(g) => setFundGoal({ goal: g, isGroup: true })} />) : <p className="empty-state">Create a group goal with your friends</p>}
              </div>
            </section>
          </>
        )}
      </main>
      {modal === "spend" && <SpendCheckModal goals={goals} onSaved={load} onClose={() => setModal(null)} />}
      {modal === "spent" && <JustSpentModal goals={goals} weeklyTotal={weekly.total_spent} onSaved={load} onClose={() => setModal(null)} />}
      {modal === "goal" && <GoalFormModal onSave={saveGoal} onClose={() => setModal(null)} />}
      {fundGoal && <AddFundsModal goal={fundGoal.goal} isGroup={fundGoal.isGroup} onSave={saveFunds} onClose={() => setFundGoal(null)} />}
    </div>
  );
}
