import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home";
import About from "./components/About";
import Contact from "./components/Contact";
import Projects from "./components/Projects";

import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box' 

function App() {
  return (
    <BrowserRouter>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SPA Routing (Experiment 3)
          </Typography>
          <nav>
            <Link to="/" className="btn btn-link text-white">Home</Link>
            <Link to="/about" className="btn btn-link text-white">About</Link>
            <Link to="/projects" className="btn btn-link text-white">Projects</Link>
            <Link to="/contact" className="btn btn-link text-white">Contact</Link>
          </nav>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Box>
    </BrowserRouter>
  );
}

export default App;
