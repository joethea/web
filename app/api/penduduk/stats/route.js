// app/api/penduduk/stats/route.js
import { NextResponse } from "next/server";
import { supabaseClient as supabase } from "@/lib/supabaseClient";

/**
 * API stats:
 * - mendukung query params:
 *   alamat_dusun, tahun, bulan, jenis_kelamin, status, umur_min, umur_max,
 *   miskin_sangat, bantuan_sosial (comma separated or repeated), limit
 *
 * - mengambil data dari table 'penduduk' (limit default 10000)
 * - melakukan filtering di server (JS) lalu meng-aggregate
 */

// safe parse helpers
const toStr = (v) => (v === null || v === undefined ? "" : String(v));
const parseIntOr = (v, fallback = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const ensureArray = (v) => {
  if (v === undefined || v === null || v === "") return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [String(v)];
};

function kategoriUsiaFromYears(yrs) {
  if (isNaN(yrs)) return "Unknown";
  if (yrs < 5) return "Balita";
  if (yrs <= 14) return "Anak-anak";
  if (yrs <= 24) return "Remaja";
  if (yrs <= 59) return "Dewasa";
  return "Lansia";
}

function getYearsFromTanggal(tanggal) {
  if (!tanggal) return NaN;
  // Accept many formats: dd/mm/yyyy, yyyy-mm-dd, ISO
  if (typeof tanggal === "string" && tanggal.includes("/")) {
    const [d, m, y] = tanggal.split("/");
    return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`).getFullYear();
  }
  const d = new Date(tanggal);
  return isNaN(d.getTime()) ? NaN : d.getFullYear();
}

function calcAgeYears(tanggalLahir) {
  if (!tanggalLahir) return NaN;
  // accept dd/mm/yyyy or ISO
  let lahir = null;
  if (typeof tanggalLahir === "string" && tanggalLahir.includes("/")) {
    const [d, m, y] = tanggalLahir.split("/");
    lahir = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
  } else {
    lahir = new Date(tanggalLahir);
  }
  if (isNaN(lahir.getTime())) return NaN;
  const now = new Date();
  let age = now.getFullYear() - lahir.getFullYear();
  const mm = now.getMonth() - lahir.getMonth();
  const dd = now.getDate() - lahir.getDate();
  if (mm < 0 || (mm === 0 && dd < 0)) age--;
  return age;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const qp = Object.fromEntries(url.searchParams.entries());

    // Extract filter params
    const alamat_dusun = toStr(qp.alamat_dusun || "");
    const tahun = parseIntOr(qp.tahun, null);
    const bulan = parseIntOr(qp.bulan, null); // 1..12
    const jenis_kelamin = toStr(qp.jenis_kelamin || "");
    const status = toStr(qp.status || ""); // expect 'S','B','P' or human labels
    const umur_min = parseIntOr(qp.umur_min, null);
    const umur_max = parseIntOr(qp.umur_max, null);
    const miskin_sangat = toStr(qp.miskin_sangat || "");
    const bantuan_sosial = ensureArray(qp.bantuan_sosial || qp["bantuan_sosial[]"]);
    const limit = parseIntOr(qp.limit, 10000);

    // fetch limited dataset from supabase (we'll filter in JS)
    const { data, error } = await supabase
      .from("penduduk")
      .select("*")
      .limit(limit);

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const rows = Array.isArray(data) ? data : [];

    // filter rows based on query params (if provided)
    const filtered = rows.filter((p) => {
      // alamat_dusun
      if (alamat_dusun && String((p.alamat_dusun || "")).toLowerCase() !== alamat_dusun.toLowerCase()) {
        return false;
      }

      // tahun & bulan from inserted_at
      if (tahun || bulan) {
        if (!p.inserted_at) return false;
        const dt = new Date(p.inserted_at);
        if (isNaN(dt.getTime())) return false;
        if (tahun && dt.getFullYear() !== tahun) return false;
        if (bulan && dt.getMonth() + 1 !== bulan) return false;
      }

      // jenis kelamin
      if (jenis_kelamin && String(p.jenis_kelamin || "").toUpperCase() !== jenis_kelamin.toUpperCase()) {
        return false;
      }

      // status (S/B/P) - allow human labels as input
      if (status) {
        const st = String(p.status || "").toUpperCase();
        const statusMap = {
          "S": "S", "SUDAH KAWIN": "S",
          "B": "B", "BELUM KAWIN": "B",
          "P": "P", "PERNAH KAWIN": "P", "JANDA": "P", "DUDA": "P"
        };
        const wanted = statusMap[status.toUpperCase()] || status.toUpperCase();
        if (!st || st !== wanted) return false;
      }

      // usia range
      if ((umur_min !== null) || (umur_max !== null)) {
        const age = calcAgeYears(p.tanggal_lahir);
        if (!Number.isFinite(age)) return false;
        if (umur_min !== null && age < umur_min) return false;
        if (umur_max !== null && age > umur_max) return false;
      }

      // miskin_sangat
      if (miskin_sangat && toStr(p.miskin_sangat).toLowerCase() !== miskin_sangat.toLowerCase()) {
        return false;
      }

      // bantuan_sosial (any match)
      if (bantuan_sosial && bantuan_sosial.length > 0) {
        // support string, array, null
        let bs = [];
        if (Array.isArray(p.bantuan_sosial)) bs = p.bantuan_sosial.map(String);
        else if (typeof p.bantuan_sosial === "string") bs = p.bantuan_sosial.split(",").map(s => s.trim());
        else bs = [];

        const lowerBs = bs.map(x => x.toLowerCase());
        const wantedLower = bantuan_sosial.map(x => String(x).toLowerCase());
        // require that row has at least one wanted bantuan
        const has = wantedLower.some(w => lowerBs.includes(w));
        if (!has) return false;
      }

      return true;
    });

    // Now aggregate statistics
    const stats = {
      total: filtered.length,
      perDusun: {},
      perBulan: {}, // key 'YYYY-MM'
      jenisKelamin: { L: 0, P: 0, unknown: 0 },
      statusKawin: { belum: 0, sudah: 0, pernah: 0, unknown: 0 },
      ekonomi: {}, // miskin_sangat values
      umurKategori: { Balita: 0, "Anak-anak": 0, Remaja: 0, Dewasa: 0, Lansia: 0, Unknown: 0 },
      produktif: { produktif: 0, non_produktif: 0 },
      yatim: { yatim: 0, piatu: 0, yatimpiatu: 0, none: 0 },
      bantuan: {},
      pendidikan: {},
      pekerjaan: {},

    };

    for (const p of filtered) {
      // perDusun
      const dusunKey = toStr(p.alamat_dusun) || "—";
      stats.perDusun[dusunKey] = (stats.perDusun[dusunKey] || 0) + 1;

      // perBulan from inserted_at
      if (p.inserted_at) {
        const d = new Date(p.inserted_at);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          stats.perBulan[key] = (stats.perBulan[key] || 0) + 1;
        }
      }

      // jenis kelamin
      const jk = (p.jenis_kelamin || "").toUpperCase();
      if (jk === "L") stats.jenisKelamin.L++;
      else if (jk === "P") stats.jenisKelamin.P++;
      else stats.jenisKelamin.unknown++;

      // status kawin
      const st = (p.status || "").toUpperCase();
      if (st === "B") stats.statusKawin.belum++;
      else if (st === "S") stats.statusKawin.sudah++;
      else if (st === "P") stats.statusKawin.pernah++;
      else stats.statusKawin.unknown++;

      // ekonomi
      const eco = toStr(p.miskin_sangat) || "Unknown";
      stats.ekonomi[eco] = (stats.ekonomi[eco] || 0) + 1;

      // pendidikan
      const pend = toStr(p.pendidikan).trim() || "Tidak diketahui";
      stats.pendidikan[pend] = (stats.pendidikan[pend] || 0) + 1;

      // pekerjaan
      const job = toStr(p.pekerjaan).trim() || "Tidak diketahui";
      stats.pekerjaan[job] = (stats.pekerjaan[job] || 0) + 1;

      // usia kategori
      const age = calcAgeYears(p.tanggal_lahir);
      const cat = isNaN(age) ? "Unknown" : kategoriUsiaFromYears(age);
      stats.umurKategori[cat] = (stats.umurKategori[cat] || 0) + 1;

      // produktif vs non (15-64)
      if (!isNaN(age) && age >= 15 && age <= 64) stats.produktif.produktif++;
      else stats.produktif.non_produktif++;

      // yatim/piatu
      const yp = toStr(p.yatim_piatu || "").toLowerCase();
      if (yp.includes("yatim piatu") || yp.includes("yatimpiatu")) stats.yatim.yatimpiatu++;
      else if (yp.includes("yatim")) stats.yatim.yatim++;
      else if (yp.includes("piatu")) stats.yatim.piatu++;
      else stats.yatim.none++;

      // bantuan sosial (support string or array)
      let bs = [];
      if (Array.isArray(p.bantuan_sosial)) bs = p.bantuan_sosial.map(String);
      else if (typeof p.bantuan_sosial === "string" && p.bantuan_sosial.trim() !== "") {
        bs = p.bantuan_sosial.split(",").map(s => s.trim()).filter(Boolean);
      }
      bs.forEach((b) => {
        if (!b) return;
        stats.bantuan[b] = (stats.bantuan[b] || 0) + 1;
      });
    }

    // sort perBulan chronologically
    const perBulanSorted = Object.keys(stats.perBulan)
      .sort()
      .reduce((acc, k) => { acc[k] = stats.perBulan[k]; return acc; }, {});

    // return
    return NextResponse.json({
      stats: {
        ...stats,
        perBulan: perBulanSorted
      },
      meta: {
        totalRowsFetched: rows.length,
        totalRowsAfterFilter: filtered.length,
        appliedFilters: {
          alamat_dusun, tahun, bulan, jenis_kelamin, status, umur_min, umur_max, miskin_sangat, bantuan_sosial
        }
      }
    });
  } catch (err) {
    console.error("API stats error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
