import {
  createContext,
  useContext,
  useState,
} from "react";

import type { ReactNode } from "react";

import type {
  Project,
} from "../types/Project";

interface ProjectContextType {
  project: Project;

  setProject: React.Dispatch<
    React.SetStateAction<Project>
  >;

  undo: () => void;
  redo: () => void;

  canUndo: boolean;
  canRedo: boolean;
}

const ProjectContext =
  createContext<ProjectContextType | undefined>(
    undefined
  );

export function ProjectProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [project, setProjectState] =
    useState<Project>({
      roomImage: "",
      style: "",
      furniture: [],
    });

  const [past, setPast] = useState<Project[]>([]);
  const [future, setFuture] = useState<Project[]>([]);

  const setProject: React.Dispatch<
    React.SetStateAction<Project>
  > = (action) => {
    setProjectState((currentProject) => {
      const nextProject =
        typeof action === "function"
          ? action(currentProject)
          : action;

      setPast((currentPast) => [
        ...currentPast,
        currentProject,
      ]);

      setFuture([]);

      return nextProject;
    });
  };

  const undo = () => {
    setPast((currentPast) => {
      if (currentPast.length === 0) {
        return currentPast;
      }

      const previousProject =
        currentPast[currentPast.length - 1];

      setFuture((currentFuture) => [
        project,
        ...currentFuture,
      ]);

      setProjectState(previousProject);

      return currentPast.slice(
        0,
        currentPast.length - 1
      );
    });
  };

  const redo = () => {
    setFuture((currentFuture) => {
      if (currentFuture.length === 0) {
        return currentFuture;
      }

      const nextProject =
        currentFuture[0];

      setPast((currentPast) => [
        ...currentPast,
        project,
      ]);

      setProjectState(nextProject);

      return currentFuture.slice(1);
    });
  };

  return (
    <ProjectContext.Provider
      value={{
        project,
        setProject,

        undo,
        redo,

        canUndo: past.length > 0,
        canRedo: future.length > 0,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context =
    useContext(ProjectContext);

  if (!context) {
    throw new Error(
      "useProject must be used inside ProjectProvider"
    );
  }

  return context;
}