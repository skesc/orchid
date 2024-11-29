import {Github, Loader2, Search, Twitter, X} from "lucide-react";
import React from "react";
import {API_URL} from "../utils/fetchConfig";

export default function PFPModal({isOpen, onClose, onSelect}) {
  const [platform, setPlatform] = React.useState("github");
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [pfpUrl, setPfpUrl] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, platform]);

  React.useEffect(() => {
    if (!isOpen || !platform) {
      setUsername("");
      setError("");
      setPfpUrl("");
    }
  }, [isOpen, platform]);

  const handlePlatformChange = (newPlatform) => {
    setPlatform(newPlatform);
    setUsername("");
    setError("");
    setPfpUrl("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError("");
    setPfpUrl("");

    try {
      const endpoint = platform === "github" ? "github" : "x";
      const response = await fetch(`${API_URL}/api/pfp/${endpoint}/${username}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch profile picture");
      }

      setPfpUrl(data.url);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUsername("");
    setError("");
    setPfpUrl("");
    onClose();
  };

  const handleSelect = () => {
    if (pfpUrl) {
      onSelect(pfpUrl);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative w-full max-w-md bg-neutral-200 rounded-2xl shadow-xl p-8 m-4">
        <button onClick={handleClose} className="absolute right-4 top-4 text-neutral-400 hover:text-violet-600 transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-purple-500">Get Profile Picture</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Fetch a profile picture from GitHub or X!</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => handlePlatformChange("github")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-200 ${platform === "github" ? "bg-violet-500 text-white" : "bg-neutral-300 text-neutral-600 "}`}>
            <Github size={20} />
            <span>GitHub</span>
          </button>

          <button onClick={() => handlePlatformChange("x")} className={`flex-1 relative group flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-200 ${platform === "x" ? "bg-violet-500 text-white" : "bg-neutral-300  text-neutral-600"}`}>
            <div className="flex items-center gap-2">
              <Twitter size={20} />
              <span>X</span>
            </div>

            {platform === "x" && (
              <div className="absolute inset-0 group-hover:bg-black/5 dark:group-hover:bg-white/5">
                <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg">
                  Due to X not having a public API, fetching profile pictures may take 5-10 seconds.
                  <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-neutral-900"></div>
                </div>
              </div>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input ref={inputRef} type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={`Enter ${platform === "github" ? "GitHub" : "X"} username`} className="w-full px-4 py-3 bg-neutral-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none text-neutral-900 placeholder-neutral-500 dark:placeholder-neutral-400" />
            <button type="submit" disabled={loading || !username.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            </button>
          </div>

          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>}

          {pfpUrl && (
            <div className="flex flex-col items-center gap-4">
              <img src={pfpUrl} alt="Profile" className="w-32 h-32 rounded-xl object-cover" />
              <button onClick={handleSelect} className="w-full py-3 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-all duration-200">
                Use This Picture
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
