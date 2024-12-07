import {Group} from "fabric";
import {useCallback, useEffect, useState} from "react";
export const useCanvasHistory = (canvas) => {
  const [history, setHistory] = useState([]);
  const [historyRedo, setHistoryRedo] = useState([]);
  const [isClearingCanvas, setIsClearingCanvas] = useState(false);
  const [isUndoingOrRedoing, setIsUndoingOrRedoing] = useState(false);

  // claude slop. broken
  const cloneGroupObjects = async (objects) => {
    const clonedObjects = [];
    for (const obj of objects) {
      if (obj.type === "group") {
        const groupObjects = await cloneGroupObjects(obj.getObjects());
        const group = new Group(groupObjects, {
          ...obj.toObject(),
          objects: undefined,
        });
        clonedObjects.push(group);
      } else {
        clonedObjects.push(await obj.clone(["id", "name", "selectable", "evented"]));
      }
    }
    return clonedObjects;
  };

  const saveCanvasState = useCallback(async () => {
    if (!canvas || isUndoingOrRedoing) return;

    const objects = canvas.getObjects();
    const clonedObjects = await cloneGroupObjects(objects);

    setHistory((prevHistory) => [...prevHistory, clonedObjects]);
    setHistoryRedo([]);
  }, [canvas, isUndoingOrRedoing]);

  const clearCanvas = useCallback(() => {
    if (!canvas) return;

    setIsClearingCanvas(true);
    canvas.remove(...canvas.getObjects());
    setIsClearingCanvas(false);
  }, [canvas]);

  const applyState = useCallback(
    async (objects) => {
      if (!canvas) return;

      setIsUndoingOrRedoing(true);

      canvas.off("object:added");
      canvas.off("object:modified");
      canvas.off("object:removed");

      clearCanvas();
      for (const obj of objects) {
        canvas.add(obj);
      }

      canvas.on("object:added", () => !isUndoingOrRedoing && saveCanvasState());
      canvas.on("object:modified", () => !isUndoingOrRedoing && saveCanvasState());
      canvas.on("object:removed", () => {
        if (!isClearingCanvas && !isUndoingOrRedoing) {
          saveCanvasState();
        }
      });

      canvas.renderAll();
      setIsUndoingOrRedoing(false);

      canvas.fire("history:changed");
    },
    [canvas, clearCanvas, saveCanvasState, isClearingCanvas, isUndoingOrRedoing]
  );

  const undo = useCallback(async () => {
    if (!canvas || history.length <= 1) return;

    const currentState = history[history.length - 1];
    const previousState = history[history.length - 2];

    setHistoryRedo((prevRedo) => [currentState, ...prevRedo]);
    setHistory((prevHistory) => prevHistory.slice(0, -1));

    await applyState(previousState);
  }, [canvas, history, applyState]);

  const redo = useCallback(async () => {
    if (!canvas || historyRedo.length === 0) return;

    const stateToRedo = historyRedo[0];

    setHistoryRedo((prevRedo) => prevRedo.slice(1));
    setHistory((prevHistory) => [...prevHistory, stateToRedo]);

    await applyState(stateToRedo);
  }, [canvas, historyRedo, applyState]);

  useEffect(() => {
    if (!canvas) return;
    saveCanvasState();

    const handleStateChange = () => {
      if (!isUndoingOrRedoing) {
        saveCanvasState();
      }
    };

    canvas.on("object:added", handleStateChange);
    canvas.on("object:modified", handleStateChange);
    canvas.on("object:removed", () => {
      if (!isClearingCanvas && !isUndoingOrRedoing) {
        handleStateChange();
      }
    });

    return () => {
      canvas.off("object:added", handleStateChange);
      canvas.off("object:modified", handleStateChange);
      canvas.off("object:removed", handleStateChange);
    };
  }, [canvas, saveCanvasState, isClearingCanvas, isUndoingOrRedoing]);

  return {
    undo,
    redo,
    history,
    historyRedo,
    saveCanvasState,
  };
};
