import {ChevronDown, ChevronUp, Edit2, Eye, EyeOff, Lock, Trash2, Unlock} from "lucide-react";
import React, {useEffect, useState} from "react";

const LayerPanel = ({canvas}) => {
  const [layers, setLayers] = useState([]);
  const [editingLayerId, setEditingLayerId] = useState(null);

  useEffect(() => {
    if (!canvas) return;

    // Initialize object IDs and names if they don't exist
    canvas.getObjects().forEach((obj, index) => {
      if (!obj.id) obj.id = `layer-${Date.now()}-${index}`;
      if (!obj.name) obj.name = `Layer ${index + 1}`;
    });

    const updateLayers = () => {
      const objects = canvas.getObjects();
      setLayers(
        objects
          .map((obj) => ({
            id: obj.id,
            name: obj.name,
            visible: obj.visible,
            locked: obj.selectable === false,
            object: obj,
          }))
          .reverse()
      ); // reverse to match canvas stacking order
    };

    // register all required event listeners
    const events = ["object:added", "object:removed", "object:modified", "object:visibility:changed", "selection:created", "selection:updated", "selection:cleared"];

    events.forEach((eventName) => {
      canvas.on(eventName, updateLayers);
    });

    updateLayers();

    return () => {
      events.forEach((eventName) => {
        canvas.off(eventName, updateLayers);
      });
    };
  }, [canvas]);

  const toggleVisibility = (layer) => {
    if (!canvas || !layer.object) return;

    layer.object.visible = !layer.object.visible;
    canvas.renderAll();

    // trigger custom event for visibility change
    canvas.fire("object:visibility:changed");
  };

  const toggleLock = (layer) => {
    if (!canvas || !layer.object) return;

    layer.object.selectable = layer.locked;
    layer.object.evented = layer.locked;
    canvas.renderAll();

    if (!layer.locked && canvas.getActiveObject() === layer.object) {
      canvas.discardActiveObject();
    }

    canvas.fire("object:modified");
  };

  // TODO: fix, moveto is not a function in v6
  const moveLayer = (index, direction) => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    const currentIndex = objects.length - 1 - index; // Convert from reversed index
    const newIndex = direction === "up" ? Math.min(currentIndex + 1, objects.length - 1) : Math.max(currentIndex - 1, 0);

    if (currentIndex === newIndex) return;

    const object = objects[currentIndex];
    canvas.moveTo(object, newIndex);
    canvas.renderAll();
    canvas.fire("object:modified");
  };

  const deleteLayer = (layer) => {
    if (!canvas || !layer.object) return;

    canvas.remove(layer.object);
    canvas.renderAll();
  };

  const handleLayerClick = (layer) => {
    if (!canvas || !layer.object || layer.locked) return;

    canvas.setActiveObject(layer.object);
    canvas.renderAll();
  };

  const handleNameEdit = (layer) => {
    setEditingLayerId(layer.id);
  };

  const handleNameSave = (layer, newName) => {
    if (!canvas || !layer.object) return;

    layer.object.name = newName || layer.name;
    setEditingLayerId(null);
    canvas.fire("object:modified");
  };

  const handleKeyPress = (e, layer) => {
    if (e.key === "Enter") {
      handleNameSave(layer, e.target.value);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-72 bg-neutral-900 text-white p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Layers ({layers.length})</h2>
      <div className="space-y-2">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`flex items-center justify-between p-2 rounded
              ${canvas && canvas.getActiveObject() === layer.object ? "bg-violet-800" : "bg-neutral-800 hover:bg-neutral-700"}`}
            onClick={() => handleLayerClick(layer)}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(layer);
                }}
                className="hover:bg-neutral-600 p-1 rounded">
                {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLock(layer);
                }}
                className="hover:bg-neutral-600 p-1 rounded">
                {layer.locked ? <Lock size={16} /> : <Unlock size={16} />}
              </button>

              {editingLayerId === layer.id ? (
                <input type="text" defaultValue={layer.name} onClick={(e) => e.stopPropagation()} onBlur={(e) => handleNameSave(layer, e.target.value)} onKeyPress={(e) => handleKeyPress(e, layer)} className="bg-neutral-700 text-white px-2 py-1 rounded text-sm flex-1 min-w-0" autoFocus />
              ) : (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm truncate flex-1">{layer.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNameEdit(layer);
                    }}
                    className="hover:bg-neutral-600 p-1 rounded opacity-0 group-hover:opacity-100">
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                className="p-1 hover:bg-neutral-600 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayer(index, "up");
                }}
                disabled={index === 0}>
                <ChevronUp size={16} className={index === 0 ? "opacity-50" : ""} />
              </button>
              <button
                className="p-1 hover:bg-neutral-600 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayer(index, "down");
                }}
                disabled={index === layers.length - 1}>
                <ChevronDown size={16} className={index === layers.length - 1 ? "opacity-50" : ""} />
              </button>
              <button
                className="p-1 hover:bg-red-600 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteLayer(layer);
                }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {layers.length === 0 && <div className="text-neutral-400 text-sm text-center mt-8">No layers yet. Try uploading an image or adding elements to your canvas.</div>}
    </div>
  );
};

export default LayerPanel;
