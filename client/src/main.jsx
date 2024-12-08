import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import App from "./App.jsx";
import {AuthProvider} from "./contexts/AuthContext";
import "./index.css";
import {queryClient} from "./utils/queryClient";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
