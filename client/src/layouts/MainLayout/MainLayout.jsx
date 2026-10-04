import { Outlet } from "react-router-dom";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import OnboardingTour from "@/components/onboarding/OnboardingTour";

export default function MainLayout() {
  return (
    <div className="min-h-[100dvh] bg-black p-0 text-white md:h-screen md:p-2">
      <div className="flex min-h-[100dvh] overflow-hidden bg-zinc-950 md:h-full md:min-h-0 md:rounded-2xl md:border md:border-zinc-800/80">

        {/* Sidebar */}
        <Sidebar />

        {/* Main Application */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Navbar */}
          <Navbar />

          {/* Page Content */}
          <main className="min-w-0 flex-1 overflow-y-auto pb-24 md:pb-0">
            <div className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 md:py-7 lg:px-8">
              <Outlet />
            </div>
          </main>

        </div>
      </div>
      <OnboardingTour />
    </div>
  );
}
