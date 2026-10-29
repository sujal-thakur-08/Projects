import { Link } from 'react-router-dom'

function LoginPage() {
  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">React Router</p>
        <h1>Login</h1>
        <p className="subtitle">Sign in using the login form below.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" placeholder="name@example.com" required />
          </label>

          <label>
            Password
            <input type="password" placeholder="Enter your password" required />
          </label>

          <button type="submit">Login</button>
        </form>

        <p className="switch-text">
          Don&apos;t have an account? <Link to="/signup">Create one here</Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage