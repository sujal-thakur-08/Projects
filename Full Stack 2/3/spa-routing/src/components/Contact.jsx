import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

function Contact() {
  return (
    <Container>
      <Typography variant="h4" component="h2" gutterBottom>
        Contact Page
      </Typography>

      <form className="mb-3">
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input className="form-control" placeholder="Your name" />
        </div>

        <div className="mb-3">
          <label className="form-label">Message</label>
          <textarea className="form-control" rows={4} placeholder="Your message" />
        </div>

        <button className="btn btn-primary">Send</button>
      </form>
    </Container>
  )
}

export default Contact;
