import { NextResponse } from "next/server";
import XLSX from "xlsx";
import { supabaseServer as supabase } from "@/lib/supabaseServer";


// 🔹 inisialisasi Supabase pakai anon key (aman, cukup untuk SELECT)
//const supabase = createClient(
//  process.env.NEXT_PUBLIC_SUPABASE_URL,
//  process.env.NEXT_PUBLIC_SUPABASE_KEY
//);

export async function GET() {
  try {
    // 🔹 ambil semua kolom dari tabel penduduk
    const { data, error } = await supabase
      .from("penduduk")
      .select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 🔹 normalisasi data sebelum export
    const hasil = data.map(row => ({
      ...row,
      tanggal_lahir: row.tanggal_lahir
        ? new Date(row.tanggal_lahir).toLocaleDateString("id-ID")
        : "",
      bantuan_sosial: Array.isArray(row.bantuan_sosial)
        ? row.bantuan_sosial.join(", ")
        : (row.bantuan_sosial || "")
    }));

    // 🔹 generate Excel
    const worksheet = XLSX.utils.json_to_sheet(hasil);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Penduduk");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // 🔹 return file ke client
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="data_penduduk.xlsx"',
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal export: " + err.message },
      { status: 500 }
    );
  }
}
