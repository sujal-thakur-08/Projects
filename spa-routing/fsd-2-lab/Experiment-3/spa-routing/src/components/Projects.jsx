import { Link } from "react-router-dom";
import ProjectCard from "./ProjectCard";
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

function Projects() {
  const projects = [
    {
      id: "proj-1",
      title: "Portfolio Site",
      description:
        "A personal portfolio built with Vite + React to showcase projects and blog posts.",
      tech: ["React", "Vite", "CSS"],
      path: "/",
    },
    {
      id: "proj-2",
      title: "Routing Demo",
      description: "Small SPA demonstrating react-router routing and nested routes.",
      tech: ["React", "react-router"],
      path: "/about",
    },
    {
      id: "proj-3",
      title: "Contact Form",
      description: "A contact form with client-side validation and mock submission.",
      tech: ["React", "HTML"],
      path: "/contact",
    },
  ];

  return (
    <Container>
      <Typography variant="h4" component="h2" gutterBottom>
        Projects
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {projects.map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <ProjectCard project={p} />
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1">Quick links:</Typography>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <Link to={p.path}>{p.title}</Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}

export default Projects;
