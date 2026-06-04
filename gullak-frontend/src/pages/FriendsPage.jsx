import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Spinner from "../components/Spinner.jsx";
import { friendsApi } from "../api/client.js";

function Avatar({ name }) {
  return <span className="avatar big">{name?.[0]?.toUpperCase() || "G"}</span>;
}

export default function FriendsPage() {
  const location = useLocation();
  const [tab, setTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [friendList, pending] = await Promise.all([friendsApi.list(), friendsApi.pending()]);
      setFriends(friendList);
      setRequests(pending);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [location.pathname]);

  async function search() {
    setError("");
    if (!query.trim()) {
      setError("Type a name, username, or phone number.");
      return;
    }
    setResults(await friendsApi.search(query.trim()));
  }

  async function act(action, id) {
    if (action === "accept") await friendsApi.accept(id);
    if (action === "reject") await friendsApi.reject(id);
    if (action === "request") await friendsApi.request(id);
    if (action === "remove" && window.confirm("Remove this friend?")) await friendsApi.remove(id);
    await load();
    if (query) setResults(await friendsApi.search(query));
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page">
        <div className="page-title-row">
          <h1>Friends</h1>
          <div className="tabs compact-tabs">
            <button className={tab === "friends" ? "active" : ""} onClick={() => setTab("friends")}>👥 Friends</button>
            <button className={tab === "requests" ? "active" : ""} onClick={() => setTab("requests")}>📨 Requests <span className="badge">{requests.length}</span></button>
            <button className={tab === "find" ? "active" : ""} onClick={() => setTab("find")}>🔍 Find</button>
          </div>
        </div>
        {loading ? <div className="center-loader"><Spinner /></div> : (
          <section className="section-block">
            {tab === "friends" && (
              <div className="people-list">
                {friends.length ? friends.map((friend) => (
                  <article className="person-card" key={friend.id}>
                    <Avatar name={friend.name} />
                    <div><h3>{friend.name}</h3><p>@{friend.username} · {friend.phone}</p></div>
                    <button className="btn btn-danger" onClick={() => act("remove", friend.id)}>🗑️ Remove</button>
                  </article>
                )) : <p className="empty-state">No friends yet. Find classmates to start group goals.</p>}
              </div>
            )}
            {tab === "requests" && (
              <div className="people-list">
                {requests.length ? requests.map((request) => (
                  <article className="person-card" key={request.id}>
                    <Avatar name={request.from_user.name} />
                    <div><h3>{request.from_user.name}</h3><p>@{request.from_user.username}</p></div>
                    <button className="btn btn-primary" onClick={() => act("accept", request.id)}>✓ Accept</button>
                    <button className="btn btn-danger" onClick={() => act("reject", request.id)}>✕ Reject</button>
                  </article>
                )) : <p className="empty-state">No pending requests</p>}
              </div>
            )}
            {tab === "find" && (
              <div className="flow-stack">
                <div className="search-row">
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search username, phone, or name" />
                  <button className="btn btn-navy" onClick={search}>Search</button>
                </div>
                {error && <p className="field-error">{error}</p>}
                <div className="people-list">
                  {results.map((person) => (
                    <article className="person-card" key={person.id}>
                      <Avatar name={person.name} />
                      <div><h3>{person.name}</h3><p>@{person.username}</p></div>
                      {person.relationship === "friends" && <span className="status-pill success">Friends ✓</span>}
                      {person.relationship === "sent" && <span className="status-pill muted">Sent ✓</span>}
                      {person.relationship === "none" && <button className="btn btn-navy" onClick={() => act("request", person.id)}>+ Add</button>}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
