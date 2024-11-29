import React, { useState } from "react";
import {useAuth} from "../../contexts/AuthContext";

const API_URL = process.env.VITE_API_URL;

export default function MarketplaceItem({item, onUpdate}) {
  const {user} = useAuth();
  const isAuthor = user && user.id === item.author.id;

  const [mod, setMod] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`${API_URL}/api/marketplace/items/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        onUpdate();
      } else {
        console.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleUse = () => {
    // TODO: Implement the logic to use the item in the photo editor
    console.log("Using item:", item);
  };

  return (
    <>
    { mod &&
    <div className="fixed bg-black/90 flex justify-center items-center z-[1000] p-2 w-[40rem] h-screen top-0 right-0">
    <div className="p-4 bg-neutral-200 rounded-md flex flex-col items-center w-[25rem]">
      <p className="text-xl self-start font-bold">{item.name}</p>
      <img src={`${API_URL}/${item.image_path}`} className="h-48 my-4" />
      <p className="text-neutral-500 self-start text-left">
        {item.description}
      </p>
        <div className="my-3 flex flex-wrap gap-2 self-start">
          {item.categories.map((category, index) => (
            <span key={index} className="bg-violet-900/20 text-violet-500 px-2 py-1 rounded-full text-sm">
              {category}
            </span>
          ))}
        </div>
        <p className="self-start">- by {item.author.name}</p>
        <div className="flex mt-4  gap-4 w-full">
          <button onClick={() => setMod(false)} className="grow basis-[1] py-2 bg-neutral-300 rounded-md hover:bg-neutral-300/50 transition">Cancel</button>
          <button className="grow basis-[1] py-2 bg-violet-600 text-neutral-100 rounded-md hover:bg-violet-500 transition">Use</button>
        </div>
    </div>
    </div> 
}
    <div className="bg-neutral-300 rounded-lg shadow-lg flex flex-col items-center overflow-hidden p-4">
      <img src={`${API_URL}/${item.image_path}`} alt={item.name} className="h-[8rem] object-cover" />
      <div className="p-2 w-full">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-black">{item.name}</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMod(true)} className="bg-violet-600 w-full text-white px-4 py-[4px] rounded hover:bg-violet-700 transition">
            Use
          </button>
          {isAuthor && (
            <button onClick={handleDelete} className="bg-red-600/10  text-red-600 rounded px-4 hover:text-red-500">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
