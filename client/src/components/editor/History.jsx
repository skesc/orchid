import { Redo, Undo } from "lucide-react";
import { useCanvasHistory } from "../../hooks/useHistory";

export default function History({ canvas }) {
  const { undo, redo, history, historyRedo } = useCanvasHistory(canvas);
  return (
    <div className="box-shadow-3d flex gap-4 z-[50]  fixed left-[28rem] bottom-6 p-3 rounded-md bg-neutral-200">
      <button
        onClick={undo}
        disabled={history.length <= 1}
        className="disabled:text-neutral-600 hover:text-violet-500 transition cursor-pointer">
        <Undo size={20} />
      </button>
      <button
        onClick={redo}
        disabled={historyRedo.length === 0}
        className="disabled:text-neutral-600 hover:text-violet-500 transition cursor-pointer">
        <Redo size={20} />
      </button>
    </div>
  );
}
