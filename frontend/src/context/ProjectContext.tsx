import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { Project } from "../types/Project";

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
  importProject: (file: File) => Promise<void>;

  newProject: () => void;
}

const ProjectContext =
  createContext<ProjectContextType | undefined>(
    undefined
  );

const STORAGE_KEY = "interior-ai-project";

const initialProject: Project = {
  name: "Untitled Project",
  roomImage: "",
  style: "",
  furniture: [],
  room: {
    width: 800,
    depth: 500,
    wallHeight: 300,
  },
};

export function ProjectProvider({
  children,
}: {
  children: ReactNode;
}) {
  /*
   * Load project from localStorage when the app starts.
   */
  const [project, setProjectState] =
    useState<Project>(() => {
      const savedProject =
        localStorage.getItem(STORAGE_KEY);

      if (!savedProject) {
        return initialProject;
      }

      try {
        const parsedProject =
          JSON.parse(savedProject) as Partial<Project>;

        return {
          ...initialProject,
          ...parsedProject,

          /*
           * Make sure furniture is always an array.
           */
          furniture: Array.isArray(
            parsedProject.furniture
          )
            ? parsedProject.furniture
            : [],

          /*
           * Make sure old projects also get
           * the new room settings.
           */
          room: {
            ...initialProject.room,
            ...(parsedProject.room ?? {}),
          },
        };
      } catch (error) {
        console.error(
          "Failed to load saved project:",
          error
        );

        return initialProject;
      }
    });

  /*
   * Undo history
   */
  const [past, setPast] =
    useState<Project[]>([]);

  /*
   * Redo history
   */
  const [future, setFuture] =
    useState<Project[]>([]);

  /*
   * Automatically save the current project.
   */
  useEffect(() => {
    const timeout =
      setTimeout(() => {
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
   * Update project.
   *
   * Every normal project change creates
   * an undo history entry.
   */
  const setProject: React.Dispatch<
    React.SetStateAction<Project>
  > = (action) => {
    setProjectState((currentProject) => {
      const nextProject =
        typeof action === "function"
          ? action(currentProject)
          : action;

      if (nextProject === currentProject) {
        return currentProject;
      }

      /*
       * Save current state for undo.
       */
      setPast((currentPast) => [
        ...currentPast,
        currentProject,
      ]);

      /*
       * Any new change clears redo history.
       */
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

      /*
       * Current project becomes the first
       * item in the redo history.
       */
      setFuture((currentFuture) => [
        project,
        ...currentFuture,
      ]);

      setProjectState(previousProject);

      /*
       * Save undo result immediately.
       */
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(previousProject)
        );
      } catch (error) {
        console.error(
          "Failed to save undo state:",
          error
        );
      }

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

      /*
       * Current project becomes an undo entry.
       */
      setPast((currentPast) => [
        ...currentPast,
        project,
      ]);

      setProjectState(nextProject);

      /*
       * Save redo result immediately.
       */
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(nextProject)
        );
      } catch (error) {
        console.error(
          "Failed to save redo state:",
          error
        );
      }

      return currentFuture.slice(1);
    });
  };

  /*
   * Manual Save
   */
  const saveProject = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(project)
      );

      alert(
        "Project saved successfully!"
      );
    } catch (error) {
      console.error(
        "Failed to save project:",
        error
      );

      alert(
        "Failed to save project."
      );
    }
  };

  /*
   * Manual Load
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
        JSON.parse(savedProject) as Partial<Project>;

      const loadedProject: Project = {
        ...initialProject,
        ...parsedProject,

        furniture: Array.isArray(
          parsedProject.furniture
        )
          ? parsedProject.furniture
          : [],

        /*
         * Add default room settings if an
         * older project does not have them.
         */
        room: {
          ...initialProject.room,
          ...(parsedProject.room ?? {}),
        },
      };

      setProjectState(loadedProject);

      /*
       * Loading a project starts a fresh
       * undo/redo history.
       */
      setPast([]);
      setFuture([]);

      alert(
        "Project loaded successfully!"
      );
    } catch (error) {
      console.error(
        "Failed to load project:",
        error
      );

      alert(
        "Failed to load project."
      );
    }
  };

  /*
   * Clear saved project
   */
  const clearSavedProject = () => {
    localStorage.removeItem(
      STORAGE_KEY
    );

    alert(
      "Saved project cleared."
    );
  };

  /*
   * New Project
   */
  const newProject = () => {
    const confirmed =
      window.confirm(
        "Start a new project? Unsaved changes will be replaced."
      );

    if (!confirmed) {
      return;
    }

    const emptyProject: Project = {
      name: "AI in Interior Design",
      roomImage: "",
      style: "",
      furniture: [],
      room: {
        width: 800,
        depth: 500,
        wallHeight: 300,
      },
    };

    /*
     * Direct state update because a new project
     * should NOT create an undo entry.
     */
    setProjectState(emptyProject);

    /*
     * Clear undo/redo history.
     */
    setPast([]);
    setFuture([]);

    /*
     * Save the new project.
     */
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(emptyProject)
    );
  };

  /*
   * Export Project
   */
  const exportProject = () => {
    try {
      const projectData =
        JSON.stringify(
          project,
          null,
          2
        );

      const blob =
        new Blob(
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
   * Import Project
   */
  const importProject = async (
    file: File
  ) => {
    try {
      const text =
        await file.text();

      const parsedProject =
        JSON.parse(text) as Partial<Project>;

      if (
        !parsedProject ||
        typeof parsedProject !== "object"
      ) {
        throw new Error(
          "Invalid project file."
        );
      }

      if (
        !Array.isArray(
          parsedProject.furniture
        )
      ) {
        throw new Error(
          "Invalid furniture data."
        );
      }

      const importedProject: Project = {
        ...initialProject,
        ...parsedProject,

        name:
          parsedProject.name ||
          "Imported Project",

        furniture:
          parsedProject.furniture,

        /*
         * Make imported projects compatible
         * with the room settings system.
         */
        room: {
          ...initialProject.room,
          ...(parsedProject.room ?? {}),
        },
      };

      /*
       * Imported projects start with
       * a fresh undo/redo history.
       */
      setProjectState(
        importedProject
      );

      setPast([]);
      setFuture([]);

      /*
       * Save imported project.
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

        canUndo:
          past.length > 0,

        canRedo:
          future.length > 0,

        saveProject,
        loadProject,
        clearSavedProject,

        exportProject,
        importProject,

        newProject,
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