"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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

// Helper untuk tooltip
const tooltipFormatter = (val) => [`${val} penduduk`, "Jumlah"];

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

// Komponen Card wrapper
function Card({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="mb-3 text-gray-700 font-semibold text-lg">{title}</div>
      <div>{children}</div>
    </div>
  );
}

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

export default function PendudukDashboardPage() {
  const tabs = ["Demografi", "Ekonomi", "Pendidikan & Pekerjaan", "Bantuan"];
  const [tab, setTab] = useState("Demografi");

  // Filter state
  const [dusunFilter, setDusunFilter] = useState("");
  const [tahunFilter, setTahunFilter] = useState("");
  const [bulanFilter, setBulanFilter] = useState("");
  const [jenisKelaminFilter, setJenisKelaminFilter] = useState("");
  const [statusKawinFilter, setStatusKawinFilter] = useState("");
  const [umurMinFilter, setUmurMinFilter] = useState("");
  const [umurMaxFilter, setUmurMaxFilter] = useState("");
  const [ekonomiFilter, setEkonomiFilter] = useState("");
  const [bantuanFilter, setBantuanFilter] = useState("");
  const [topN, setTopN] = useState(10);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Build query
  const buildQuery = () => {
    const qp = new URLSearchParams();
    if (dusunFilter) qp.append("alamat_dusun", dusunFilter);
    if (tahunFilter) qp.append("tahun", tahunFilter);
    if (bulanFilter) qp.append("bulan", bulanFilter);
    if (jenisKelaminFilter) qp.append("jenis_kelamin", jenisKelaminFilter);
    if (statusKawinFilter) qp.append("status", statusKawinFilter);
    if (umurMinFilter) qp.append("umur_min", umurMinFilter);
    if (umurMaxFilter) qp.append("umur_max", umurMaxFilter);
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
      if (!res.ok) throw new Error(json?.error || "Gagal memuat data");
      setStats(json.stats || null);
    } catch (err) {
      setError(err.message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, []);

  const resetFilters = () => {
    setDusunFilter("");
    setTahunFilter("");
    setBulanFilter("");
    setJenisKelaminFilter("");
    setStatusKawinFilter("");
    setUmurMinFilter("");
    setUmurMaxFilter("");
    setEkonomiFilter("");
    setBantuanFilter("");
    setTopN(10);
    fetchStats();
  };

  // Data Preparation
  const perDusunData = useMemo(() => {
    if (!stats?.detailPerDusun) return [];
    return Object.entries(stats.detailPerDusun)
      .map(([k, v]) => ({ dusun: k, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [stats]);

  const perBulanData = useMemo(() => {
    if (!stats?.perBulan) return [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return Object.entries(stats.perBulan)
      .map(([bulanNum, jml]) => ({
        bulan: monthNames[parseInt(bulanNum) - 1],
        jml,
      }))
      .sort((a, b) => monthNames.indexOf(a.bulan) - monthNames.indexOf(b.bulan));
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
    const order = Object.keys(umurLabelMap);
    const data = Object.entries(stats.umurKategori).map(([k, v]) => ({
      label: umurLabelMap[k] || k,
      value: v.L + v.P,
    }));
    return data.sort((a, b) => order.indexOf(a.label.split(' ')[0]) - order.indexOf(b.label.split(' ')[0]));
  }, [stats]);

  const yatimData = useMemo(() => {
    if (!stats?.yatim) return [];
    return Object.entries(stats.yatim).map(([k, v]) => ({ label: k, value: v }));
  }, [stats]);

  // Ringkasan Cards
  const summaryCards = [
    { title: "Total Penduduk", value: stats?.total || 0, color: "bg-indigo-600" },
    { title: "Laki-laki", value: stats?.jenisKelamin?.L || 0, color: "bg-blue-600" },
    { title: "Perempuan", value: stats?.jenisKelamin?.P || 0, color: "bg-pink-600" },
    { title: "Produktif (15-64)", value: stats?.produktif?.produktif || 0, color: "bg-green-600" },
    { title: "Non-Produktif", value: stats?.produktif?.non_produktif || 0, color: "bg-rose-600" },
    { title: "Yatim/Piatu", value: (stats?.yatim?.yatim || 0) + (stats?.yatim?.piatu || 0) + (stats?.yatim?.yatimpiatu || 0), color: "bg-yellow-500" },
  ];

  if (loading) return <p className="p-6">Loading data...</p>;
  if (error) return <p className="p-6 text-red-600">Gagal memuat data: {error}</p>;
  if (!stats) return <p className="p-6 text-red-600">Tidak ada data yang tersedia.</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-indigo-700 mb-6">📊 Dashboard Penduduk</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="Dusun" value={dusunFilter} onChange={(e) => setDusunFilter(e.target.value)} />
          <input className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="Tahun (YYYY)" value={tahunFilter} onChange={(e) => setTahunFilter(e.target.value)} />
          <select className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={bulanFilter} onChange={(e) => setBulanFilter(e.target.value)}>
            <option value="">Semua Bulan</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString("id-ID", { month: "long" })}</option>
            ))}
          </select>
          <select className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={jenisKelaminFilter} onChange={(e) => setJenisKelaminFilter(e.target.value)}>
            <option value="">Semua JK</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          <select className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={statusKawinFilter} onChange={(e) => setStatusKawinFilter(e.target.value)}>
            <option value="">Semua Status Kawin</option>
            <option value="sudah">Sudah Kawin</option>
            <option value="belum">Belum Kawin</option>
            <option value="pernah">Pernah Kawin</option>
          </select>
          <input type="number" className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="Umur Min" value={umurMinFilter} onChange={(e) => setUmurMinFilter(e.target.value)} />
          <input type="number" className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="Umur Max" value={umurMaxFilter} onChange={(e) => setUmurMaxFilter(e.target.value)} />
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
          <Card title="📅 Penduduk per Bulan Masuk">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={perBulanData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" opacity={0.7} />
                <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={commonAxisTickStyle} />
                <YAxis axisLine={false} tickLine={false} tick={commonAxisTickStyle} />
                <Tooltip {...commonTooltipStyle} formatter={tooltipFormatter} />
                <Line
                  type="monotone"
                  dataKey="jml"
                  stroke={BUSINESS_COLORS[0]}
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
                          ? BUSINESS_COLORS[0]
                          : BUSINESS_COLORS[1]
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
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" opacity={0.7} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={commonAxisTickStyle}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis axisLine={false} tickLine={false} tick={commonAxisTickStyle} />
                <Tooltip {...commonTooltipStyle} formatter={tooltipFormatter} />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                >
                  {usiaData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BUSINESS_COLORS[index % BUSINESS_COLORS.length]}
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
                <Bar dataKey="value" fill={BUSINESS_COLORS[5]} radius={[4, 4, 0, 0]} barSize={24} />
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
                <Bar dataKey="value" fill={BUSINESS_COLORS[0]} radius={[4, 4, 0, 0]} barSize={24} />
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
                <Bar dataKey="value" fill={BUSINESS_COLORS[1]} radius={[4, 4, 0, 0]} barSize={24} />
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
                <Bar dataKey="value" fill={BUSINESS_COLORS[6]} radius={[4, 4, 0, 0]} barSize={24} />
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

      {/* Bagian bawah: per dusun */}
      <div className="mt-10">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Per Dusun</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {perDusunData.map(({ dusun, ...data }) => (
            <DusunCard key={dusun} dusun={dusun} data={data} />
          ))}
        </div>
      </div>
    </div>
  );
}
