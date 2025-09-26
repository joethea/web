import { NextResponse } from "next/server";
import { supabaseClient as supabase } from "@/lib/supabaseClient";

// helper functions
const toStr = (v) =>
  v === null || v === undefined ? "" : String(v).trim();
const parseIntOr = (v, fallback = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const ensureArray = (v) => {
  if (v === undefined || v === null || v === "") return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string")
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [String(v)];
};

function kategoriUsiaFromYears(yrs) {
  if (isNaN(yrs)) return "Tidak diketahui";
  if (yrs < 5) return "Balita";
  if (yrs <= 14) return "Anak-anak";
  if (yrs <= 24) return "Remaja";
  if (yrs <= 59) return "Dewasa";
  return "Lansia";
}

function calcAgeYears(tanggalLahir) {
  if (!tanggalLahir) return NaN;
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
    const bulan = parseIntOr(qp.bulan, null);
    const jenis_kelamin = toStr(qp.jenis_kelamin || "");
    const status = toStr(qp.status || "");
    const umur_min = parseIntOr(qp.umur_min, null);
    const umur_max = parseIntOr(qp.umur_max, null);
    const miskin_sangat = toStr(qp.miskin_sangat || "");
    const bantuan_sosial = ensureArray(
      qp.bantuan_sosial || qp["bantuan_sosial[]"]
    );
    const limit = parseIntOr(qp.limit, 10000);

    // fetch from supabase
    const { data, error } = await supabase
      .from("penduduk")
      .select("*")
      .limit(limit);

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const rows = Array.isArray(data) ? data : [];

    // filter rows
    const filtered = rows.filter((p) => {
      if (
        alamat_dusun &&
        String((p.alamat_dusun || "")).toLowerCase() !==
          alamat_dusun.toLowerCase()
      ) {
        return false;
      }
      if (tahun || bulan) {
        if (!p.inserted_at) return false;
        const dt = new Date(p.inserted_at);
        if (isNaN(dt.getTime())) return false;
        if (tahun && dt.getFullYear() !== tahun) return false;
        if (bulan && dt.getMonth() + 1 !== bulan) return false;
      }
      if (
        jenis_kelamin &&
        String(p.jenis_kelamin || "").toUpperCase() !==
          jenis_kelamin.toUpperCase()
      ) {
        return false;
      }
      if (status) {
        const st = String(p.status || "").toUpperCase();
        const statusMap = {
          S: "S",
          "SUDAH KAWIN": "S",
          B: "B",
          "BELUM KAWIN": "B",
          P: "P",
          "PERNAH KAWIN": "P",
          JANDA: "P",
          DUDA: "P",
        };
        const wanted =
          statusMap[status.toUpperCase()] || status.toUpperCase();
        if (!st || st !== wanted) return false;
      }
      if (umur_min !== null || umur_max !== null) {
        const age = calcAgeYears(p.tanggal_lahir);
        if (!Number.isFinite(age)) return false;
        if (umur_min !== null && age < umur_min) return false;
        if (umur_max !== null && age > umur_max) return false;
      }
      if (
        miskin_sangat &&
        toStr(p.miskin_sangat).toLowerCase() !==
          miskin_sangat.toLowerCase()
      ) {
        return false;
      }
      if (bantuan_sosial && bantuan_sosial.length > 0) {
        let bs = [];
        if (Array.isArray(p.bantuan_sosial))
          bs = p.bantuan_sosial.map(String);
        else if (typeof p.bantuan_sosial === "string")
          bs = p.bantuan_sosial.split(",").map((s) => s.trim());
        else bs = [];
        const lowerBs = bs.map((x) => x.toLowerCase());
        const wantedLower = bantuan_sosial.map((x) =>
          String(x).toLowerCase()
        );
        const has = wantedLower.some((w) => lowerBs.includes(w));
        if (!has) return false;
      }
      return true;
    });

    // init stats
    const stats = {
      total: filtered.length,
      perDusun: {},
      detailPerDusun: {},
      perBulan: {},
      jenisKelamin: { L: 0, P: 0, "Tidak diketahui": 0 },
      statusKawin: { belum: 0, sudah: 0, pernah: 0, "Tidak diketahui": 0 },
      umurKategori: {
        Balita: 0,
        "Anak-anak": 0,
        Remaja: 0,
        Dewasa: 0,
        Lansia: 0,
        "Tidak diketahui": 0,
      },
      ekonomi: {},
      pendidikan: {},
      pekerjaan: {},
      produktif: { produktif: 0, non_produktif: 0 },
      yatim: { yatim: 0, piatu: 0, yatimpiatu: 0, none: 0 },
      bantuan: {},
    };

    for (const p of filtered) {
      const dusunKey = toStr(p.alamat_dusun) || "—";

      // init detail per dusun jika belum ada
      if (!stats.detailPerDusun[dusunKey]) {
        stats.detailPerDusun[dusunKey] = {
          total: 0,
          L: 0,
          P: 0,
          umurKategori: {
            Balita: { L: 0, P: 0 },
            "Anak-anak": { L: 0, P: 0 },
            Remaja: { L: 0, P: 0 },
            Dewasa: { L: 0, P: 0 },
            Lansia: { L: 0, P: 0 },
            "Tidak diketahui": { L: 0, P: 0 },
          },
          statusKawin: {
            sudah: { L: 0, P: 0 },
            belum: { L: 0, P: 0 },
            pernah: { L: 0, P: 0 },
            "Tidak diketahui": { L: 0, P: 0 },
          },
        };
      }
      const d = stats.detailPerDusun[dusunKey];

      // total per dusun
      d.total++;
      stats.perDusun[dusunKey] = (stats.perDusun[dusunKey] || 0) + 1;

      // gender
      const jk = (p.jenis_kelamin || "").toUpperCase();
      const gender = jk === "L" ? "L" : jk === "P" ? "P" : null;
      if (gender) {
        d[gender]++;
        stats.jenisKelamin[gender]++;
      } else {
        stats.jenisKelamin["Tidak diketahui"]++;
      }

      // kategori umur
      const age = calcAgeYears(p.tanggal_lahir);
      const cat = isNaN(age) ? "Tidak diketahui" : kategoriUsiaFromYears(age);
      if (gender && d.umurKategori[cat]) {
        d.umurKategori[cat][gender]++;
      }
      if (stats.umurKategori[cat] !== undefined) {
        stats.umurKategori[cat]++;
      }

      // status kawin
      const st = (p.status || "").toUpperCase();
      let stKey = "Tidak diketahui";
      if (st === "B") stKey = "belum";
      else if (st === "S") stKey = "sudah";
      else if (st === "P") stKey = "pernah";
      if (gender) {
        d.statusKawin[stKey][gender]++;
      }
      stats.statusKawin[stKey]++;

      // perBulan
      if (p.inserted_at) {
        const dtt = new Date(p.inserted_at);
        if (!isNaN(dtt.getTime())) {
          const key = `${dtt.getFullYear()}-${String(
            dtt.getMonth() + 1
          ).padStart(2, "0")}`;
          stats.perBulan[key] = (stats.perBulan[key] || 0) + 1;
        }
      }

      // ekonomi
      const eco = toStr(p.miskin_sangat) || "Tidak diketahui";
      stats.ekonomi[eco] = (stats.ekonomi[eco] || 0) + 1;

      // pendidikan
      const pend = toStr(p.pendidikan) || "Tidak diketahui";
      stats.pendidikan[pend] =
        (stats.pendidikan[pend] || 0) + 1;

      // pekerjaan
      const job = toStr(p.pekerjaan) || "Tidak diketahui";
      stats.pekerjaan[job] = (stats.pekerjaan[job] || 0) + 1;

      // produktif
      if (!isNaN(age) && age >= 15 && age <= 64)
        stats.produktif.produktif++;
      else stats.produktif.non_produktif++;

      // yatim/piatu
      const yp = toStr(p.yatim_piatu || "").toLowerCase();
      if (yp.includes("yatim piatu") || yp.includes("yatimpiatu"))
        stats.yatim.yatimpiatu++;
      else if (yp.includes("yatim")) stats.yatim.yatim++;
      else if (yp.includes("piatu")) stats.yatim.piatu++;
      else stats.yatim.none++;

      // bantuan sosial
      let bs = [];
      if (Array.isArray(p.bantuan_sosial))
        bs = p.bantuan_sosial.map(String);
      else if (
        typeof p.bantuan_sosial === "string" &&
        p.bantuan_sosial.trim() !== ""
      ) {
        bs = p.bantuan_sosial
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      bs.forEach((b) => {
        if (!b) return;
        stats.bantuan[b] = (stats.bantuan[b] || 0) + 1;
      });
    }

    // sort perBulan
    const perBulanSorted = Object.keys(stats.perBulan)
      .sort()
      .reduce((acc, k) => {
        acc[k] = stats.perBulan[k];
        return acc;
      }, {});

    return NextResponse.json({
      stats: { ...stats, perBulan: perBulanSorted },
      meta: {
        totalRowsFetched: rows.length,
        totalRowsAfterFilter: filtered.length,
        appliedFilters: {
          alamat_dusun,
          tahun,
          bulan,
          jenis_kelamin,
          status,
          umur_min,
          umur_max,
          miskin_sangat,
          bantuan_sosial,
        },
      },
    });
  } catch (err) {
    console.error("API stats error:", err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}
