import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import GoalCard from "../components/GoalCard.jsx";
import Spinner from "../components/Spinner.jsx";
import GoalFormModal from "../modals/GoalFormModal.jsx";
import GroupGoalFormModal from "../modals/GroupGoalFormModal.jsx";
import AddFundsModal from "../modals/AddFundsModal.jsx";
import { friendsApi, goalsApi, groupGoalsApi } from "../api/client.js";

export default function GoalsPage() {
  const location = useLocation();
  const [tab, setTab] = useState("personal");
  const [goals, setGoals] = useState([]);
  const [groupGoals, setGroupGoals] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [fundGoal, setFundGoal] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [personal, groups, friendList] = await Promise.all([goalsApi.list(), groupGoalsApi.list(), friendsApi.list()]);
      setGoals(personal);
      setGroupGoals(groups);
      setFriends(friendList);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [location.pathname]);

  async function saveGoal(data) {
    if (editingGoal) await goalsApi.update(editingGoal.id, data);
    else await goalsApi.create(data);
    setEditingGoal(null);
    setShowGoalForm(false);
    await load();
  }

  async function deleteGoal(goal) {
    if (window.confirm(`Delete ${goal.name}?`)) {
      await goalsApi.remove(goal.id);
      await load();
    }
  }

  async function createGroupGoal(data) {
    await groupGoalsApi.create(data);
    setShowGroupForm(false);
    await load();
  }

  async function saveFunds(goal, amount, isGroup) {
    if (isGroup) await groupGoalsApi.contribute(goal.id, amount);
    else await goalsApi.addSavings(goal.id, amount);
    setFundGoal(null);
    await load();
  }

  async function nudge(goalId, memberUserId) {
    await groupGoalsApi.nudge(goalId, memberUserId);
    await load();
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page">
        <div className="page-title-row">
          <h1>Goals</h1>
          <div className="tabs compact-tabs">
            <button className={tab === "personal" ? "active" : ""} onClick={() => setTab("personal")}>🎯 My Goals</button>
            <button className={tab === "group" ? "active" : ""} onClick={() => setTab("group")}>👥 Group Goals</button>
          </div>
        </div>
        {loading ? <div className="center-loader"><Spinner /></div> : (
          tab === "personal" ? (
            <section className="section-block">
              <div className="section-heading">
                <h2>Personal Savings</h2>
                <button className="btn btn-primary" onClick={() => setShowGoalForm(true)}>+ Add New Goal</button>
              </div>
              <div className="goal-list colored-list">
                {goals.length ? goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onAddFunds={(g) => setFundGoal({ goal: g, isGroup: false })}
                    onEdit={(g) => { setEditingGoal(g); setShowGoalForm(true); }}
                    onDelete={deleteGoal}
                  />
                )) : <p className="empty-state">Set your first goal to get started</p>}
              </div>
            </section>
          ) : (
            <section className="section-block">
              <div className="section-heading">
                <h2>Shared Savings</h2>
                <button className="btn btn-primary" onClick={() => setShowGroupForm(true)}>+ Create Group Goal</button>
              </div>
              <div className="goal-list colored-list">
                {groupGoals.length ? groupGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} group onAddFunds={(g) => setFundGoal({ goal: g, isGroup: true })} onNudge={nudge} />
                )) : <p className="empty-state">Create a group goal with your friends</p>}
              </div>
            </section>
          )
        )}
      </main>
      {showGoalForm && <GoalFormModal initialGoal={editingGoal} onSave={saveGoal} onClose={() => { setShowGoalForm(false); setEditingGoal(null); }} />}
      {showGroupForm && <GroupGoalFormModal friends={friends} onSave={createGroupGoal} onClose={() => setShowGroupForm(false)} />}
      {fundGoal && <AddFundsModal goal={fundGoal.goal} isGroup={fundGoal.isGroup} onSave={saveFunds} onClose={() => setFundGoal(null)} />}
    </div>
  );
}
