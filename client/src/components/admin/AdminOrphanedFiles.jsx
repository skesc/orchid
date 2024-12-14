import { formatDistance } from "date-fns";
import {
  AlertTriangle,
  FileWarning,
  Loader2,
  Server,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import React from "react";
import { API_URL } from "../../utils/fetchConfig";
import ImageLoader from "../../utils/ImageLoader";
const { OptimizedImage } = ImageLoader;

const AdminOrphanedFiles = () => {
  const [files, setFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [deletingFiles, setDeletingFiles] = React.useState(new Set());
  const isDev = API_URL.startsWith("http://");

  const fetchFiles = React.useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/orphaned-files`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orphaned files");
      }

      const data = await response.json();
      setFiles(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching orphaned files:", error);
      setError("Failed to load orphaned files");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = async (key) => {
    if (
      !confirm(
        "Are you sure you want to delete this file? This action cannot be undone.",
      )
    )
      return;

    try {
      setDeletingFiles((prev) => new Set([...prev, key]));

      const response = await fetch(
        `${API_URL}/api/admin/orphaned-files/${encodeURIComponent(key)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      setFiles((prev) => prev.filter((file) => file.key !== key));
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file. Please try again.");
    } finally {
      setDeletingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isDev && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 p-3 rounded-full bg-orange-100">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-orange-900">
                Development Environment Detected
              </h3>

              <div className="mt-2 space-y-2 text-orange-800">
                <p>
                  You are about to perform file management operations in the
                  development environment.
                </p>

                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Your development Database is probably not synced with the
                    production Database, which may lead to false orphaned files.
                  </li>
                  <li>
                    Please check your <code>.env</code> file to ensure that you
                    are not accessing the production S3 bucket.
                  </li>
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-full text-sm text-orange-900">
                  <Server className="w-4 h-4" />
                  <span>API URL: {API_URL}</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 rounded-full text-sm text-red-900">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Operating in Development Mode</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {files.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              <FileWarning className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-emerald-900">
                No Orphaned Files Found
              </h3>
              <p className="text-emerald-600 mt-1">
                All files in S3 have corresponding database entries.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">
                Orphaned Files
              </h2>
              <p className="text-neutral-500 mt-1">
                Files that exist in S3 but lack corresponding database entries.
              </p>
            </div>
            <div className="text-sm text-neutral-500">
              {files.length} orphaned {files.length === 1 ? "file" : "files"}{" "}
              found
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <div
                key={file.key}
                className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 bg-neutral-100">
                  <OptimizedImage
                    src={file.url}
                    alt={file.key}
                    className="w-full h-48 object-cover"
                    size="preview"
                  />
                </div>

                <div className="p-4">
                  <div className="mb-3">
                    <div className="text-sm font-medium text-neutral-900 break-all">
                      {file.key.replace("marketplace/", "")}
                    </div>
                    <div className="text-sm text-neutral-500 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-neutral-400">
                      Last modified{" "}
                      {formatDistance(
                        new Date(file.last_modified),
                        new Date(),
                        { addSuffix: true },
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(file.key)}
                      disabled={deletingFiles.has(file.key)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                      {deletingFiles.has(file.key) ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrphanedFiles;
