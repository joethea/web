import { NextResponse } from "next/server";
import { supabaseClient as supabase } from "@/lib/supabaseClient";

// Helper kategori usia
function kategoriUmur(tanggalLahir) {
  if (!tanggalLahir) return "Unknown";
  const dob = new Date(tanggalLahir);
  const usia = new Date().getFullYear() - dob.getFullYear();
  if (usia < 12) return "Anak-anak";
  if (usia < 18) return "Remaja";
  if (usia < 60) return "Dewasa";
  return "Lansia";
}

export async function GET() {
  try {
    const { data, error } = await supabase.from("penduduk").select("*");
    if (error) throw error;

    const stats = {
      total: data.length,
      perDusun: {},
      perBulan: {},
      jenisKelamin: { L: 0, P: 0 },
      statusKawin: { belum: 0, sudah: 0, pernah: 0 },
      ekonomi: {},
      umurKategori: { Anak: 0, Remaja: 0, Dewasa: 0, Lansia: 0 },
      produktif: { produktif: 0, non: 0 },
      yatim: { yatim: 0, piatu: 0, yatimpiatu: 0 },
      bantuan: {},
    };

    data.forEach((p) => {
      // Dusun
      stats.perDusun[p.alamat_dusun] = (stats.perDusun[p.alamat_dusun] || 0) + 1;

      // Bulan masuk
      if (p.inserted_at) {
        const d = new Date(p.inserted_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        stats.perBulan[key] = (stats.perBulan[key] || 0) + 1;
      }

      // Gender
      if (p.jenis_kelamin === "L") stats.jenisKelamin.L++;
      if (p.jenis_kelamin === "P") stats.jenisKelamin.P++;

      // Status kawin
      if (p.status === "B") stats.statusKawin.belum++;
      if (p.status === "S") stats.statusKawin.sudah++;
      if (p.status === "P") stats.statusKawin.pernah++;

      // Ekonomi
      if (p.miskin_sangat) {
        stats.ekonomi[p.miskin_sangat] = (stats.ekonomi[p.miskin_sangat] || 0) + 1;
      }

      // Usia kategori
      const cat = kategoriUmur(p.tanggal_lahir);
      if (cat === "Anak-anak") stats.umurKategori.Anak++;
      else if (cat === "Remaja") stats.umurKategori.Remaja++;
      else if (cat === "Dewasa") stats.umurKategori.Dewasa++;
      else if (cat === "Lansia") stats.umurKategori.Lansia++;

      // Produktif vs non (15–64)
      const dob = new Date(p.tanggal_lahir);
      const usia = new Date().getFullYear() - dob.getFullYear();
      if (usia >= 15 && usia <= 64) stats.produktif.produktif++;
      else stats.produktif.non++;

      // Yatim / piatu
      if (p.yatim_piatu === "Yatim") stats.yatim.yatim++;
      if (p.yatim_piatu === "Piatu") stats.yatim.piatu++;
      if (p.yatim_piatu === "Yatim Piatu") stats.yatim.yatimpiatu++;

      // Bantuan sosial
      if (p.bantuan_sosial) {
        const bs = p.bantuan_sosial.split(",").map((x) => x.trim());
        bs.forEach((b) => {
          stats.bantuan[b] = (stats.bantuan[b] || 0) + 1;
        });
      }
    });

    return NextResponse.json({ stats });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
