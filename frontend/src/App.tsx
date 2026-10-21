import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { ProjectProvider } from "./context/ProjectContext";

import Home from "./pages/Home";
import UploadRoom from "./pages/UploadRoom";
import StyleSelection from "./pages/StyleSelection";
import ProjectSummary from "./pages/ProjectSummary";
import Navbar from "./components/Navbar";
import DesignWorkspace from "./pages/DesignWorkspace";

function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/upload"
            element={<UploadRoom />}
          />

          <Route
            path="/style"
            element={<StyleSelection />}
          />


          <Route
            path="/editor"
            element={<DesignWorkspace />}
          />


      

          <Route
            path="/project"
            element={<ProjectSummary />}
          />
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}

export default App;