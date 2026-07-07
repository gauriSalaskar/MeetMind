import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "./AppLayout";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-clay/30 border-t-clay rounded-full animate-spin" />
          <p className="text-ink-muted text-sm">Loading MeetMind AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}
