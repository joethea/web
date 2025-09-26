"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from "recharts";

// Palet warna profesional untuk konsistensi
const BUSINESS_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#6B7280", // Gray
  "#8B5CF6", // Purple
  "#14B8A6", // Teal
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

// 📌 Helper untuk tooltip
const tooltipFormatter = (val) => [`${val} penduduk`, "Jumlah"];

// 📌 Card Wrapper dengan styling bisnis
function Card({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="mb-3 text-gray-700 font-semibold text-lg">{title}</div>
      <div>{children}</div>
    </div>
  );
}

// 📌 Dusun Card Component
function DusunCard({ dusun, stats }) {
  const total = stats?.jml || 0;
  const lakiLaki = stats?.jenisKelamin?.L || 0;
  const perempuan = stats?.jenisKelamin?.P || 0;
  const anakAnak = stats?.umurKategori?.["Anak-anak (5-12)"] || 0;
  const remaja = stats?.umurKategori?.["Remaja (13-17)"] || 0;
  const dewasa = (stats?.umurKategori?.["Dewasa Muda (18-25)"] || 0) + (stats?.umurKategori?.["Dewasa (26-45)"] || 0);
  const lansia = stats?.umurKategori?.["Lansia (65+)"] || 0;
  const kawin = stats?.statusKawin?.sudah || 0;
  const belumKawin = stats?.statusKawin?.belum || 0;
  const pernahKawin = stats?.statusKawin?.pernah || 0;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 mb-4">
      {/* Header dengan foto ketua dusun (placeholder image) */}
      <div className="h-32 bg-gray-300 rounded-t-lg flex items-center justify-center">
        <img
          src={`https://via.placeholder.com/100?text=Ketua+Dusun+${dusun}`}
          alt={`Foto Ketua Dusun ${dusun}`}
          className="w-24 h-24 rounded-full border-4 border-white -mt-12"
        />
      </div>
      {/* Detail Statistik */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-indigo-700 mb-2">{dusun}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Total Penduduk: {total}</div>
          <div>Laki-laki: {lakiLaki}</div>
          <div>Perempuan: {perempuan}</div>
          <div>Anak-anak: {anakAnak}</div>
          <div>Remaja: {remaja}</div>
          <div>Dewasa: {dewasa}</div>
          <div>Lansia: {lansia}</div>
          <div>Sudah Kawin: {kawin}</div>
          <div>Belum Kawin: {belumKawin}</div>
          <div>Pernah Kawin: {pernahKawin}</div>
        </div>
      </div>
    </div>
  );
}

// Custom Tick untuk YAxis Dusun (jika diperlukan, bisa disesuaikan)
const CustomDusunTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} 
        y={0} 
        dx={-5} 
        dy={5} 
        textAnchor="end" 
        fill="#374151" 
        fontSize={13} 
        fontWeight={600}
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
      >
        {payload.value}
      </text>
    </g>
  );
};

export default function PendudukDashboard() {
  const tabs = ["Demografi", "Ekonomi", "Pendidikan & Pekerjaan", "Bantuan"];
  const [tab, setTab] = useState("Demografi");

  // Filter state
  const [dusun, setDusun] = useState("");
  const [tahun, setTahun] = useState("");
  const [bulan, setBulan] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [statusKawin, setStatusKawin] = useState("");
  const [umurMin, setUmurMin] = useState("");
  const [umurMax, setUmurMax] = useState("");
  const [ekonomiFilter, setEkonomiFilter] = useState("");
  const [bantuanFilter, setBantuanFilter] = useState("");
  const [topN, setTopN] = useState(10);

  const [stats, setStats] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Build query
  const buildQuery = () => {
    const qp = new URLSearchParams();
    if (dusun) qp.append("alamat_dusun", dusun);
    if (tahun) qp.append("tahun", tahun);
    if (bulan) qp.append("bulan", bulan);
    if (jenisKelamin) qp.append("jenis_kelamin", jenisKelamin);
    if (statusKawin) qp.append("status", statusKawin);
    if (umurMin) qp.append("umur_min", umurMin);
    if (umurMax) qp.append("umur_max", umurMax);
    if (ekonomiFilter) qp.append("miskin_sangat", ekonomiFilter);
    if (bantuanFilter) qp.append("bantuan_sosial", bantuanFilter);
    qp.append("limit", "10000");
    return qp.toString();
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = buildQuery();
      const res = await fetch(`/api/penduduk/stats?${q}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Gagal ambil data");
      setStats(json.stats || null);
      setMeta(json.meta || null);
    } catch (err) {
      setError(err.message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const resetFilters = () => {
    setDusun("");
    setTahun("");
    setBulan("");
    setJenisKelamin("");
    setStatusKawin("");
    setUmurMin("");
    setUmurMax("");
    setEkonomiFilter("");
    setBantuanFilter("");
    setTopN(10);
    fetchStats();
  };

  // 📌 Data Preparation
  const perDusunData = useMemo(() => {
    if (!stats?.perDusun) return [];
    return Object.entries(stats.perDusun)
      .map(([k, v]) => ({ dusun: k, jml: v, ...stats }))
      .sort((a, b) => b.jml - a.jml);
  }, [stats]);

  const perBulanData = useMemo(() => {
    if (!stats?.perBulan) return [];
    // Mengubah angka bulan menjadi nama bulan
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return Object.entries(stats.perBulan)
      .map(([bulanNum, jml]) => ({
        bulan: monthNames[parseInt(bulanNum) - 1], // Konversi ke nama bulan
        jml,
      }))
      .sort((a, b) => monthNames.indexOf(a.bulan) - monthNames.indexOf(b.bulan)); // Urutkan berdasarkan bulan
  }, [stats]);

  const jenisKelaminData = [
    { name: "Laki-laki", value: stats?.jenisKelamin?.L || 0 },
    { name: "Perempuan", value: stats?.jenisKelamin?.P || 0 },
  ];

  const statusKawinData = [
    { label: "Belum Kawin", value: stats?.statusKawin?.belum || 0 },
    { label: "Sudah Kawin", value: stats?.statusKawin?.sudah || 0 },
    { label: "Pernah Kawin", value: stats?.statusKawin?.pernah || 0 },
  ];

  // 📌 Pendidikan Mapping
  const pendidikanMap = {
    TK: "TK",
    SD: "SD",
    SMP: "SMP",
    SMA: "SMA",
    D1: "Diploma I",
    D2: "Diploma II",
    D3: "Diploma III",
    S1: "Sarjana (S1)",
    S2: "Magister (S2)",
    S3: "Doktor (S3)",
    Lainnya: "Lainnya",
  };
  const pendidikanData = useMemo(() => {
    if (!stats?.pendidikan) return [];
    return Object.entries(stats.pendidikan).map(([k, v]) => ({
      label: pendidikanMap[k] || k,
      value: v,
    }));
  }, [stats]);

  const pekerjaanData = useMemo(() => {
    if (!stats?.pekerjaan) return [];
    const arr = Object.entries(stats.pekerjaan).map(([k, v]) => ({
      label: k,
      value: v,
    }));
    const sorted = arr.sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, topN);
    if (sorted.length > topN) {
      const sisa = sorted.slice(topN).reduce((acc, cur) => acc + cur.value, 0);
      top.push({ label: "Lainnya", value: sisa });
    }
    return top;
  }, [stats, topN]);

  const ekonomiData = useMemo(() => {
    if (!stats?.ekonomi) return [];
    // Urutkan kategori ekonomi secara logis
    const order = ["Sangat Miskin", "Miskin", "Kurang Mampu", "Mampu", "Kaya", "Sangat Kaya"];
    const data = Object.entries(stats.ekonomi).map(([k, v]) => ({ label: k, value: v }));
    return data.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  }, [stats]);

  const bantuanData = useMemo(() => {
    if (!stats?.bantuan) return [];
    const arr = Object.entries(stats.bantuan).map(([k, v]) => ({
      label: k,
      value: v,
    }));
    return arr.sort((a, b) => b.value - a.value).slice(0, topN);
  }, [stats, topN]);

  const usiaData = useMemo(() => {
    if (!stats?.umurKategori) return [];
    // Urutkan kategori usia secara logis
    const order = ["Balita (0-4)", "Anak-anak (5-12)", "Remaja (13-17)", "Dewasa Muda (18-25)", "Dewasa (26-45)", "Paruh Baya (46-64)", "Lansia (65+)"];
    const data = Object.entries(stats.umurKategori).map(([k, v]) => ({
      label: k,
      value: v,
    }));
    return data.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  }, [stats]);

  const yatimData = useMemo(() => {
    if (!stats?.yatim) return [];
    return Object.entries(stats.yatim).map(([k, v]) => ({ label: k, value: v }));
  }, [stats]);

  // 📌 Ringkasan Cards
  const summaryCards = [
    { title: "Total Penduduk", value: stats?.total || 0, color: "bg-indigo-600" },
    { title: "Laki-laki", value: stats?.jenisKelamin?.L || 0, color: "bg-blue-600" },
    { title: "Perempuan", value: stats?.jenisKelamin?.P || 0, color: "bg-pink-600" },
    { title: "Produktif (15-64)", value: stats?.produktif?.produktif || 0, color: "bg-green-600" },
    { title: "Non-Produktif", value: stats?.produktif?.non_produktif || 0, color: "bg-rose-600" },
    { title: "Yatim/Piatu", value: (stats?.yatim?.yatim || 0) + (stats?.yatim?.piatu || 0) + (stats?.yatim?.yatimpiatu || 0), color: "bg-yellow-500" },
  ];

  // Styling Tooltip umum
  const commonTooltipStyle = {
    contentStyle: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #D1D5DB',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '8px 12px'
    },
    labelStyle: {
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: '4px'
    },
    itemStyle: {
      color: '#374151',
      fontSize: '13px'
    }
  };

  // Styling Axis umum
  const commonAxisTickStyle = {
    fontSize: 12,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fill: '#6B7280',
    fontWeight: 500
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-indigo-700 mb-6">📊 Dashboard Penduduk</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="Dusun" value={dusun} onChange={(e) => setDusun(e.target.value)} />
          <input className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="Tahun (YYYY)" value={tahun} onChange={(e) => setTahun(e.target.value)} />
          <select className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={bulan} onChange={(e) => setBulan(e.target.value)}>
            <option value="">Semua Bulan</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString("id-ID", { month: "long" })}</option>
            ))}
          </select>
          <select className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)}>
            <option value="">Semua JK</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          <select className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={statusKawin} onChange={(e) => setStatusKawin(e.target.value)}>
            <option value="">Semua Status Kawin</option>
            <option value="S">Sudah Kawin</option>
            <option value="B">Belum Kawin</option>
            <option value="P">Pernah Kawin</option>
          </select>
          <input type="number" className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="Umur Min" value={umurMin} onChange={(e) => setUmurMin(e.target.value)} />
          <input type="number" className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="Umur Max" value={umurMax} onChange={(e) => setUmurMax(e.target.value)} />
          <select className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={ekonomiFilter} onChange={(e) => setEkonomiFilter(e.target.value)}>
            <option value="">Semua Ekonomi</option>
            <option value="Sangat Miskin">Sangat Miskin</option>
            <option value="Miskin">Miskin</option>
            <option value="Kurang Mampu">Kurang Mampu</option>
            <option value="Mampu">Mampu</option>
            <option value="Kaya">Kaya</option>
            <option value="Sangat Kaya">Sangat Kaya</option>
          </select>
          <input className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 col-span-2" placeholder="Bantuan Sosial" value={bantuanFilter} onChange={(e) => setBantuanFilter(e.target.value)} />
          <div className="flex gap-2 col-span-2">
            <button onClick={fetchStats} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">Terapkan</button>
            <button onClick={resetFilters} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">Reset</button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {summaryCards.map((c, i) => (
          <div key={i} className={`${c.color} text-white p-4 rounded-lg shadow-md`}>
            <div className="text-sm opacity-90">{c.title}</div>
            <div className="text-2xl font-bold mt-1">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button 
            key={t} 
            onClick={() => setTab(t)} 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors 
              ${tab === t ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content per Tab */}
      {tab === "Demografi" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cards per Dusun */}
          {perDusunData.map((data, index) => (
            <DusunCard key={index} dusun={data.dusun} stats={stats} />
          ))}

          <Card title="📅 Penduduk per Bulan Masuk">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={perBulanData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid 
                  stroke="#F3F4F6" 
                  strokeDasharray="3 3" 
                  opacity={0.7}
                />
                <XAxis 
                  dataKey="bulan"
                  axisLine={false}
                  tickLine={false}
                  tick={commonAxisTickStyle}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={commonAxisTickStyle}
                />
                <Tooltip {...commonTooltipStyle} formatter={tooltipFormatter} />
                <Line 
                  type="monotone" 
                  dataKey="jml" 
                  stroke={BUSINESS_COLORS[0]} // Blue
                  strokeWidth={3} 
                  dot={{ 
                    r: 6, 
                    fill: BUSINESS_COLORS[0], 
                    strokeWidth: 2, 
                    stroke: '#FFFFFF' 
                  }}
                  activeDot={{ 
                    r: 8, 
                    fill: BUSINESS_COLORS[0], 
                    strokeWidth: 2, 
                    stroke: '#FFFFFF' 
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="⚧️ Jenis Kelamin">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <Pie
                  data={jenisKelaminData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100} 
                  innerRadius={60}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                  labelStyle={{
                    fontSize: '12px',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    fill: '#374151',
                    fontWeight: 500
                  }}
                >
                  {jenisKelaminData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0
                          ? BUSINESS_COLORS[0]  // Blue for Laki-laki
                          : BUSINESS_COLORS[1] // Green for Perempuan
                      }
                    />
                  ))}
                </Pie>
                <Tooltip {...commonTooltipStyle} formatter={tooltipFormatter} />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginTop: '10px'
                  }}
                  iconType="circle"
                  iconSize={10}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card title="👶 Kategori Usia">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={usiaData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                barCategoryGap="25%"
              >
                <CartesianGrid 
                  stroke="#F3F4F6" 
                  strokeDasharray="3 3" 
                  opacity={0.7}
                />
                <XAxis 
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={commonAxisTickStyle}
                  angle={-45}
                  textAnchor="end"
                  height={80} // Memberi ruang lebih untuk label miring
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={commonAxisTickStyle}
                />
                <Tooltip {...commonTooltipStyle} formatter={tooltipFormatter} />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                >
                  {usiaData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0
                          ? BUSINESS_COLORS[0]  // Blue for young
                          : index === 1
                          ? BUSINESS_COLORS[1] // Green for middle
                          : index === 2
                          ? BUSINESS_COLORS[2] // Amber for older
                          : BUSINESS_COLORS[4] // Gray for others
                      }
                      style={{
                        stroke: '#FFFFFF',
                        strokeWidth: 1
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {tab === "Ekonomi" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="💰 Status Ekonomi">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={ekonomiData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} barCategoryGap="25%">
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" opacity={0.7} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={commonAxisTickStyle} angle={-30} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={commonAxisTickStyle} />
                <Tooltip {...commonTooltipStyle} formatter={tooltipFormatter} />
                <Bar dataKey="value" fill={BUSINESS_COLORS[2]} radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="💰 Persentase Ekonomi">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <Pie data={ekonomiData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={3}
                  label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                  labelStyle={{
                    fontSize: '12px',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    fill: '#374151',
                    fontWeight: 500
                  }}
                >
                  {ekonomiData.map((_, i) => <Cell key={i} fill={BUSINESS_COLORS[i % BUSINESS_COLORS.length]} />)}
                </Pie>
                <Tooltip {...commonTooltipStyle} formatter={tooltipFormatter} />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginTop: '10px'
                  }}
                  iconType="circle"
                  iconSize={10}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="💍 Status Kawin">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={statusKawinData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} barCategoryGap="25%">
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" opacity={0.7} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={commonAxisTickStyle} />
                <YAxis axisLine={false} tickLine={false} tick={commonAxisTickStyle} />
                <Tooltip {...commonTooltipStyle} formatter={tooltipFormatter} />
                <Bar dataKey="value" fill={BUSINESS_COLORS[5]} radius={[4, 4, 0, 0]} barSize={24} /> {/* Purple */}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {tab === "Pendidikan & Pekerjaan" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="🎓 Tingkat Pendidikan">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={pendidikanData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} barCategoryGap="25%">
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" opacity={0.7} />
                <XAxis dataKey="label" angle={-45} textAnchor="end" interval={0} height={80} tick={commonAxisTickStyle} />
                <YAxis axisLine={false} tickLine={false} tick={commonAxisTickStyle} />
                <Tooltip {...commonTooltipStyle} formatter={tooltipFormatter} />
                <Bar dataKey="value" fill={BUSINESS_COLORS[0]} radius={[4, 4, 0, 0]} barSize={24} /> {/* Blue */}
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title={`💼 Pekerjaan (Top ${topN} + Lainnya)`}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={pekerjaanData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} barCategoryGap="25%">
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" opacity={0.7} />
                <XAxis dataKey="label" angle={-45} textAnchor="end" interval={0} height={80} tick={commonAxisTickStyle} />
                <YAxis axisLine={false} tickLine={false} tick={commonAxisTickStyle} />
                <Tooltip {...commonTooltipStyle} formatter={tooltipFormatter} />
                <Bar dataKey="value" fill={BUSINESS_COLORS[1]} radius={[4, 4, 0, 0]} barSize={24} /> {/* Green */}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {tab === "Bantuan" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title={`🎁 Bantuan Sosial (Top ${topN})`}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={bantuanData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} barCategoryGap="25%">
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" opacity={0.7} />
                <XAxis dataKey="label" angle={-45} textAnchor="end" interval={0} height={80} tick={commonAxisTickStyle} />
                <YAxis axisLine={false} tickLine={false} tick={commonAxisTickStyle} />
                <Tooltip {...commonTooltipStyle} formatter={tooltipFormatter} />
                <Bar dataKey="value" fill={BUSINESS_COLORS[6]} radius={[4, 4, 0, 0]} barSize={24} /> {/* Teal */}
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="🧒 Status Yatim/Piatu">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <Pie data={yatimData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={3}
                  label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                  labelStyle={{
                    fontSize: '12px',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    fill: '#374151',
                    fontWeight: 500
                  }}
                >
                  {yatimData.map((_, i) => <Cell key={i} fill={BUSINESS_COLORS[i % BUSINESS_COLORS.length]} />)}
                </Pie>
                <Tooltip {...commonTooltipStyle} formatter={tooltipFormatter} />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginTop: '10px'
                  }}
                  iconType="circle"
                  iconSize={10}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}