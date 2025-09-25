import { supabase } from "@/lib/supabase";


// 🔹 GET: ambil data penduduk (filter + pagination + distinct)
export async function GET(req) {
  try {
    const url = new URL(req.url);

    // ✅ cek apakah request untuk distinct values
    const distinctField = url.searchParams.get("distinct");
    if (distinctField) {
      // 🔹 KHUSUS lokasi_mengaji → ambil dari tabel_lokasimengaji.nama_dayah
      if (distinctField === "lokasi_mengaji") {
      const kategori = url.searchParams.get("kategori") || "lokal";
      let field = "nama_dayah"; // default
      if (kategori === "luar") field = "dayah_luar";
      if (kategori === "guru") field = "lokasi_guru";

      const { data, error } = await supabase
        .from("penduduk_sistem")
        .select(field)
        .neq(field, null)
        .not(field, "eq", "")
        .order(field, { ascending: true });

      if (error) throw error;

      // mapping manual ke string array
      const distinctValues = [...new Set((data || []).map(item => item[field]))];

      return new Response(JSON.stringify({ data: distinctValues }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }





      // 🔹 default → ambil distinct dari tabel penduduk
      const { data, error } = await supabase
        .from("penduduk")
        .select(distinctField)
        .neq(distinctField, null)
        .not(distinctField, "eq", "")
        .order(distinctField, { ascending: true });

      if (error) throw error;

      const distinctValues = [...new Set(data.map(item => item[distinctField]))];
      return new Response(JSON.stringify({ data: distinctValues }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ✅ kalau bukan distinct → filter data biasa
    const search = url.searchParams.get("search") || "";
    const alamatDusun = url.searchParams.get("alamat_dusun") || "";
    const jenisKelamin = url.searchParams.get("jenis_kelamin") || "";
    const umurMin = parseInt(url.searchParams.get("umur_min") || "0", 10);
    const umurMax = parseInt(url.searchParams.get("umur_max") || "200", 10);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const kk = url.searchParams.get("kk") || "";
    const status = url.searchParams.get("status") || "";
    const pekerjaan = url.searchParams.get("pekerjaan") || "";
    const pendidikan = url.searchParams.get("pendidikan") || "";
    const hubungan_keluarga = url.searchParams.get("hubungan_keluarga") || "";
    const yatim_piatu = url.searchParams.get("yatim_piatu") || "";
    const miskin_sangat = url.searchParams.get("miskin_sangat") || "";
    const kategori_mengaji = url.searchParams.get("kategori_mengaji") || "";
    const lokasi_mengaji = url.searchParams.get("lokasi_mengaji") || "";

    // 🔹 Base query
    let baseQuery = supabase.from("penduduk").select("*", { count: "exact" });

    if (search) {
      baseQuery = baseQuery.or(`nik.ilike.%${search}%,nama.ilike.%${search}%`);
    }
    if (alamatDusun) baseQuery = baseQuery.ilike("alamat_dusun", `%${alamatDusun}%`);
    if (jenisKelamin) baseQuery = baseQuery.eq("jenis_kelamin", jenisKelamin);
    if (kk) baseQuery = baseQuery.eq("kk", String(kk).trim());
    if (status) baseQuery = baseQuery.eq("status", status);
    if (pekerjaan) baseQuery = baseQuery.eq("pekerjaan", pekerjaan);
    if (pendidikan) baseQuery = baseQuery.eq("pendidikan", pendidikan);
    if (hubungan_keluarga) baseQuery = baseQuery.eq("hubungan_keluarga", hubungan_keluarga);
    if (yatim_piatu) baseQuery = baseQuery.eq("yatim_piatu", yatim_piatu);
    if (miskin_sangat) baseQuery = baseQuery.eq("miskin_sangat", miskin_sangat);
    if (kategori_mengaji) baseQuery = baseQuery.eq("kategori_mengaji", kategori_mengaji);
    if (lokasi_mengaji) baseQuery = baseQuery.eq("lokasi_mengaji", lokasi_mengaji);

    // 🔹 Filter umur (konversi ke tanggal lahir)
    if (umurMin || umurMax) {
      const today = new Date();
      const minDate = new Date(today.getFullYear() - umurMax, today.getMonth(), today.getDate());
      const maxDate = new Date(today.getFullYear() - umurMin, today.getMonth(), today.getDate());

      baseQuery = baseQuery
        .gte("tanggal_lahir", minDate.toISOString().split("T")[0])
        .lte("tanggal_lahir", maxDate.toISOString().split("T")[0]);
    }

    // 🔹 Query dengan pagination + count
    const { data, count, error } = await baseQuery
      .range(offset, offset + limit - 1)
      .order("nama", { ascending: true });

    if (error) throw new Error(error.message);

    return new Response(
      JSON.stringify({ data: data || [], total: count || 0, page, limit }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}


// 🔹 POST: tambah data penduduk
// 🔹 POST: tambah data penduduk
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      nik, nama, tanggal_lahir, tempat_lahir,
      alamat_dusun, jenis_kelamin, pekerjaan, pendidikan,
      status, kk, desa, kode_desa,   // ✅ tambahkan kode_desa
      hubungan_keluarga, yatim_piatu, miskin_sangat,
      kategori_mengaji, lokasi_mengaji, status_rumah
    } = body;

    // 🔹 Validasi dasar
    if (!nik || !nama) {
      return new Response(JSON.stringify({ error: "NIK dan Nama wajib diisi" }), { status: 400 });
    }
    if (!/^\d{16}$/.test(String(nik))) {
      return new Response(JSON.stringify({ error: "NIK harus 16 digit angka" }), { status: 400 });
    }
    if (!kode_desa) {
      return new Response(JSON.stringify({ error: "Kode desa wajib ada" }), { status: 400 });
    }

    // 🔹 Insert ke Supabase
    const { error } = await supabase.from("penduduk").insert([{
      nik: String(nik),
      nama,
      kode_desa,
      tanggal_lahir: tanggal_lahir || null,
      tempat_lahir: tempat_lahir || null,
      alamat_dusun: alamat_dusun || null,
      jenis_kelamin: jenis_kelamin || null,
      pekerjaan, pendidikan, status, kk, desa,
      hubungan_keluarga, yatim_piatu, miskin_sangat,
      kategori_mengaji, lokasi_mengaji, status_rumah
    }]);

    if (error) {
      // 🔹 Mapping error Postgres agar lebih ramah
      if (error.message.includes("duplicate key value")) {
        return new Response(
          JSON.stringify({ error: "NIK sudah terdaftar, gunakan NIK lain." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error: " + e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}



// 🔹 PUT: update data penduduk
export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      nik, nama, tanggal_lahir, tempat_lahir,
      alamat_dusun, jenis_kelamin, pekerjaan, pendidikan,
      status, kk, desa,
      hubungan_keluarga, yatim_piatu, miskin_sangat,
      kategori_mengaji, lokasi_mengaji, status_rumah
    } = body;

    if (!nik) {
      return new Response(JSON.stringify({ error: "NIK wajib ada untuk update" }), { status: 400 });
    }

    const { error } = await supabase
      .from("penduduk")
      .update({
        nama,
        tanggal_lahir: tanggal_lahir || null,
        tempat_lahir: tempat_lahir || null,
        alamat_dusun: alamat_dusun || null,
        jenis_kelamin: jenis_kelamin || null,
        pekerjaan, pendidikan, status, kk, desa,
        hubungan_keluarga, yatim_piatu, miskin_sangat,
        kategori_mengaji, lokasi_mengaji, status_rumah
      })
      .eq("nik", String(nik));

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

// 🔹 DELETE: hapus data penduduk
export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    let nik = url.searchParams.get("nik");

    // 🔹 cek kalau dipanggil pakai path /api/penduduk/<nik>
    if (!nik) {
      const parts = url.pathname.split("/");
      nik = parts.pop() || parts.pop(); // ambil segment terakhir
    }

    if (!nik) {
      return new Response(JSON.stringify({ error: "nik required" }), { status: 400 });
    }

    const { error } = await supabase.from("penduduk").delete().eq("nik", String(nik));
    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

