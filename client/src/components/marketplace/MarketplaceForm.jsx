import { Check, ImageIcon, X } from "lucide-react";
import React, { useState } from "react";
import { API_URL } from "../../utils/fetchConfig";

export default function MarketplaceForm({ setMod, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
    categories: [],
    is_private: false,
  });
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTagInput = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !formData.categories.includes(tag)) {
        setFormData((prev) => ({
          ...prev,
          categories: [...prev.categories, tag],
        }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        setError("File size must be less than 1MB");
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
      setError("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        setError("File size must be less than 1MB");
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
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      setError("Please select an image");
      return;
    }

    setLoading(true);
    setError("");

    const form = new FormData();
    form.append("name", formData.name);
    form.append("description", formData.description);
    form.append("image", formData.image);
    form.append("categories", JSON.stringify(formData.categories));
    form.append("is_private", formData.is_private);

    try {
      const response = await fetch(`${API_URL}/api/marketplace/items`, {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create item");
      }

      setShowSuccessModal(true);
      onSuccess?.();
      setTimeout(() => {
        setMod(false);
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {showSuccessModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-200/95 z-10">
          <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-3">
            <div className="bg-green-500 rounded-full p-1">
              <Check className="w-5 h-5 text-white" />
            </div>
            <p className="text-neutral-900">Item created successfully!</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <div className="p-0.5 rounded-full bg-red-100">
              <X className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutral-700 mb-1.5">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2.5 bg-white rounded-lg border border-neutral-300 
                       focus:border-violet-500 focus:ring-2 focus:ring-violet-200 
                       transition duration-200"
              placeholder="Give your item a name"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-neutral-700 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2.5 bg-white rounded-lg border border-neutral-300 
                       focus:border-violet-500 focus:ring-2 focus:ring-violet-200 
                       transition duration-200 resize-none"
              placeholder="Describe your item (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Categories
            </label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInput}
                  placeholder="Add categories (press Enter)"
                  className="w-full pl-4 pr-10 py-2.5 bg-white rounded-lg border border-neutral-300 
                           focus:border-violet-500 focus:ring-2 focus:ring-violet-200 
                           transition duration-200"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="text-xs text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                    Enter ↵
                  </div>
                </div>
              </div>

              {formData.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.categories.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full 
                               text-sm font-medium bg-violet-50 text-violet-700 group">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="w-4 h-4 rounded-full flex items-center justify-center 
                                 bg-violet-100 text-violet-600 hover:bg-violet-200 
                                 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Image
            </label>
            <div
              className={`relative rounded-lg transition-all duration-200 ${dragActive ? "border-violet-500 bg-violet-50" : "border-neutral-300 bg-white"} ${preview ? "border border-dashed" : "border-2 border-dashed"}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}>
              <div className="p-8">
                {preview ? (
                  <div className="flex items-center justify-center relative group">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-64 rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreview(null);
                        setFormData((prev) => ({ ...prev, image: null }));
                      }}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white 
                                shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200
                                hover:bg-red-600 hover:scale-110 active:scale-95">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-violet-50 rounded-full">
                      <ImageIcon className="w-8 h-8 text-violet-500" />
                    </div>
                    <div className="text-center">
                      <label className="block">
                        <span className="text-violet-600 font-medium hover:text-violet-700 cursor-pointer">
                          Click to upload
                        </span>
                        <span className="text-neutral-600">
                          {" "}
                          or drag and drop
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-sm text-neutral-500 mt-1">
                        PNG, JPG up to 1MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_private"
                checked={formData.is_private}
                onChange={handleInputChange}
                className="sr-only peer"
              />
              <div
                className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 
                            peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full 
                            peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                            after:left-[2px] after:bg-white after:border-neutral-300 after:border 
                            after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
              <span className="ml-3 text-sm font-medium text-neutral-700">
                Make this item private
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => setMod(false)}
            className="px-4 py-2 rounded-lg font-medium text-neutral-700 bg-neutral-100 
                     hover:bg-neutral-200 transition duration-200">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium text-white bg-violet-500 
                     hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition duration-200 min-w-[100px] flex items-center justify-center">
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating
              </>
            ) : (
              "Create Item"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
