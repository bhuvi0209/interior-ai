import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
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

  saveProject: () => void;
  loadProject: () => void;
  clearSavedProject: () => void;

  exportProject: () => void;
  importProject: (
    file: File
  ) => Promise<void>;
}

const ProjectContext =
  createContext<ProjectContextType | undefined>(
    undefined
  );

const STORAGE_KEY = "interior-ai-project";

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
  const hasLoadedProject =
  useRef(false);
  /*
   * Load project automatically when the app starts.
   */
  useEffect(() => {
  const savedProject =
    localStorage.getItem(STORAGE_KEY);

  if (savedProject) {
    try {
      const parsedProject =
        JSON.parse(savedProject);

      setProjectState(parsedProject);
    } catch (error) {
      console.error(
        "Failed to load saved project:",
        error
      );
    }
  }

  hasLoadedProject.current = true;
}, []);
    useEffect(() => {
  if (!hasLoadedProject.current) {
    return;
  }

  const timeout = setTimeout(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(project)
      );
    } catch (error) {
      console.error(
        "Failed to automatically save project:",
        error
      );
    }
  }, 300);

  return () => {
    clearTimeout(timeout);
  };
}, [project]);
  /*
   * Update project and store history.
   */
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

  /*
   * Undo
   */
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

  /*
   * Redo
   */
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

  /*
   * Save project to browser storage.
   */
  const saveProject = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(project)
      );

      alert("Project saved successfully!");
    } catch (error) {
      console.error(
        "Failed to save project:",
        error
      );

      alert("Failed to save project.");
    }
  };

  /*
   * Load project from browser storage.
   */
  const loadProject = () => {
    const savedProject =
      localStorage.getItem(STORAGE_KEY);

    if (!savedProject) {
      alert("No saved project found.");
      return;
    }

    try {
      const parsedProject =
        JSON.parse(savedProject);

      setProjectState(parsedProject);

      setPast([]);
      setFuture([]);

      alert("Project loaded successfully!");
    } catch (error) {
      console.error(
        "Failed to load project:",
        error
      );

      alert("Failed to load project.");
    }
  };

  /*
   * Remove saved project.
   */
  const clearSavedProject = () => {
    localStorage.removeItem(
      STORAGE_KEY
    );

    alert("Saved project cleared.");
  };
/*
 * Export project as a JSON file.
 */
const exportProject = () => {
  try {
    const projectData =
      JSON.stringify(
        project,
        null,
        2
      );

    const blob = new Blob(
      [projectData],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "interior-ai-project.json";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(
      "Failed to export project:",
      error
    );

    alert(
      "Failed to export project."
    );
  }
};
/*
 * Import project from a JSON file.
 */
const importProject = async (
  file: File
) => {
  try {
    const text =
      await file.text();

    const importedProject =
      JSON.parse(text) as Project;

    /*
     * Basic validation.
     */
    if (
      !importedProject ||
      typeof importedProject !==
        "object"
    ) {
      throw new Error(
        "Invalid project file."
      );
    }

    if (
      !Array.isArray(
        importedProject.furniture
      )
    ) {
      throw new Error(
        "Invalid furniture data."
      );
    }

    /*
     * Update project.
     */
    setProjectState(
      importedProject
    );

    /*
     * Clear undo/redo history
     * because this is a new project state.
     */
    setPast([]);
    setFuture([]);

    /*
     * Also save the imported project
     * into localStorage.
     */
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        importedProject
      )
    );

    alert(
      "Project imported successfully!"
    );
  } catch (error) {
    console.error(
      "Failed to import project:",
      error
    );

    alert(
      "Invalid project file."
    );
  }
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

    saveProject,
    loadProject,
    clearSavedProject,

    exportProject,
    importProject,
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