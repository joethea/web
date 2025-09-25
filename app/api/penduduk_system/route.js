//import { supabase } from "@/lib/supabase";
import { supabaseServer as supabase } from "@/lib/supabaseServer";


export async function GET(req) {
  try {
    const url = new URL(req.url);
    const field = url.searchParams.get("field"); // contoh: field=dusun

    if (!field) {
      return new Response(JSON.stringify({ error: "field required" }), { status: 400 });
    }

    const { data, error } = await supabase
      .from("penduduk_sistem")
      .select(field)
      .neq(field, null)
      .not(field, "eq", "")
      .order(field, { ascending: true });

    if (error) throw error;

    const values = [...new Set(data.map(item => item[field]))];

    return new Response(JSON.stringify({ data: values }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}


export async function POST(req) {
  try {
    const body = await req.json();
    const { field, value } = body;

    if (!field || !value) {
      return new Response(JSON.stringify({ error: "field & value required" }), { status: 400 });
    }

    const { error } = await supabase.from("penduduk_sistem").insert([{ [field]: value }]);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}


export async function PUT(req) {
  try {
    const body = await req.json();
    const { field, oldValue, newValue } = body;

    if (!field || !oldValue || !newValue) {
      return new Response(JSON.stringify({ error: "field, oldValue, newValue required" }), { status: 400 });
    }

    const { error } = await supabase
      .from("penduduk_sistem")
      .update({ [field]: newValue })
      .eq(field, oldValue);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}


export async function DELETE(req) {
  try {
    const body = await req.json();
    const { field, value } = body;

    if (!field || !value) {
      return new Response(JSON.stringify({ error: "field & value required" }), { status: 400 });
    }

    const { error } = await supabase
      .from("penduduk_sistem")
      .delete()
      .eq(field, value);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
