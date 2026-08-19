import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import type { Project } from "../types/project";

interface ProjectContextType {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(
  undefined
);

const defaultProject: Project = {
  roomImage: "",
  style: "",
  furniture: [],
};

export function ProjectProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [project, setProjectState] = useState<Project>(() => {
    const savedProject = localStorage.getItem("interior-ai-project");

    if (savedProject) {
      try {
        return JSON.parse(savedProject);
      } catch {
        return defaultProject;
      }
    }

    return defaultProject;
  });

  const setProject: React.Dispatch<
    React.SetStateAction<Project>
  > = (value) => {
    setProjectState((currentProject) => {
      const updatedProject =
        typeof value === "function"
          ? value(currentProject)
          : value;

      localStorage.setItem(
        "interior-ai-project",
        JSON.stringify(updatedProject)
      );

      return updatedProject;
    });
  };

  return (
    <ProjectContext.Provider value={{ project, setProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error(
      "useProject must be used inside ProjectProvider"
    );
  }

  return context;
}