import { Outlet } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Sidebar from "../components/layout/Sidebar";
import BottomNav from "../components/layout/BottomNav";

export default function ProtectedLayout() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--color-bg)]">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="relative min-w-0 flex-1 overflow-y-auto scrollbar-cadence px-8 py-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
