import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

function About() {
  return (
    <Container>
      <Typography variant="h4" component="h2" gutterBottom>
        About Page
      </Typography>
      <Typography>
        This experiment demonstrates using component libraries (Material-UI and Bootstrap) together.
      </Typography>
    </Container>
  )
}

export default About;
