import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { App } from "./App"
import { AuthProvider } from "./types/auth-context"
import { persistQueryClientOptions, queryClient } from "./lib/query-client"
import "./styles.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistQueryClientOptions}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </React.StrictMode>,
)
