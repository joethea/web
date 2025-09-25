import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabaseServer";

// 🔹 Fungsi helper untuk konversi tanggal dd/mm/yyyy → yyyy-mm-dd
function parseTanggal(tgl) {
  if (!tgl) return null;
  const parts = String(tgl).split("/");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map((p) => p.trim());
  if (!dd || !mm || !yyyy) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

// 🔹 Validasi kolom wajib
function cekValidasi(row) {
  const errors = [];

  if (!/^\d{16}$/.test(row.nik)) errors.push("NIK tidak valid");
  if (!/^\d{16}$/.test(row.kk)) errors.push("KK tidak valid");
  if (!row.nama || row.nama.trim().length < 2) errors.push("Nama kosong/tidak valid");
  if (!row.tanggal_lahir) errors.push("Tanggal lahir kosong/format salah");
  if (!["L", "P"].includes(row.jenis_kelamin)) errors.push("Jenis kelamin kosong/tidak valid");

  return errors;
}

// ✅ POST /api/penduduk/import/batch
export async function POST(req) {
  try {
    console.log("📥 [IMPORT] Request diterima...");

    const body = await req.json();
    const rows = body?.data;
    console.log("📊 [IMPORT] Total rows diterima:", rows?.length);

    if (!rows || !Array.isArray(rows)) {
      console.warn("⚠️ [IMPORT] Data batch tidak valid:", rows);
      return NextResponse.json(
        { error: "Data batch tidak valid" },
        { status: 400 }
      );
    }

    // 🔹 Normalisasi semua kolom
    const cleanRows = rows.map((r, idx) => ({
      kode_desa: r.kode_desa || r["Kode Desa"] || "2036",
      nik: String(r.nik || r.NIK || "").trim(),
      kk: String(r.kk || r.KK || "").trim(),
      nama: r.nama || r.Nama || "",
      tempat_lahir: r.tempat_lahir || r["Tempat Lahir"] || "",
      tanggal_lahir: parseTanggal(r.tanggal_lahir || r["Tanggal Lahir"]),
      jenis_kelamin: (() => {
        const jk = String(r.jenis_kelamin || r["Jenis Kelamin"] || "")
          .trim()
          .toUpperCase();
        if (["L", "P"].includes(jk)) return jk;
        if (jk.startsWith("LAKI")) return "L";
        if (jk.startsWith("PEREM")) return "P";
        return null;
      })(),
      pendidikan: r.pendidikan || r.Pendidikan || "",
      pekerjaan: r.pekerjaan || r.Pekerjaan || "",
      hubungan_keluarga: r.hubungan_keluarga || r["Hubungan Keluarga"] || "",
      alamat_dusun: r.alamat_dusun || r.Dusun || "",
      desa: r.desa || r.Desa || "",
      miskin_sangat: r.miskin_sangat || r["Kategori Ekonomi"] || "",
      bantuan_sosial: r.bantuan_sosial
        ? String(r.bantuan_sosial)
            .split(/\s*,\s*/)
            .map((v) => v.trim())
            .filter(Boolean)
        : [],
      req_delete:
        r.req_delete === true ||
        String(r.req_delete).toLowerCase() === "true"
          ? true
          : false,
      _rowIndex: idx + 1,
    }));

    // 🔹 Pisahkan valid & invalid dengan alasan
    const validRows = [];
    const invalidRows = [];

    for (const row of cleanRows) {
      const errors = cekValidasi(row);
      if (errors.length > 0) {
        invalidRows.push({ ...row, _error: errors });
      } else {
        validRows.push(row);
      }
    }

    console.log(
      `✅ [IMPORT] Valid rows: ${validRows.length}, Invalid rows: ${invalidRows.length}`
    );

    if (validRows.length === 0) {
      console.warn("❌ [IMPORT] Tidak ada data valid.");
      return NextResponse.json(
        {
          error: "Tidak ada data valid",
          invalid: invalidRows.map((r) => ({
            nik: r.nik,
            nama: r.nama,
            row: r._rowIndex,
            errors: r._error,
          })),
        },
        { status: 400 }
      );
    }

    // 🔹 Cek duplikat NIK di Supabase
    console.log("🔍 [IMPORT] Cek duplikat NIK di DB...");
    const { data: existing, error: errExisting } = await supabase
      .from("penduduk")
      .select("nik")
      .in(
        "nik",
        validRows.map((r) => r.nik)
      );

    if (errExisting) {
      console.error("❌ [IMPORT] Error cek existing:", errExisting.message);
      return NextResponse.json({ error: errExisting.message }, { status: 500 });
    }

    const existingNIKs = new Set(existing.map((e) => e.nik));
    const newRows = validRows.filter((r) => !existingNIKs.has(r.nik));
    console.log(
      `📌 [IMPORT] Existing: ${existingNIKs.size}, Akan insert baru: ${newRows.length}`
    );

    // 🔹 Hapus field debug sebelum insert
    const rowsToInsert = newRows.map(({ _rowIndex, _error, ...rest }) => rest);

    // 🔹 Insert data baru
    let insertedCount = 0;
    if (rowsToInsert.length > 0) {
      console.log("🚀 [IMPORT] Insert ke DB...");
      const { data, error } = await supabase
        .from("penduduk")
        .insert(rowsToInsert)
        .select();

      if (error) {
        console.error("❌ [IMPORT] Gagal insert:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      insertedCount = data.length;
      console.log(`✅ [IMPORT] Inserted: ${insertedCount}`);
    }

    // 🔹 Balikan hasil
    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      skipped: existingNIKs.size,
      invalid: invalidRows.map((r) => ({
        nik: r.nik,
        nama: r.nama,
        row: r._rowIndex,
        errors: r._error,
      })),
    });
  } catch (err) {
    console.error("❌ [IMPORT] Fatal error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
