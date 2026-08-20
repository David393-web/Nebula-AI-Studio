import { Outlet } from "react-router-dom";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export default function MainLayout() {
  return (
    <div className="h-screen bg-black p-2 text-white">
      <div className="flex h-full overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950">

        {/* Sidebar */}
        <Sidebar />

        {/* Main Application */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Navbar */}
          <Navbar />

          {/* Page Content */}
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1700px] px-6 py-7 lg:px-8">
              <Outlet />
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}