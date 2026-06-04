import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Spinner from "../components/Spinner.jsx";

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", phone: "", username: "", password: "" });
  const [error, setError] = useState("");
  const { login, register, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/home" replace />;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      if (tab === "login") {
        await login({ phone: form.phone, password: form.password });
      } else {
        await register(form);
      }
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo">🪙</div>
        <h1>Gullak</h1>
        <p>Spend less. Save smarter.</p>
        <div className="tabs">
          <button className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>Login</button>
          <button className={tab === "register" ? "active" : ""} onClick={() => setTab("register")}>Register</button>
        </div>
        <form className="form-stack" onSubmit={submit}>
          {tab === "register" && (
            <>
              <label>Name<input value={form.name} onChange={(event) => update("name", event.target.value)} required /></label>
              <label>Username<input value={form.username} onChange={(event) => update("username", event.target.value)} required /></label>
            </>
          )}
          <label>Phone Number<input value={form.phone} onChange={(event) => update("phone", event.target.value)} required /></label>
          <label>Password<input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} required /></label>
          {error && <p className="field-error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={loading} type="submit">
            {loading ? <Spinner /> : tab === "login" ? "Login" : "Create Account"}
          </button>
        </form>
      </section>
    </main>
  );
}
