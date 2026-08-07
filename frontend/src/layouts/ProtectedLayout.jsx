import { Outlet } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Sidebar from "../components/layout/Sidebar";

export default function ProtectedLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 px-8 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
