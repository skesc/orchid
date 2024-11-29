import {Plus, X} from "lucide-react";
import {useState} from "react";
import {useAuth} from "../contexts/AuthContext";
import MarketplaceForm from "./marketplace/MarketplaceForm";
import MarketplaceList from "./marketplace/MarketplaceList";

function Market({handleAddHat, canvas}) {
  const [showForm, setShowForm] = useState(false);
  const HATS = ["/hat-1.png", "/hat-2.png", "/hat-3.png"];
  const {user} = useAuth();

  return (
    <>
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-3xl bg-neutral-200 max-h-[90vh] rounded-xl shadow-xl transform transition-all mx-4">
            <button onClick={() => setShowForm(false)} className="absolute right-4 top-4 text-neutral-400 hover:text-violet-600 transition-colors">
              <X size={24} />
            </button>
            <div className="overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-violet-500 scrollbar-track-neutral-300 px-8 py-6">
              <MarketplaceForm setMod={setShowForm} />
            </div>
          </div>
        </div>
      )}
      <div className="fixed right-0 h-screen w-[45rem] top-0 transform z-10 py-5 px-6">
        <div className="h-full w-full flex flex-col bg-neutral-200 rounded-md p-4 box-shadow-3d">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Your Pickings</h1>
            <div className="flex flex-wrap gap-4 mt-2">
              {HATS.map((hat, i) => (
                <img key={i} src={hat} alt={`Hat ${i + 1}`} className="h-20 z-10 cursor-pointer hover:opacity-70" onClick={() => handleAddHat(hat)} />
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold tracking-tight">Marketplace</h2>
              {user && (
                <button onClick={() => setShowForm(true)} className="group flex items-center gap-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white px-2 py-[5px] rounded-lg hover:from-violet-600 hover:to-violet-700 transition-all duration-200 shadow-lg hover:shadow-violet-500/25">
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-200" />
                  <span>Add Item</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-violet-500 scrollbar-track-neutral-300">
                <MarketplaceList canvas={canvas} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Market;
