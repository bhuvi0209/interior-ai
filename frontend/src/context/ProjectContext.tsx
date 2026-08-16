import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

import type { Project } from "../types/Project";

const defaultProject: Project = {
  roomImage: "",
  style: "",
  furniture: [],
};

type ProjectContextType = {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
};

const ProjectContext =
  createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [project, setProject] = useState<Project>(() => {
    const savedProject = localStorage.getItem("interiorProject");

    if (savedProject) {
      return JSON.parse(savedProject);
    }

    return defaultProject;
  });

  const updateProject: React.Dispatch<
    React.SetStateAction<Project>
  > = (value) => {
    setProject((currentProject) => {
      const newProject =
        typeof value === "function"
          ? value(currentProject)
          : value;

      localStorage.setItem(
        "interiorProject",
        JSON.stringify(newProject)
      );

      return newProject;
    });
  };

  return (
    <ProjectContext.Provider
      value={{
        project,
        setProject: updateProject,
      }}
    >
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