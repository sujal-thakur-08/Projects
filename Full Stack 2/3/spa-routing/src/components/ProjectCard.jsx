import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

function ProjectCard({ project }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" component="div">
          {project.title}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          {project.description}
        </Typography>
        <Box>
          {project.tech.map((t) => (
            <Chip key={t} label={t} size="small" sx={{ mr: 1, mb: 1 }} />
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}

export default ProjectCard;
