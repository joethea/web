"use client";
import { useState, useRef, useEffect } from "react";
import PendudukPage from "./PendudukPage";
import DashboardPage from "./PendudukDashboard"; // ✅ diperbaiki
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef(null);

  // Tutup menu user jika klik di luar
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
        return <DashboardPage />; // ✅ panggil dashboard
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

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside
        className={`
          group fixed inset-y-0 left-0 z-[100] bg-white text-gray-700 border-r border-gray-200
          flex flex-col transition-all duration-300
          w-64 transform md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:w-20 md:hover:w-64
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-center md:justify-start">
          <span className="font-bold text-lg text-indigo-600 hidden group-hover:inline">
            DesaApp
          </span>
          <span className="md:hidden block font-bold text-lg text-indigo-600">
            DA
          </span>
        </div>

        {/* User Dropdown */}
        <div ref={menuRef} className="relative p-4 border-b border-gray-200">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 bg-gray-100 rounded-full hover:bg-gray-200 transition
                       w-10 h-10 justify-center group-hover:w-auto group-hover:px-3"
          >
            <span className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
              JD
            </span>
            <span className="hidden group-hover:inline font-medium">Admin</span>
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

        {/* Navigasi */}
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
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition relative ${
                page === key
                  ? "bg-gray-100 text-indigo-600 font-semibold border-l-4 border-indigo-500"
                  : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              {icon}
              <span className="hidden group-hover:inline">{text}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <footer className="p-4 text-xs text-gray-400 border-t border-gray-200 overflow-hidden whitespace-nowrap">
          <span className="hidden group-hover:inline">
            &copy; 2025 Desa Kita
          </span>
        </footer>
      </aside>

      {/* Overlay HP */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300
          ${sidebarOpen ? "ml-64" : "ml-20"}
        `}
      >
        {/* Tombol toggle sidebar di HP */}
        <div className="md:hidden p-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-indigo-700 bg-white p-2 rounded-md shadow hover:bg-gray-100"
          >
            ☰
          </button>
        </div>

        {/* Konten */}
        <main className="flex-1 p-4 md:p-6 space-y-6">{renderContent()}</main>
      </div>
    </div>
  );
}
