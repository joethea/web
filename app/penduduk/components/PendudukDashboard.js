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

const COLORS = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#0EA5E9",
];

// 📌 Helper untuk tooltip
const tooltipFormatter = (val) => [`${val} penduduk`, "Jumlah"];

// 📌 Card Wrapper
function Card({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="mb-3 text-gray-700 font-semibold">{title}</div>
      <div>{children}</div>
    </div>
  );
}

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
      .map(([k, v]) => ({ dusun: k, jml: v }))
      .sort((a, b) => b.jml - a.jml);
  }, [stats]);

  const perBulanData = useMemo(() => {
    if (!stats?.perBulan) return [];
    return Object.entries(stats.perBulan).map(([bulan, jml]) => ({
      bulan,
      jml,
    }));
  }, [stats]);

  const jenisKelaminData = [
    { name: "Laki-laki", value: stats?.jenisKelamin?.L || 0 },
    { name: "Perempuan", value: stats?.jenisKelamin?.P || 0 },
  ];

  const statusKawinData = [
    { label: "Belum Kawin", value: stats?.statusKawin?.belum || 0 },
    { label: "Sudah Kawin", value: stats?.statusKawin?.sudah || 0 },
    { label: "Pernah Kawin (Janda/Duda)", value: stats?.statusKawin?.pernah || 0 },
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
    return Object.entries(stats.ekonomi).map(([k, v]) => ({ label: k, value: v }));
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
    return Object.entries(stats.umurKategori).map(([k, v]) => ({
      label: k,
      value: v,
    }));
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

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-indigo-700 mb-6">📊 Dashboard Penduduk</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="p-2 border rounded" placeholder="Dusun" value={dusun} onChange={(e) => setDusun(e.target.value)} />
          <input className="p-2 border rounded" placeholder="Tahun (YYYY)" value={tahun} onChange={(e) => setTahun(e.target.value)} />
          <select className="p-2 border rounded" value={bulan} onChange={(e) => setBulan(e.target.value)}>
            <option value="">Semua Bulan</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString("id-ID", { month: "long" })}</option>
            ))}
          </select>
          <select className="p-2 border rounded" value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)}>
            <option value="">Semua JK</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          <select className="p-2 border rounded" value={statusKawin} onChange={(e) => setStatusKawin(e.target.value)}>
            <option value="">Semua Status Kawin</option>
            <option value="S">Sudah Kawin</option>
            <option value="B">Belum Kawin</option>
            <option value="P">Pernah Kawin</option>
          </select>
          <input type="number" className="p-2 border rounded" placeholder="Umur Min" value={umurMin} onChange={(e) => setUmurMin(e.target.value)} />
          <input type="number" className="p-2 border rounded" placeholder="Umur Max" value={umurMax} onChange={(e) => setUmurMax(e.target.value)} />
          <select className="p-2 border rounded" value={ekonomiFilter} onChange={(e) => setEkonomiFilter(e.target.value)}>
            <option value="">Semua Ekonomi</option>
            <option value="Sangat Miskin">Sangat Miskin</option>
            <option value="Miskin">Miskin</option>
            <option value="Kurang Mampu">Kurang Mampu</option>
            <option value="Mampu">Mampu</option>
            <option value="Kaya">Kaya</option>
            <option value="Sangat Kaya">Sangat Kaya</option>
          </select>
          <input className="p-2 border rounded col-span-2" placeholder="Bantuan Sosial" value={bantuanFilter} onChange={(e) => setBantuanFilter(e.target.value)} />
          <div className="flex gap-2 col-span-2">
            <button onClick={fetchStats} className="px-4 py-2 bg-indigo-600 text-white rounded">Terapkan</button>
            <button onClick={resetFilters} className="px-4 py-2 border rounded">Reset</button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {summaryCards.map((c, i) => (
          <div key={i} className={`${c.color} text-white p-4 rounded-lg shadow`}>
            <div className="text-sm">{c.title}</div>
            <div className="text-2xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded ${tab === t ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Content per Tab */}
      {tab === "Demografi" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="🏘️ Penduduk per Dusun">
            <ResponsiveContainer width="100%" height={300}>
            <BarChart data={perDusunData}>
              <CartesianGrid strokeDasharray="6 6" />
              <XAxis dataKey="dusun" angle={-25} textAnchor="end" interval={0} height={80} />
              <YAxis />
              <Tooltip formatter={tooltipFormatter} />
              <Bar dataKey="jml" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          </Card>
          <Card title="📅 Penduduk per Bulan Masuk">
            <ResponsiveContainer width="100%" height={300}>
          <LineChart data={perBulanData}>
            <CartesianGrid strokeDasharray="6 6" />
            <XAxis dataKey="bulan" />
            <YAxis />
            <Tooltip formatter={tooltipFormatter} />
            <Line type="monotone" dataKey="jml" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>

          </Card>
          <Card title="⚧️ Jenis Kelamin">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={jenisKelaminData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {jenisKelaminData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={tooltipFormatter} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="👶 Kategori Usia">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usiaData}>
                <CartesianGrid strokeDasharray="6 6" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {tab === "Ekonomi" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="💰 Status Ekonomi">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ekonomiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="value" fill="#F97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="💰 Persentase Ekonomi">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={ekonomiData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90} label>
                  {ekonomiData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={tooltipFormatter} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="💍 Status Kawin">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusKawinData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="value" fill="#FB923C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {tab === "Pendidikan & Pekerjaan" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="🎓 Tingkat Pendidikan">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pendidikanData}>
                <CartesianGrid strokeDasharray="2 2" />
                <XAxis dataKey="label" angle={-30} textAnchor="end" interval={0} height={80} />
                <YAxis />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title={`💼 Pekerjaan (Top ${topN} + Lainnya)`}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pekerjaanData}>
                <CartesianGrid strokeDasharray="1 1" />
                <XAxis dataKey="label" angle={-30} textAnchor="end" interval={0} height={80} />
                <YAxis />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {tab === "Bantuan" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title={`🎁 Bantuan Sosial (Top ${topN})`}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bantuanData}>
                <XAxis dataKey="label" angle={-30} textAnchor="end" interval={0} height={80} />
                <YAxis />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="value" fill="#14B8A6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="🧒 Status Yatim/Piatu">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={yatimData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90} label>
                  {yatimData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={tooltipFormatter} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}
