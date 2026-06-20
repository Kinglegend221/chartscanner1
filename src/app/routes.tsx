// src/app/routes.tsx
import { createBrowserRouter, Navigate } from "react-router";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Scanner from "./pages/Scanner";
import Admin from "./pages/Admin";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-[11px] tracking-widest" style={{ color: "#4a6a80", fontFamily: "JetBrains Mono, monospace" }}>
        LOADING…
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/login", element: <GuestRoute><Login /></GuestRoute> },
  { path: "/register", element: <GuestRoute><Register /></GuestRoute> },
  { path: "/app", element: <ProtectedRoute><Scanner /></ProtectedRoute> },
  { path: "/admin", element: <Admin /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);