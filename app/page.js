"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { bebas } from "./fonts"; // ambil font judul dari fonts.js


export default function DashboardDesa() {
  const [page, setPage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [hoverMenu, setHoverMenu] = useState(null);


  const menuItems = [
    ["dashboard", "Dashboard"],
    ["informasi", "Informasi Desa"],
    ["pengumuman", "Pengumuman"],
    ["layanan", "Layanan"],
    ["galeri", "Galeri"],
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-green-700 to-green-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
  <Image
    src="/bireuen.png"
    alt="Logo Desa"
    width={48}
    height={48}
    className="drop-shadow-lg"
  />
  <div className="flex flex-col leading-tight">
    <span className="text-xs font-light text-gray-300 tracking-wide">
      Desa
    </span>
    <span className={`${bebas.className} text-3xl tracking-wider`}>
      BUGAK KRUENG
    </span>
  </div>
</div>






            {/* Menu Desktop */}
            <div className="hidden md:flex space-x-6">
              {menuItems.map(([key, label]) =>
                key === "informasi" ? (
                  <div
                    key={key}
                    className="relative"
                    onMouseEnter={() => setHoverMenu("informasi")}
                    onMouseLeave={() => setHoverMenu(null)}
                  >
                    <button
                      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                        page === key
                          ? "bg-green-600 text-white"
                          : "hover:bg-green-800 hover:text-gray-100"
                      }`}
                    >
                      {label}
                    </button>
                    {hoverMenu === "informasi" && (
  <motion.div
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -5 }}
    transition={{ duration: 0.15 }}
    className="absolute top-full left-0 w-48 bg-white text-gray-700 rounded shadow-lg border z-50"
  >
    <button
      onClick={() => setPage("sejarah")}
      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
    >
      Sejarah Desa
    </button>
    <button
      onClick={() => setPage("visimisi")}
      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
    >
      Visi & Misi
    </button>
    <button
      onClick={() => setPage("perangkat")}
      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
    >
      Perangkat Desa
    </button>
  </motion.div>
)}

                  </div>
                ) : (
                  <button
                    key={key}
                    onClick={() => setPage(key)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      page === key
                        ? "bg-green-600 text-white"
                        : "hover:bg-green-800 hover:text-gray-100"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>


            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Notifikasi */}
              <button className="relative hover:text-yellow-300 transition">
                🔔
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  3
                </span>
              </button>

              {/* Dropdown Profil */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 bg-green-800 px-3 py-1.5 rounded-full hover:bg-green-700 transition"
                >
                  <span className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                    JD
                  </span>
                  <span className="hidden md:inline font-medium">Admin</span>
                </button>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-white text-gray-700 rounded shadow-lg overflow-hidden border"
                  >
                    <a
                    href="/penduduk"
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Admin Panel
                  </a>

                    <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                      Pengaturan
                    </button>
                    <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                      Keluar
                    </button>
                  </motion.div>
                )}
              </div>


              {/* Hamburger for Mobile */}
              <button
                className="md:hidden text-2xl"
                onClick={() => setMobileMenu(!mobileMenu)}
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-green-800 px-4 py-3 space-y-2"
          >
            {menuItems.map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setPage(key);
                  setMobileMenu(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition ${
                  page === key
                    ? "bg-green-600 text-white"
                    : "hover:bg-green-700 text-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </nav>

      {/* Content */}
      <main className="flex-1 p-6 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            {page === "dashboard" && (
              <>
                {/* Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
                    <h2 className="text-sm text-gray-500">Jumlah Penduduk</h2>
                    <p className="text-2xl font-bold text-green-700">2,350</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
                    <h2 className="text-sm text-gray-500">RT/RW</h2>
                    <p className="text-2xl font-bold text-green-700">12/48</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
                    <h2 className="text-sm text-gray-500">Fasilitas Umum</h2>
                    <p className="text-2xl font-bold text-green-700">15</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
                    <h2 className="text-sm text-gray-500">Pengumuman Aktif</h2>
                    <p className="text-2xl font-bold text-green-700">3</p>
                  </div>
                </div>

                {/* Pengumuman */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-4">
                    📢 Pengumuman Terbaru
                  </h2>
                  <ul className="space-y-3 text-gray-700">
                    <li className="border-b pb-2">
                      ⚡ Pemadaman listrik tanggal 20 Maret 2025
                    </li>
                    <li className="border-b pb-2">
                      🌾 Gotong royong bersih desa minggu depan
                    </li>
                    <li className="border-b pb-2">
                      💧 Distribusi air bersih mulai tanggal 25 Maret 2025
                    </li>
                  </ul>
                </div>
              </>
            )}

            {page === "informasi" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">📖 Informasi Desa</h2>
                <p className="text-gray-600 leading-relaxed">
                  Desa Kita adalah desa yang terletak di kecamatan X, kabupaten
                  Y. Desa ini memiliki luas wilayah sekitar 250 hektar dengan
                  jumlah penduduk 2.350 jiwa. Mayoritas penduduk bekerja
                  sebagai petani dan pedagang.
                </p>
              </div>
            )}

                          {page === "sejarah" && (
                          <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-lg font-semibold mb-4">📖 Sejarah Desa</h2>
                            <p className="text-gray-600 leading-relaxed">
                              Desa Kita berdiri sejak tahun 1800-an dengan sejarah panjang
                              perjuangan masyarakat membangun desa yang sejahtera.
                            </p>
                          </div>
                        )}

                        {page === "visimisi" && (
                          <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-lg font-semibold mb-4">🎯 Visi & Misi</h2>
                            <ul className="list-disc pl-6 text-gray-600">
                              <li>Visi: Menjadi desa mandiri, maju, dan sejahtera.</li>
                              <li>Misi: Pemberdayaan masyarakat, pembangunan infrastruktur,
                                  dan peningkatan pelayanan publik.</li>
                            </ul>
                          </div>
                        )}

                        {page === "perangkat" && (
                          <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-lg font-semibold mb-4">👥 Perangkat Desa</h2>
                            <p className="text-gray-600">
                              Struktur perangkat desa terdiri dari kepala desa, sekretaris,
                              bendahara, dan kepala dusun yang bekerja sama melayani masyarakat.
                            </p>
                          </div>
                        )}

            {page === "pengumuman" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">
                  📢 Daftar Pengumuman
                </h2>
                <ul className="space-y-2 text-gray-700">
                  <li>⚡ Pemadaman listrik tanggal 20 Maret 2025</li>
                  <li>🌾 Gotong royong bersih desa minggu depan</li>
                  <li>💧 Distribusi air bersih mulai tanggal 25 Maret 2025</li>
                </ul>
              </div>
            )}

            {page === "layanan" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">⚙️ Layanan Desa</h2>
                <p className="text-gray-600">
                  Warga dapat mengurus administrasi kependudukan, surat
                  keterangan usaha, pengajuan bantuan, dan layanan lainnya di
                  kantor desa setiap hari kerja.
                </p>
              </div>
            )}

            {page === "galeri" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">
                  🖼️ Galeri Foto Desa
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="h-32 bg-green-200 rounded-lg flex items-center justify-center">
                    Foto A
                  </div>
                  <div className="h-32 bg-green-300 rounded-lg flex items-center justify-center">
                    Foto B
                  </div>
                  <div className="h-32 bg-green-400 rounded-lg flex items-center justify-center">
                    Foto C
                  </div>
                  <div className="h-32 bg-green-500 rounded-lg flex items-center justify-center text-white">
                    Foto D
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white text-center text-sm text-gray-500 py-3 shadow-inner">
        &copy; 2025 Desa Kita
      </footer>
    </div>
  );
}
