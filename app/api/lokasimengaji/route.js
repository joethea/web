//import { supabase } from "@/lib/supabase";
import { supabaseServer as supabase } from "@/lib/supabaseServer";


function resolveField(kategori) {
  if (kategori === "luar") return "dayah_luar";
  if (kategori === "guru") return "lokasi_guru";
  return "nama_dayah"; // default lokal
}

// 🔹 GET: ambil semua lokasi berdasarkan kategori
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const kategori = url.searchParams.get("kategori") || "lokal";
    const field = resolveField(kategori);

    const { data, error } = await supabase
      .from("penduduk_sistem")
      .select(field)
      .neq(field, null)
      .not(field, "eq", "")
      .order(field, { ascending: true });

    if (error) throw new Error(error.message);

    const values = [...new Set((data || []).map(item => item[field]))];

    return new Response(JSON.stringify({ data: values }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

// 🔹 POST: tambah lokasi baru
export async function POST(req) {
  try {
    const { kategori, nama } = await req.json();
    if (!nama) {
      return new Response(JSON.stringify({ error: "Nama wajib diisi" }), { status: 400 });
    }
    const field = resolveField(kategori);

    const { error } = await supabase
      .from("tabel_lokasimengaji")
      .insert([{ [field]: nama }]);

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

// 🔹 PUT: edit lokasi
export async function PUT(req) {
  try {
    const { kategori, oldNama, newNama } = await req.json();
    if (!oldNama || !newNama) {
      return new Response(JSON.stringify({ error: "oldNama & newNama wajib" }), { status: 400 });
    }
    const field = resolveField(kategori);

    const { error } = await supabase
      .from("tabel_lokasimengaji")
      .update({ [field]: newNama })
      .eq(field, oldNama);

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

// 🔹 DELETE: hapus lokasi
export async function DELETE(req) {
  try {
    const { kategori, nama } = await req.json();
    if (!nama) {
      return new Response(JSON.stringify({ error: "nama wajib" }), { status: 400 });
    }
    const field = resolveField(kategori);

    const { error } = await supabase
      .from("tabel_lokasimengaji")
      .delete()
      .eq(field, nama);

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
