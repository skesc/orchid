import MarketplaceList from "./marketplace/MarketplaceList";
import { useAuth } from '../contexts/AuthContext';
import { Plus, X } from 'lucide-react';
import { useState } from "react";
import MarketplaceForm from "./marketplace/MarketplaceForm";

function Market({handleAddHat}) {
  const [mod, setMod] = useState(true)
  const HATS = ["/hat-1.png", "/hat-2.png", "/hat-3.png"];
  const { user } = useAuth();
  return (
    <>
    { mod &&
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/50" onClick={() => setMod(false)} />
        <div className="relative w-full max-w-3xl bg-neutral-200 h-[50rem] overflow-y-auto rounded-xl shadow-xl p-8 m-4 transform transition-all">
          <button onClick={() => setMod(false)} className="absolute right-4 top-4 text-neutral-400 hover:text-violet-600 transition-colors">
            <X size={24} />
          </button>
        <MarketplaceForm setMod={setMod}/>
        </div>
      </div>
}
    <div className="fixed right-0 h-screen w-[45rem] top-0 transform  z-10   py-5 px-6 space-x-2">
      <div className="h-full w-full p-4 box-shadow-3d flex flex-col gap-4 bg-neutral-200 rounded-md">
      <div className="flex flex-col">
      <h1 className="text-2xl font-bold">Your Pickings</h1>
      <div className="flex flex-wrap gap-4">
      {HATS.map((hat, i) => (
        <img key={i} src={hat} alt={`Hat ${i + 1}`} className="h-20 z-10 cursor-pointer hover:opacity-70" onClick={() => handleAddHat(hat)} />
      ))}
      </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Marketplace</h2>
        {user && (
          <button
            onClick={() => setMod(true)}
            className="group flex items-center gap-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white px-2 py-[5px] rounded-lg hover:from-violet-600 hover:to-violet-700 transition-all duration-200 shadow-lg hover:shadow-violet-500/25"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-200" />
            <span>Add Item</span>
          </button>
        )}
      </div>
      <MarketplaceList/>
      </div>
    </div>
    </>
  );
}

export default Market
