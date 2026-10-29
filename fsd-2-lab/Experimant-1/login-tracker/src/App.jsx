import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function AppInner() {
  const { userName, loginCount } = useAuth();
  return (
    <div className="app">
      <header className="header">
        <div className="site-title">
          <strong>Login Tracker</strong>
        </div>
        <div className="login-stat">Total logins: <strong>{loginCount}</strong></div>
      </header>

      <main>
        {userName ? <Dashboard /> : <Login />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
