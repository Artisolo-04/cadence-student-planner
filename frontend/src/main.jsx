import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SidebarProvider } from "./context/SidebarContext.jsx";
import { WorkspaceProvider } from "./context/WorkspaceContext.jsx";
import UserScope from "./components/UserScope.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <UserScope>
          <WorkspaceProvider>
            <SidebarProvider>
              <App />
            </SidebarProvider>
          </WorkspaceProvider>
          </UserScope>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
