import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { userName, logout, loginCount } = useAuth();
  return (
    <div className="card">
      <h2>Welcome, {userName}</h2>
      <p className="muted">You're logged in.</p>

      <div style={{ marginTop: ".5rem", marginBottom: ".5rem" }}>
        <strong>Total logins:</strong> {loginCount}
      </div>

      <div className="row" style={{ marginTop: ".5rem" }}>
        <button className="secondary" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

