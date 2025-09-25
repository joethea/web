// app/api/penduduk/options/route.js
import { supabaseServer as supabase } from "@/lib/supabaseServer";


export async function GET() {
  try {
    // ambil kolom masing-masing, lalu unique di server
    const cols = ["alamat_dusun", "status", "pekerjaan", "jenis_kelamin"];
    const result = {};

    for (const col of cols) {
      const { data, error } = await supabase.from("penduduk").select(col).not(col, "is", null);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      const list = Array.from(new Set((data || []).map(r => r[col]).filter(Boolean)));
      result[col] = list.sort();
    }

    return new Response(JSON.stringify({
      alamat_dusun: result["alamat_dusun"],
      status: result["status"],
      pekerjaan: result["pekerjaan"],
      jenis_kelamin: result["jenis_kelamin"]
    }), { headers: { "Content-Type": "application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
