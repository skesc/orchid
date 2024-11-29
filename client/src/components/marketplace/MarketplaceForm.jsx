import {useNavigate} from "@tanstack/react-router";
import {Check, Upload, X} from "lucide-react";
import React, {useState} from "react";

const CATEGORIES = ["Hat", "Glasses", "Accessory", "Background"];
const API_URL = import.meta.env.VITE_API_URL;

export default function MarketplaceForm({setMod}) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
    categories: [],
    is_private: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleInputChange = (e) => {
    const {name, value, type, checked} = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        image: file,
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(""); // Clear any previous errors
    }
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => {
      const categories = prev.categories.includes(category) ? prev.categories.filter((c) => c !== category) : [...prev.categories, category];
      return {...prev, categories};
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("image", formData.image);
      formDataToSend.append("categories", JSON.stringify(formData.categories));
      formDataToSend.append("is_private", formData.is_private);

      const response = await fetch(`${API_URL}/api/marketplace/items`, {
        method: "POST",
        credentials: "include",
        body: formDataToSend,
      });

      if (response.ok) {
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate({to: "/marketplace"});
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create item");
      }
    } catch (error) {
      setError("An error occurred while creating the item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className=" mx-auto text-neutral-900 rounded-2xl  px-8">
        <h2 className="text-2xl font-bold  mb-3 text-center">Create New Item</h2>

        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg mb-3 backdrop-blur-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-lg font-medium text-violet-500 mb-2">Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-3 bg-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-white placeholder-neutral-400 transition duration-200" placeholder="Enter item name" />
          </div>

          <div>
            <label className="block text-lg font-medium text-violet-500 mb-2">Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" className="w-full px-4 py-3 bg-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-white placeholder-neutral-400 transition duration-200" placeholder="Describe your item..." />
          </div>

          <div>
            <label className="block text-lg font-medium text-violet-500 mb-2">Image</label>
            <div className="mt-1 flex flex-col items-center">
              <div className="w-full flex justify-center px-6 pt-5 pb-6 border-2 border-violet-500 border-dashed rounded-lg hover:border-violet-500 transition duration-200 relative">
                <div className="space-y-1 text-center">
                  {preview ? (
                    <div className="relative inline-block">
                      <img src={preview} alt="Preview" className="max-h-64 rounded-lg" />
                      <button
                        type="button"
                        onClick={() => {
                          setPreview(null);
                          setFormData((prev) => ({...prev, image: null}));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-violet-400" />
                      <div className="flex text-sm text-neutral-400">
                        <label className="relative cursor-pointer rounded-md font-medium text-violet-500 hover:text-violet-400 focus-within:outline-none">
                          <span>Upload a file</span>
                          <input type="file" accept="image/*" onChange={handleImageChange} required className="sr-only" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-neutral-400">PNG, JPG, GIF up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
              {formData.image && <p className="text-sm text-neutral-300 mt-2">Selected file: {formData.image.name}</p>}
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-violet-500 mb-3">Categories</label>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map((category) => (
                <button key={category} type="button" onClick={() => handleCategoryToggle(category)} className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${formData.categories.includes(category) ? "bg-violet-500 text-white shadow-lg shadow-violet-500/50" : "bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50"}`}>
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="is_private" checked={formData.is_private} onChange={handleInputChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
              <span className="ml-3 text-sm font-medium text-neutral-500">Make this item private</span>
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => setMod(false)} className="px-6 py-3 rounded-lg font-medium text-neutral-300 bg-neutral-800/50 hover:bg-neutral-700/50 transition duration-200">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-3 rounded-lg font-medium text-white bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg shadow-violet-500/30">
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create Item"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black/50 absolute inset-0 backdrop-blur-sm"></div>
          <div className="bg-white rounded-lg p-6 shadow-xl relative z-10 transform transition-all duration-300 scale-100">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 rounded-full p-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-neutral-900">
                <h3 className="text-lg font-medium">Success!</h3>
                <p className="text-sm text-neutral-500">Your item has been created successfully.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
  );
}
