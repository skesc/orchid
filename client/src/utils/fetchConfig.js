export const API_URL = "http://localhost:5000";

export const fetchConfig = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

export async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchConfig,
    ...options,
    headers: {
      ...fetchConfig.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
