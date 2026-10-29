import { Link } from 'react-router-dom'

function SignupPage() {
  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <main className="auth-shell auth-shell--alt">
      <section className="auth-card">
        <p className="eyebrow">React Router</p>
        <h1>Sign Up</h1>
        <p className="subtitle">Create an account using the form below.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input type="text" placeholder="Your full name" required />
          </label>

          <label>
            Email
            <input type="email" placeholder="name@example.com" required />
          </label>

          <label>
            Password
            <input type="password" placeholder="Create a password" required />
          </label>

          <button type="submit">Sign Up</button>
        </form>

        <p className="switch-text">
          Already registered? <Link to="/login">Return to login</Link>
        </p>
      </section>
    </main>
  )
}

export default SignupPage