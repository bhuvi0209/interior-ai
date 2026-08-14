import { createContext, useContext, useState, ReactNode } from "react";

interface Furniture {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface Project {
  roomImage: string;
  style: string;
  furniture: Furniture[];
}

interface ProjectContextType {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(
  undefined
);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project>({
    roomImage: "",
    style: "",
    furniture: [],
  });

  return (
    <ProjectContext.Provider value={{ project, setProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProject must be used inside ProjectProvider");
  }

  return context;
}