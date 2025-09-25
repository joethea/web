import { supabaseServer as supabase } from "@/lib/supabaseServer";
import XLSX from "xlsx";

// 🔹 Konversi tanggal Excel ke ISO (yyyy-mm-dd) + validasi format dd/mm/yyyy
function parseDateToISO(dateStr) {
  if (!dateStr) return null;

  // Jika Excel number
  if (typeof dateStr === "number") {
    const jsDate = new Date((dateStr - 25569) * 86400 * 1000);
    return jsDate.toISOString().split("T")[0];
  }

  // Jika string dengan format dd/mm/yyyy
  const parts = String(dateStr).split("/");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    if (dd.length === 2 && mm.length === 2 && yyyy.length === 4) {
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  return null; // format salah
}

// 🔹 Handler GET → untuk test route dari browser
export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Gunakan POST untuk upload file Excel penduduk",
      endpoint: "/api/penduduk/import/xlsx-fast",
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// 🔹 Handler POST → untuk upload dan import data Excel
export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file) {
      return new Response(
        JSON.stringify({ error: "❌ File wajib diunggah" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Baca file Excel
    const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      return new Response(
        JSON.stringify({ error: "❌ File kosong atau format salah" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const toInsert = [];
    const invalid = [];
    const duplikat = [];

    // Ambil semua NIK dari Excel
    const nikList = rows
      .map((r) => String(r.nik || r["NIK"] || "").trim())
      .filter((nik) => !!nik);

    // Cek duplikat di DB
    const { data: existing, error: cekError } = await supabase
      .from("penduduk")
      .select("nik")
      .in("nik", nikList);

    if (cekError) {
      console.error("❌ Error cek duplikat:", cekError.message);
      return new Response(
        JSON.stringify({ error: cekError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const existingSet = new Set((existing || []).map((e) => e.nik));

    // Proses tiap baris
    // Proses tiap baris
for (const [i, r] of rows.entries()) {
  const kode_desa = String(r.kode_desa || "").trim();

  // 🚩 Normalisasi KK & NIK → buang semua non-digit
  let kk  = String(r.kk  || r["KK"]  || "").replace(/\D/g, "").trim();
  let nik = String(r.nik || r["NIK"] || "").replace(/\D/g, "").trim();
  let nama = String(r.nama || "").trim();
  const tempat_lahir = r.tempat_lahir || null;
  const tanggal_lahir = parseDateToISO(r.tanggal_lahir);

  // Data lain boleh kosong
  const status = r.status || null;
  const jenis_kelamin = r.jenis_kelamin || null;
  const pekerjaan = r.pekerjaan || null;
  const alamat_dusun = r.alamat_dusun || null;
  const desa = r.desa || null;
  const pendidikan = r.pendidikan || null;
  const hubungan_keluarga = r.hubungan_keluarga || null;
  const status_rumah = r.status_rumah || null;
  const yatim_piatu = r.yatim_piatu || null;
  const miskin_sangat = r.miskin_sangat || null;
  const kategori_mengaji = r.kategori_mengaji || null;
  const lokasi_mengaji = r.lokasi_mengaji || null;

  // ✅ bantuan_sosial jadi array
  let bantuan_sosial = r.bantuan_sosial || null;
  if (typeof bantuan_sosial === "string" && bantuan_sosial.trim() !== "") {
    bantuan_sosial = bantuan_sosial
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  // 🔒 Validasi
  if (!kode_desa) {
    invalid.push({ nik, nama, alasan: ["kode_desa kosong"] });
    continue;
  }

  if (!kk) {
    invalid.push({ nik, nama, alasan: ["KK kosong"] });
    continue;
  }
  if (!/^\d{16}$/.test(kk)) {
    invalid.push({ nik, nama, alasan: ["Format KK salah (harus 16 digit angka)"] });
    continue;
  }

  if (!nik || !nama) {
    invalid.push({ nik, nama, alasan: ["NIK/Nama kosong"] });
    continue;
  }
  if (!/^\d{16}$/.test(nik)) {
    invalid.push({ nik, nama, alasan: ["Format NIK salah (harus 16 digit angka)"] });
    continue;
  }

  if (!tanggal_lahir) {
    invalid.push({ nik, nama, alasan: ["Tanggal lahir kosong/format salah"] });
    continue;
  }

  if (existingSet.has(nik)) {
    duplikat.push({ nik, nama });
  }

  // ✅ Data valid → siapkan untuk insert
  toInsert.push({
    kode_desa,
    kk,
    nik,
    nama,
    tempat_lahir,
    tanggal_lahir,
    status,
    jenis_kelamin,
    pekerjaan,
    alamat_dusun,
    desa,
    pendidikan,
    hubungan_keluarga,
    status_rumah,
    yatim_piatu,
    miskin_sangat,
    kategori_mengaji,
    lokasi_mengaji,
    bantuan_sosial,
  });
}


    // ✅ Kalau tidak ada data valid → balas error
    if (toInsert.length === 0) {
      return new Response(
        JSON.stringify({
          error: "❌ Tidak ada data valid untuk diimport",
          invalid: invalid.length,
          duplikat: duplikat.length,
          invalid_rows: invalid,
          duplikat_rows: duplikat,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🚀 Upsert batch
    const BATCH_SIZE = 100;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from("penduduk")
        .upsert(batch, { onConflict: "nik" });

      if (insertError) {
        console.error("❌ Insert Error:", insertError.message);
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // ✅ Balas hasil akhir
    return new Response(
      JSON.stringify({
        success: true,
        inserted: toInsert.length,
        invalid: invalid.length,
        duplikat: duplikat.length,
        invalid_rows: invalid,
        duplikat_rows: duplikat,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("❌ Unexpected Error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Terjadi kesalahan server" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
