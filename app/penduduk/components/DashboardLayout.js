"use client";
import { useState, useRef, useEffect } from "react";
import PendudukPage from "./PendudukPage";
import DashboardPage from "./PendudukDashboard";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Settings,
  Image,
  LogOut,
  User,
} from "lucide-react";

export default function DashboardLayout({ defaultPage = "dashboard" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(defaultPage);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile slide in/out
  const [sidebarExpanded, setSidebarExpanded] = useState(false); // desktop collapsed/expanded (hover)
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderContent = () => {
    switch (page) {
      case "dashboard":
        return <DashboardPage />;
      case "penduduk":
        return <PendudukPage />;
      case "pengumuman":
        return <div className="text-gray-700">📢 Halaman Pengumuman</div>;
      case "layanan":
        return <div className="text-gray-700">⚙️ Halaman Layanan</div>;
      case "galeri":
        return <div className="text-gray-700">🖼️ Halaman Galeri</div>;
      default:
        return <div className="text-gray-700">Halaman tidak ditemukan</div>;
    }
  };

  // helper: aside width class for desktop based on sidebarExpanded
  const asideWidthClass = sidebarExpanded ? "md:w-64" : "md:w-20";
  // mobile translate class
  const asideTranslateClass = sidebarOpen ? "translate-x-0" : "-translate-x-full";

  // main margin:
  // - mobile: when sidebarOpen -> ml-64, else ml-0
  // - desktop: when expanded -> md:ml-64, else -> md:ml-20
  const mainMobileMargin = sidebarOpen ? "ml-64" : "ml-0";
  const mainDesktopMargin = sidebarExpanded ? "md:ml-64" : "md:ml-20";

  // only expand sidebar on desktop pointer (avoid triggering on mobile)
  const handleMouseEnter = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setSidebarExpanded(true);
    }
  };
  const handleMouseLeave = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setSidebarExpanded(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          fixed inset-y-0 left-0 z-[100]
          bg-gradient-to-b from-emerald-700 to-green-500 text-white
          border-r border-green-700
          flex flex-col transition-all duration-300 ease-in-out transform
          w-64 ${asideTranslateClass} md:translate-x-0 ${asideWidthClass}
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-green-700 flex items-center justify-center md:justify-start">
          {/* Small label for collapsed desktop */}
          <span className={`text-white font-bold text-lg transition-all duration-200 ${sidebarExpanded ? "opacity-100" : "opacity-0 md:opacity-0"}`}>
            DesaApp
          </span>

          {/* Always show small initials on very small screens (mobile) */}
          <span className="md:hidden block font-bold text-lg text-white">DA</span>
        </div>

        {/* User Dropdown */}
        <div ref={menuRef} className="relative p-4 border-b border-green-700">
          <button
  onClick={() => setMenuOpen(!menuOpen)}
  className={`flex items-center bg-emerald-600 hover:bg-emerald-500 transition-all duration-300 h-10 rounded-full overflow-hidden ${
    sidebarExpanded ? "px-3 justify-start" : "w-10 justify-center"
  }`}
>
  {/* Avatar selalu bulat dan center */}
  <span className="w-8 h-8 flex-shrink-0 rounded-full bg-green-800 flex items-center justify-center text-white font-bold">
    JD
  </span>

  {/* Label muncul halus ketika sidebar expanded */}
  <span
    className={`ml-2 text-sm font-medium whitespace-nowrap transition-all duration-300 ${
      sidebarExpanded ? "opacity-100" : "opacity-0 hidden"
    }`}
  >
    Admin
  </span>
</button>



          {menuOpen && (
            <div className="absolute left-0 mt-2 w-44 bg-white text-gray-700 rounded shadow-lg overflow-hidden border z-50">
              <button className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                <User className="w-4 h-4" /> Profil
              </button>
              <button className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                <Settings className="w-4 h-4" /> Pengaturan
              </button>
              <button className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600">
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-2">
          {[
            ["dashboard", "Dashboard", <LayoutDashboard className="w-5 h-5" />],
            ["penduduk", "Penduduk", <Users className="w-5 h-5" />],
            ["pengumuman", "Pengumuman", <Megaphone className="w-5 h-5" />],
            ["layanan", "Layanan", <Settings className="w-5 h-5" />],
            ["galeri", "Galeri", <Image className="w-5 h-5" />],
          ].map(([key, text, icon]) => (
            <button
              key={key}
              onClick={() => {
                setPage(key);
                // auto hide on mobile
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition relative ${
                page === key ? "bg-green-700 text-white font-semibold border-l-4 border-lime-300" : "hover:bg-green-600 text-white"
              }`}
            >
              <span className="flex items-center">{icon}</span>
              {/* label: hidden when collapsed; revealed by sidebarExpanded */}
              <span className={`ml-2 text-sm transition-all duration-200 overflow-hidden ${sidebarExpanded ? "max-w-xs opacity-100" : "max-w-0 opacity-0"}`}>
                {text}
              </span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <footer className="p-4 text-xs text-green-100 border-t border-green-700 overflow-hidden whitespace-nowrap">
          <span className={`transition-all duration-200 ${sidebarExpanded ? "opacity-100" : "opacity-0"}`}>&copy; 2025 Desa Kita</span>
        </footer>
      </aside>

      {/* Overlay only visible on small screens when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main: mobile margin + desktop margin controlled by sidebarExpanded (state), NO :hover on main */}
      <div className={`flex-1 flex flex-col transition-all duration-300 w-full ${mainMobileMargin} ${mainDesktopMargin}`}>
        {/* Toggle button only for small screens */}
        <div className="md:hidden p-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white bg-emerald-600 p-2 rounded-md shadow hover:bg-emerald-700"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        </div>

        <main className="flex-1 p-4 md:p-6 space-y-6">{renderContent()}</main>
      </div>
    </div>
  );
}
