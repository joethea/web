import { supabaseServer as supabase } from "@/lib/supabaseServer";

export async function DELETE() {
  try {
    // 🚨 Hapus semua data di tabel penduduk
    const { error } = await supabase.from("penduduk").delete().neq("nik", "");

    if (error) {
      console.error("❌ Error cleanup:", error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "✅ Semua data penduduk berhasil dihapus." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("❌ Unexpected cleanup error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
