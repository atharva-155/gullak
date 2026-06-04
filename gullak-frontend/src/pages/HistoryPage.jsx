import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Spinner from "../components/Spinner.jsx";
import { checkinsApi } from "../api/client.js";
import { categories, formatINR } from "../utils/helpers.js";

function categoryEmoji(name) {
  return categories.find((item) => item.name === name)?.emoji || "📦";
}

export default function HistoryPage() {
  const location = useLocation();
  const [weekly, setWeekly] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [summary, rows] = await Promise.all([checkinsApi.weeklySummary(), checkinsApi.history()]);
      setWeekly(summary);
      setHistory(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page">
        <h1>History</h1>
        {loading ? <div className="center-loader"><Spinner /></div> : (
          <>
            <section className="balance-card">
              <h2>Weekly Summary</h2>
              <div className="metric-grid">
                <div><span>Total Spent this week</span><strong>{formatINR(weekly?.total_spent)}</strong></div>
                <div><span>Top Category</span><strong>{categoryEmoji(weekly?.top_category)} {weekly?.top_category || "None"}</strong></div>
              </div>
              <div className="breakdown-list">
                {(weekly?.spend_by_category || []).map((row) => (
                  <div key={row.category}><span>{categoryEmoji(row.category)} {row.category}</span><strong>{formatINR(row.amount)}</strong></div>
                ))}
              </div>
            </section>
            <section className="section-block">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {history.length ? history.map((item) => (
                  <article className="activity-item" key={item.id}>
                    <span className={`activity-icon ${item.decision}`}>{categoryEmoji(item.category)}</span>
                    <div>
                      <h3>{item.category}</h3>
                      <p>{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`decision ${item.decision}`}>{item.decision}</span>
                    <strong className={item.decision === "spent" ? "amount-red" : "amount-green"}>
                      {item.decision === "spent" ? "-" : "+"}{formatINR(item.amount)}
                    </strong>
                  </article>
                )) : <p className="empty-state">No check-ins yet</p>}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
