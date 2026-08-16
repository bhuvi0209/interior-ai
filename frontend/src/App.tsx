import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Home from "./pages/Home";
import UploadRoom from "./pages/UploadRoom";
import StyleSelection from "./pages/StyleSelection";
import FurnitureLibrary from "./pages/FurnitureLibrary";
import RoomEditor from "./pages/RoomEditor";
import Room3D from "./pages/Room3D";
import ProjectSummary from "./pages/ProjectSummary";

import Navbar from "./components/Navbar";
import { ProjectProvider } from "./context/ProjectContext";

function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/upload" element={<UploadRoom />} />

          <Route
            path="/style"
            element={<StyleSelection />}
          />

          <Route
            path="/furniture"
            element={<FurnitureLibrary />}
          />

          <Route
            path="/editor"
            element={<RoomEditor />}
          />

          <Route path="/3d" element={<Room3D />} />

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