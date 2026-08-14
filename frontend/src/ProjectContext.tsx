import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

import { Project } from "../types/Project";

type ProjectContextType = {
  project: Project;
  setProject: React.Dispatch<
    React.SetStateAction<Project>
  >;
};

const defaultProject: Project = {
  roomImage: "",
  style: "",
  furniture: [],
};

const ProjectContext =
  createContext<ProjectContextType | undefined>(
    undefined
  );

export function ProjectProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [project, setProject] =
    useState<Project>(defaultProject);

  return (
    <ProjectContext.Provider
      value={{
        project,
        setProject,
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