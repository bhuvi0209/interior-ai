import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { useProject } from "../context/ProjectContext";
import FurnitureLibrary from "../components/FurnitureLibrary";
import { furnitureLibrary } from "../data/furnitureData";

function Editor() {
  const { project, setProject } = useProject();

  const [selectedId, setSelectedId] =
    useState<number | null>(null);

  const [zoom, setZoom] = useState(1);

  const [showGrid, setShowGrid] =
    useState(true);

  const [draggingId, setDraggingId] =
    useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(
    null
  );

  // --------------------------------------------------
  // ADD FURNITURE
  // --------------------------------------------------

  const handleAddFurniture = (
    furnitureId: string
  ) => {
    const definition =
      furnitureLibrary.find(
        (item) => item.id === furnitureId
      );

    if (!definition) {
      return;
    }

    const newFurniture = {
      id: Date.now(),

      name: definition.name,

      category: definition.category,

      x: 400,

      y: 250,

      rotation: 0,

      scale: 1,

      image2D: definition.image2D,

      model3D: definition.model3D,
    };

    setProject((currentProject) => ({
      ...currentProject,

      furniture: [
        ...currentProject.furniture,
        newFurniture,
      ],
    }));

    setSelectedId(newFurniture.id);
  };

  // --------------------------------------------------
  // SELECT FURNITURE
  // --------------------------------------------------

  const handleSelectFurniture = (
    id: number
  ) => {
    setSelectedId(id);
  };

  // --------------------------------------------------
  // MOVE FURNITURE
  // --------------------------------------------------

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    furnitureId: number
  ) => {
    event.stopPropagation();

    setSelectedId(furnitureId);
    setDraggingId(furnitureId);

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (
      draggingId === null ||
      !stageRef.current
    ) {
      return;
    }

    const rect =
      stageRef.current.getBoundingClientRect();

    const newX =
      (event.clientX - rect.left) / zoom;

    const newY =
      (event.clientY - rect.top) / zoom;

    setProject((currentProject) => ({
      ...currentProject,

      furniture:
        currentProject.furniture.map(
          (item) =>
            item.id === draggingId
              ? {
                  ...item,
                  x: Math.max(
                    20,
                    Math.min(
                      740,
                      newX
                    )
                  ),
                  y: Math.max(
                    20,
                    Math.min(
                      480,
                      newY
                    )
                  ),
                }
              : item
        ),
    }));
  };

  const handlePointerUp = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    setDraggingId(null);

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    } catch {
      // Pointer capture may already be released.
    }
  };

  // --------------------------------------------------
  // UPDATE ROTATION
  // --------------------------------------------------

  const updateRotation = (
    value: number
  ) => {
    if (selectedId === null) {
      return;
    }

    setProject((currentProject) => ({
      ...currentProject,

      furniture:
        currentProject.furniture.map(
          (item) =>
            item.id === selectedId
              ? {
                  ...item,
                  rotation: value,
                }
              : item
        ),
    }));
  };

  // --------------------------------------------------
  // UPDATE SCALE
  // --------------------------------------------------

  const updateScale = (
    value: number
  ) => {
    if (selectedId === null) {
      return;
    }

    setProject((currentProject) => ({
      ...currentProject,

      furniture:
        currentProject.furniture.map(
          (item) =>
            item.id === selectedId
              ? {
                  ...item,
                  scale: value,
                }
              : item
        ),
    }));
  };

  // --------------------------------------------------
  // DELETE FURNITURE
  // --------------------------------------------------

  const deleteSelectedFurniture = () => {
    if (selectedId === null) {
      return;
    }

    setProject((currentProject) => ({
      ...currentProject,

      furniture:
        currentProject.furniture.filter(
          (item) =>
            item.id !== selectedId
        ),
    }));

    setSelectedId(null);
  };

  // --------------------------------------------------
  // RESET ZOOM
  // --------------------------------------------------

  const resetZoom = () => {
    setZoom(1);
  };

  // --------------------------------------------------
  // SELECTED FURNITURE
  // --------------------------------------------------

  const selectedFurniture =
    project.furniture.find(
      (item) =>
        item.id === selectedId
    );

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      {/* --------------------------------------------- */}
      {/* HEADER */}
      {/* --------------------------------------------- */}

      <header
        style={{
          textAlign: "center",
          paddingTop: "20px",
          paddingBottom: "10px",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            margin: 0,
            fontWeight: 700,
          }}
        >
          2D Room Editor
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#a06080",
            marginTop: "8px",
          }}
        >
          Arrange your furniture and
          create your room layout.
        </p>
      </header>

      {/* --------------------------------------------- */}
      {/* MAIN LAYOUT */}
      {/* --------------------------------------------- */}

      <div
        style={{
          display: "flex",
          gap: "20px",
          padding: "0 30px 30px",
          alignItems: "flex-start",
        }}
      >
        {/* ------------------------------------------- */}
        {/* FURNITURE LIBRARY */}
        {/* ------------------------------------------- */}

        <FurnitureLibrary
          onAddFurniture={
            handleAddFurniture
          }
        />

        {/* ------------------------------------------- */}
        {/* CENTER EDITOR */}
        {/* ------------------------------------------- */}

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* ----------------------------------------- */}
          {/* TOOLBAR */}
          {/* ----------------------------------------- */}

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() =>
                setZoom(
                  Math.min(
                    2,
                    zoom + 0.1
                  )
                )
              }
            >
              🔍+
            </button>

            <button
              onClick={() =>
                setZoom(
                  Math.max(
                    0.5,
                    zoom - 0.1
                  )
                )
              }
            >
              🔍-
            </button>

            <button
              onClick={resetZoom}
            >
              Reset Zoom
            </button>

            <button
              onClick={() =>
                setShowGrid(
                  !showGrid
                )
              }
            >
              {showGrid
                ? "Hide Grid"
                : "Show Grid"}
            </button>

            <button
              onClick={() =>
                setSelectedId(null)
              }
            >
              Clear Selection
            </button>
          </div>

          {/* ----------------------------------------- */}
          {/* ROOM */}
          {/* ----------------------------------------- */}

          <div
            style={{
              width: "100%",
              overflow: "auto",
            }}
          >
            <div
  ref={stageRef}

  onPointerMove={
    handlePointerMove
  }

  onPointerUp={
    handlePointerUp
  }

  onPointerLeave={
    handlePointerUp
  }

  onClick={() =>
    setSelectedId(null)
  }

  onDragOver={(event) => {
    event.preventDefault();

    event.dataTransfer.dropEffect =
      "copy";
  }}

  onDrop={(event) => {
  event.preventDefault();

  const furnitureId =
    event.dataTransfer.getData(
      "furnitureId"
    );

 const furniture =
  furnitureLibrary.find(
    (item) => item.id === furnitureId
  );

  if (!furniture) {
    return;
  }
  const rect =
  event.currentTarget.getBoundingClientRect();

const x =
  (event.clientX - rect.left)/zoom;

const y =
  (event.clientY - rect.top)/zoom;
setProject((currentProject) => ({
  ...currentProject,

  furniture: [
    ...currentProject.furniture,

    {
      id: Date.now(),

      name: furniture.name,

      category: furniture.category,

      x,

      y,

      rotation: 0,

      scale:
        furniture.defaultScale ?? 1,

      model3D:
        furniture.model3D,
    },
  ],
}));

  console.log(
    "Furniture:",
    furniture
  );
}}
              style={{
                width: "760px",
                height: "500px",
                position: "relative",
                overflow: "hidden",
                border:
                  "2px solid #333",
                backgroundColor:
                  "#eee",
                backgroundImage:
                  project.roomImage
                    ? `url(${project.roomImage})`
                    : undefined,
                backgroundSize:
                  "cover",
                backgroundPosition:
                  "center",
                transform: `scale(${zoom})`,
                transformOrigin:
                  "top left",
                cursor:
                  draggingId !== null
                    ? "grabbing"
                    : "default",
              }}
            >
              {/* ------------------------------------- */}
              {/* GRID */}
              {/* ------------------------------------- */}

              {showGrid && (
                <div
                  style={{
                    position:
                      "absolute",
                    inset: 0,
                    pointerEvents:
                      "none",
                    backgroundImage:
                      `
                      linear-gradient(
                        rgba(0,0,0,0.12) 1px,
                        transparent 1px
                      ),
                      linear-gradient(
                        90deg,
                        rgba(0,0,0,0.12) 1px,
                        transparent 1px
                      )
                    `,
                    backgroundSize:
                      "50px 50px",
                  }}
                />
              )}

              {/* ------------------------------------- */}
              {/* NO ROOM IMAGE */}
              {/* ------------------------------------- */}

              {!project.roomImage && (
                <div
                  style={{
                    position:
                      "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    color: "#777",
                    fontSize: "20px",
                    pointerEvents:
                      "none",
                  }}
                >
                  No room image
                  uploaded
                </div>
              )}

              {/* ------------------------------------- */}
              {/* FURNITURE */}
              {/* ------------------------------------- */}

              {project.furniture.map(
                (item) => {
                  const isSelected =
                    item.id ===
                    selectedId;

                  const scale =
                    item.scale ?? 1;

                  const rotation =
                    item.rotation ?? 0;

                  return (
                    <div
                      key={item.id}
                      onPointerDown={(
                        event
                      ) =>
                        handlePointerDown(
                          event,
                          item.id
                        )
                      }
                      onClick={(
                        event
                      ) => {
                        event.stopPropagation();

                        handleSelectFurniture(
                          item.id
                        );
                      }}
                      style={{
                        position:
                          "absolute",

                        left: item.x,

                        top: item.y,

                        transform: `
                          translate(-50%, -50%)
                          rotate(${rotation}deg)
                          scale(${scale})
                        `,

                        transformOrigin:
                          "center",

                        width: "70px",

                        height: "70px",

                        display: "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        fontSize: "48px",

                        cursor:
                          draggingId ===
                          item.id
                            ? "grabbing"
                            : "grab",

                        border: isSelected
                          ? "3px solid #2563eb"
                          : "3px solid transparent",

                        borderRadius:
                          "10px",

                        background:
                          isSelected
                            ? "rgba(255,255,255,0.6)"
                            : "transparent",

                        userSelect:
                          "none",

                        touchAction:
                          "none",

                        zIndex:
                          isSelected
                            ? 10
                            : 2,
                      }}
                    >
                      {getFurnitureEmoji(
                        item.name
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------- */}
        {/* PROPERTIES */}
        {/* ------------------------------------------- */}

        <div
          style={{
            width: "280px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              border:
                "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
              background:
                "#ffffff",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                marginTop: 0,
              }}
            >
              Properties
            </h2>

            {!selectedFurniture && (
              <p
                style={{
                  textAlign:
                    "center",
                  color: "#777",
                }}
              >
                Select furniture to
                edit it.
              </p>
            )}

            {selectedFurniture && (
              <>
                <h3>
                  {selectedFurniture.name}
                </h3>

                <p>
                  Category:{" "}
                  {selectedFurniture.category ||
                    "Furniture"}
                </p>

                <hr />

                <label>
                  X Position
                </label>

                <input
                  type="number"
                  value={Math.round(
                    selectedFurniture.x
                  )}
                  onChange={(event) => {
                    const value =
                      Number(
                        event.target.value
                      );

                    setProject(
                      (
                        currentProject
                      ) => ({
                        ...currentProject,

                        furniture:
                          currentProject.furniture.map(
                            (item) =>
                              item.id ===
                              selectedId
                                ? {
                                    ...item,
                                    x: value,
                                  }
                                : item
                          ),
                      })
                    );
                  }}
                  style={{
                    width: "100%",
                    marginTop: "5px",
                    marginBottom:
                      "12px",
                    padding: "8px",
                    boxSizing:
                      "border-box",
                  }}
                />

                <label>
                  Y Position
                </label>

                <input
                  type="number"
                  value={Math.round(
                    selectedFurniture.y
                  )}
                  onChange={(event) => {
                    const value =
                      Number(
                        event.target.value
                      );

                    setProject(
                      (
                        currentProject
                      ) => ({
                        ...currentProject,

                        furniture:
                          currentProject.furniture.map(
                            (item) =>
                              item.id ===
                              selectedId
                                ? {
                                    ...item,
                                    y: value,
                                  }
                                : item
                          ),
                      })
                    );
                  }}
                  style={{
                    width: "100%",
                    marginTop: "5px",
                    marginBottom:
                      "12px",
                    padding: "8px",
                    boxSizing:
                      "border-box",
                  }}
                />

                <label>
                  Rotation
                </label>

                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={
                    selectedFurniture.rotation ??
                    0
                  }
                  onChange={(event) =>
                    updateRotation(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                  style={{
                    width: "100%",
                  }}
                />

                <div
                  style={{
                    textAlign:
                      "center",
                    marginBottom:
                      "15px",
                  }}
                >
                  {selectedFurniture.rotation ??
                    0}
                  °
                </div>

                <label>
                  Scale
                </label>

                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={
                    selectedFurniture.scale ??
                    1
                  }
                  onChange={(event) =>
                    updateScale(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                  style={{
                    width: "100%",
                  }}
                />

                <div
                  style={{
                    textAlign:
                      "center",
                    marginBottom:
                      "15px",
                  }}
                >
                  {(
                    selectedFurniture.scale ??
                    1
                  ).toFixed(1)}
                </div>

                <button
                  onClick={
                    deleteSelectedFurniture
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "none",
                    borderRadius:
                      "6px",
                    background:
                      "#dc2626",
                    color: "white",
                    cursor:
                      "pointer",
                  }}
                >
                  Delete Furniture
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------- */}
      {/* PROJECT FURNITURE LIST */}
      {/* --------------------------------------------- */}

      <div
        style={{
          margin: "0 30px 30px",
          padding: "20px",
          background: "#f5f5f5",
          borderRadius: "12px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
          }}
        >
          Furniture in Project
        </h2>

        {project.furniture.length ===
          0 && (
          <p
            style={{
              textAlign:
                "center",
              color: "#777",
            }}
          >
            No furniture added
            yet.
          </p>
        )}

        <div
          style={{
            display: "flex",
            flexDirection:
              "column",
            alignItems:
              "center",
            gap: "6px",
          }}
        >
          {project.furniture.map(
            (item) => (
              <div
                key={item.id}
                onClick={() =>
                  setSelectedId(
                    item.id
                  )
                }
                style={{
                  cursor:
                    "pointer",
                }}
              >
                {getFurnitureEmoji(
                  item.name
                )}{" "}
                {item.name}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------
// FURNITURE EMOJI
// --------------------------------------------------

function getFurnitureEmoji(
  name: string
) {
  const lowerName =
    name.toLowerCase();

  if (lowerName.includes("sofa")) {
    return "🛋️";
  }

  if (lowerName.includes("chair")) {
    return "🪑";
  }

  if (
    lowerName.includes(
      "table"
    )
  ) {
    return "☕";
  }

  if (lowerName.includes("bed")) {
    return "🛏️";
  }

  if (
    lowerName.includes(
      "wardrobe"
    )
  ) {
    return "🚪";
  }

  if (
    lowerName.includes("lamp")
  ) {
    return "💡";
  }

  if (
    lowerName.includes("plant")
  ) {
    return "🪴";
  }

  if (
    lowerName.includes("rug")
  ) {
    return "🟫";
  }

  if (
    lowerName.includes(
      "tv"
    )
  ) {
    return "📺";
  }

  return "🪑";
}

export default Editor;