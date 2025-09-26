"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// mapping foto ketua dusun (taruh di /public/ketua/)
const ketuaImages = {
  "Dusun A": "/ketua/Dusun A.jpg",
  "Dusun B": "/ketua/Dusun B.jpg",
  "Dusun C": "/ketua/Dusun C.jpg",
  "Dusun D": "/ketua/Dusun D.jpg",
  Unknown: "/ketua/default.jpg",
};

// label kategori umur dengan rentang
const umurLabelMap = {
  Balita: "Balita (0-4)",
  "Anak-anak": "Anak (5-14)",
  Remaja: "Remaja (15-24)",
  Dewasa: "Dewasa (25-59)",
  Lansia: "Lansia (60+)",
  "Tidak diketahui": "Tidak diketahui",
};

// Komponen Card per Dusun
function DusunCard({ dusun, data }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 h-full">
      {/* Header: foto ketua dusun */}
      <div
        className="bg-indigo-600 text-white flex items-center gap-3 py-3"
        style={{ paddingLeft: "6px", paddingRight: "6px" }}
      >
        <Image
          src={ketuaImages[dusun] || ketuaImages.Unknown}
          alt={`Ketua ${dusun}`}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full border-2 border-white object-cover"
        />
        <h3 className="text-lg font-semibold">{dusun}</h3>
      </div>

      {/* Isi statistik utama */}
      <div
        className="space-y-4 text-sm"
        style={{ paddingLeft: "9px", paddingRight: "6px", paddingTop: "12px", paddingBottom: "12px" }}
      >
        {/* total L P */}
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium text-gray-600">Total</div>
          <div className="font-semibold text-gray-900">{data.total}</div>

          <div className="font-medium text-gray-600">Laki-laki</div>
          <div className="text-blue-600 font-semibold">{data.L}</div>

          <div className="font-medium text-gray-600">Perempuan</div>
          <div className="text-pink-600 font-semibold">{data.P}</div>
        </div>

        {/* Umur kategori breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              👶 Kategori Umur
              <span
                className="text-gray-400 cursor-pointer"
                title="Balita: 0-4 | Anak-anak: 5-14 | Remaja: 15-24 | Dewasa: 25-59 | Lansia: 60+"
              >
                ℹ
              </span>
            </h4>
            <div className="grid grid-cols-3 text-xs font-semibold text-gray-500 w-32 text-center">
              <span>L</span>
              <span>P</span>
              <span>JLH</span>
            </div>
          </div>

          <div className="space-y-1">
            {Object.entries(data.umurKategori).map(([cat, val]) => {
              const total = val.L + val.P;
              return (
                <div
                  key={cat}
                  className="grid grid-cols-[1fr_8rem] bg-gray-50 py-1 rounded text-sm items-center"
                  style={{ paddingLeft: "6px", paddingRight: "6px" }}
                >
                  <span className="truncate">{umurLabelMap[cat] || cat}</span>
                  <div className="grid grid-cols-3 text-center">
                    <span className="text-blue-600">{val.L}</span>
                    <span className="text-pink-600">{val.P}</span>
                    <span className="text-gray-600">{total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status kawin breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              💍 Status Kawin
              <span
                className="text-gray-400 cursor-pointer"
                title="Status pernikahan penduduk"
              >
                ℹ
              </span>
            </h4>
            <div className="grid grid-cols-3 text-xs font-semibold text-gray-500 w-32 text-center">
              <span>L</span>
              <span>P</span>
              <span>JLH</span>
            </div>
          </div>

          <div className="space-y-1">
            {Object.entries(data.statusKawin).map(([st, val]) => {
              const total = val.L + val.P;
              return (
                <div
                  key={st}
                  className="grid grid-cols-[1fr_8rem] bg-gray-50 py-1 rounded text-sm items-center"
                  style={{ paddingLeft: "9px", paddingRight: "6px" }}
                >
                  <span className="capitalize truncate">{st}</span>
                  <div className="grid grid-cols-3 text-center">
                    <span className="text-blue-600">{val.L}</span>
                    <span className="text-pink-600">{val.P}</span>
                    <span className="text-gray-600">{total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Halaman Dashboard
export default function PendudukDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/penduduk/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetch stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-6">Loading data...</p>;
  if (!stats) return <p className="p-6 text-red-600">Gagal memuat data</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        🏘️ Dashboard Penduduk per Dusun
      </h1>

      {/* Flex wrap pakai persentase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 -ml-6 -mr-6">
  {Object.entries(stats.detailPerDusun).map(([dusun, data]) => (
    <DusunCard key={dusun} dusun={dusun} data={data} />
  ))}
</div>

    </div>
  );
}
