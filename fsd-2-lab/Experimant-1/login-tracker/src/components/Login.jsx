import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [name, setName] = useState("");

  return (
    <div className="card login-card">
      <h2>Sign in</h2>
      <div className="stack">
        <input
          type="text"
          placeholder="Enter username"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="row">
          <button onClick={() => login(name)} disabled={!name}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
