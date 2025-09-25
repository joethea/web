//import { supabase } from "@/lib/supabase";
import { supabaseServer as supabase } from "@/lib/supabaseServer";

// GET: ambil semua dusun unik
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("penduduk_sistem")
      .select("alamat_dusun")
      .neq("alamat_dusun", null)
      .not("alamat_dusun", "eq", "")
      .order("alamat_dusun", { ascending: true });

    if (error) throw new Error(error.message);

    const values = [...new Set(data.map(item => item.alamat_dusun))];

    return new Response(JSON.stringify({ data: values }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

// POST: tambah dusun baru
export async function POST(req) {
  try {
    const { nama } = await req.json();
    if (!nama) {
      return new Response(JSON.stringify({ error: "Nama dusun wajib diisi" }), { status: 400 });
    }

    const { error } = await supabase
      .from("penduduk_sistem")   // 🔹 buat tabel khusus lokasi dusun
      .insert([{ alamat_dusun: nama }]);

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

// PUT: edit dusun
export async function PUT(req) {
  try {
    const { oldNama, newNama } = await req.json();
    if (!oldNama || !newNama) {
      return new Response(JSON.stringify({ error: "oldNama & newNama wajib" }), { status: 400 });
    }

    const { error } = await supabase
      .from("penduduk_sistem")
      .update({ alamat_dusun: newNama })
      .eq("alamat_dusun", oldNama);

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

// DELETE: hapus dusun
export async function DELETE(req) {
  try {
    const { nama } = await req.json();
    if (!nama) {
      return new Response(JSON.stringify({ error: "nama wajib" }), { status: 400 });
    }

    const { error } = await supabase
      .from("penduduk_sistem")
      .delete()
      .eq("alamat_dusun", nama);

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}


