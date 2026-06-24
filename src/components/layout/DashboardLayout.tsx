import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Breadcrumb from "../ui/Breadcrumb";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // Auto-hide sidebar if screen size <= 1440px
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 1440) {
        setSidebarHidden(true);
      } else {
        setSidebarHidden(false);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-[#f5f5f7]">
      <Sidebar mini={sidebarHidden} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-hidden overflow-x-hidden">
        <Navbar onBellClick={() => setSidebarHidden((v) => !v)} />
        <main className="flex-1 p-3 h-[calc(100vh-64px)] relative overflow-hidden flex flex-col">
          <div className="flex-none">
            <Breadcrumb />
          </div>
          <div className="flex-1 min-h-0 relative">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
