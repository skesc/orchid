// Entirely scrapped from https://github.com/fabricjs/fabric.js/issues/10011
import { useCallback, useEffect, useState } from 'react';
import { util } from 'fabric';

export const useCanvasHistory = (canvas) => {
  const [history, setHistory] = useState([]);
  const [historyRedo, setHistoryRedo] = useState([]);
  const [isClearingCanvas, setIsClearingCanvas] = useState(false);

  const saveCanvasState = useCallback(() => {
    if (!canvas) return;
    
    const jsonCanvas = structuredClone(canvas.toObject().objects);
    setHistory(prevHistory => [...prevHistory, jsonCanvas]);
    setHistoryRedo([]);
  }, [canvas]);

  const clearCanvas = useCallback(() => {
    if (!canvas) return;
    
    setIsClearingCanvas(true);
    canvas.remove(...canvas.getObjects());
    setIsClearingCanvas(false);
  }, [canvas]);

  const applyState = useCallback(async (state) => {
    if (!canvas) return;

    canvas.off('object:added');
    canvas.off('object:modified');
    canvas.off('object:removed');
    clearCanvas();

    const objects = await util.enlivenObjects(state);
    objects.forEach((obj) => {
      canvas.add(obj);
    });

    // Re-enable event listeners
    canvas.on('object:added', saveCanvasState);
    canvas.on('object:modified', saveCanvasState);
    canvas.on('object:removed', () => {
      if (!isClearingCanvas) {
        saveCanvasState();
      }
    });

    canvas.renderAll();
  }, [canvas, clearCanvas, saveCanvasState, isClearingCanvas]);

  const undo = useCallback(async () => {
    if (!canvas || history.length <= 1) return;
    const currentState = history[history.length - 1];
    setHistoryRedo(prevRedo => [currentState, ...prevRedo]);
    setHistory(prevHistory => prevHistory.slice(0, -1));
    const previousState = history[history.length - 2];
    await applyState(previousState);
  }, [canvas, history, applyState]);

  const redo = useCallback(async () => {
    if (!canvas || historyRedo.length === 0) return;
    const stateToRedo = historyRedo[0];
    setHistoryRedo(prevRedo => prevRedo.slice(1));
    setHistory(prevHistory => [...prevHistory, stateToRedo]);
    await applyState(stateToRedo);
  }, [canvas, historyRedo, applyState]);

  useEffect(() => {
    if (!canvas) return;

    // Save initial state
    saveCanvasState();

    // Add event listeners
    canvas.on('object:added', saveCanvasState);
    canvas.on('object:modified', saveCanvasState);
    canvas.on('object:removed', () => {
      if (!isClearingCanvas) {
        saveCanvasState();
      }
    });

    // Cleanup listeners
    return () => {
      canvas.off('object:added', saveCanvasState);
      canvas.off('object:modified', saveCanvasState);
      canvas.off('object:removed', saveCanvasState);
    };
  }, [canvas, saveCanvasState, isClearingCanvas]);

  return {
    undo,
    redo,
    history,
    historyRedo
  };
};