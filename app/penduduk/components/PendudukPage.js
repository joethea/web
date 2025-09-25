"use client";

import { supabaseClient as supabase } from "@/lib/supabaseClient";

//const supabase = createClient(
//  process.env.NEXT_PUBLIC_SUPABASE_URL,
 // process.env.NEXT_PUBLIC_SUPABASE_KEY
//);


import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
//import Pikaday from "pikaday"; // Import Pikaday
import { Plus, Filter, Download, FileDown, Trash2, FileUp } from "lucide-react";
import ExcelJS from "exceljs";
import { importExcelFile } from "@/utils/importExcelFile";






export default function PendudukPage() {
  const [penduduk, setPenduduk] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [allData, setAllData] = useState([]); // Untuk menyimpan semua data tanpa filter
  const [filteredData, setFilteredData] = useState([]); // Untuk menyimpan data yang sedang difilter
  const [selectedNik, setSelectedNik] = useState(null);
  const [bantuanSosial, setBantuanSosial] = useState([]);
  // Daftar opsi bantuan (dari DB)
  const [opsiBantuan, setOpsiBantuan] = useState([]);

  


  // filter state
// State filter aktif (dipakai untuk query API) 
const [cariNama, setCariNama] = useState("");
const [filterKK, setFilterKK] = useState("");
const [filterDusun, setFilterDusun] = useState("");
const [filterStatus, setFilterStatus] = useState("");
const [filterPekerjaan, setFilterPekerjaan] = useState("");
const [filterPendidikan, setFilterPendidikan] = useState("");
const [filterJK, setFilterJK] = useState("");
const [umurMin, setUmurMin] = useState("");
const [umurMax, setUmurMax] = useState("");
const [filterYatim, setFilterYatim] = useState("");
const [filterEkonomi, setFilterEkonomi] = useState("");
const [filterKategoriMengaji, setFilterKategoriMengaji] = useState("");
const [filterLokasiMengaji, setFilterLokasiMengaji] = useState("");
const [lokasiMengajiList, setLokasiMengajiList] = useState([]);
const [filterUsia, setFilterUsia] = useState("");
const [filterBantuan, setFilterBantuan] = useState([]);   // array, default kosong
const [draftFilterBantuan, setDraftFilterBantuan] = useState([]); // untuk modal/filter sementara






// State filter draft (sementara, input user sebelum klik Terapkan)
const [draftCariNama, setDraftCariNama] = useState("");
const [draftFilterKK, setDraftFilterKK] = useState("");
const [draftFilterDusun, setDraftFilterDusun] = useState("");
const [draftFilterStatus, setDraftFilterStatus] = useState("");
const [draftFilterPekerjaan, setDraftFilterPekerjaan] = useState("");
const [draftFilterPendidikan, setDraftFilterPendidikan] = useState("");
const [draftFilterJK, setDraftFilterJK] = useState("");
const [draftUmurMin, setDraftUmurMin] = useState("");
const [draftUmurMax, setDraftUmurMax] = useState("");
const [jumlahTotal, setJumlahTotal] = useState(0);
const [draftFilterHubunganKeluarga, setDraftFilterHubunganKeluarga] = useState("");
const [filterHubunganKeluarga, setFilterHubunganKeluarga] = useState("");
const [draftFilterYatim, setDraftFilterYatim] = useState("");
const [draftFilterEkonomi, setDraftFilterEkonomi] = useState("");
const [draftFilterKategoriMengaji, setDraftFilterKategoriMengaji] = useState("");
const [draftFilterLokasiMengaji, setDraftFilterLokasiMengaji] = useState("");
const [draftFilterUsia, setDraftFilterUsia] = useState("");
//const [draftFilterBantuan, setDraftFilterBantuan] = useState("");


// Untuk popup filter (tampil / sembunyi)
const [isFilterGroupVisible, setIsFilterGroupVisible] = useState(false);
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
const [jumlahHantu, setJumlahHantu] = useState(0);
const [importLoading, setImportLoading] = useState(false);
const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
const importInProgress = useRef(false);  // Gunakan useRef untuk melacak proses import
const fileInputRef = useRef(null);

const hapusSemuaData = async () => {
  try {
    const konfirmasi = await Swal.fire({
      title: "⚠️ Hapus Semua Data?",
      text: "Tindakan ini akan menghapus seluruh data penduduk. Lanjutkan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus semua!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d33",
    });
    if (!konfirmasi.isConfirmed) return;

    const res = await fetch("/api/penduduk/cleanup", { method: "DELETE" });
    const hasil = await res.json();

    if (!res.ok) {
      Swal.fire("❌ Gagal Hapus", hasil.error || "Terjadi kesalahan", "error");
      return;
    }

    // Reset state agar tabel langsung kosong di UI
    setPenduduk([]);
    setFilteredData([]);
    setAllData([]);
    setJumlahFilter(0);
    setTotalPage(1);

    // Notifikasi sukses singkat
    Swal.fire({
      title: "✅ Berhasil",
      text: "Semua data penduduk telah dihapus dan tabel telah direset.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });

    // Opsional: kalau mau pastikan sinkron dari server, panggil ulang
    // await ambilDataPenduduk(1);
  } catch (err) {
    console.error("❌ Error hapus semua:", err);
    Swal.fire("❌ Error", err.message, "error");
  }
};


const handleFileChange = (file) => {
    if (file && !importInProgress.current) {
      importInProgress.current = true;
      importExcelFile(file, ambilDataPenduduk, setImportLoading)
        .finally(() => {
          importInProgress.current = false;
        });
    } else {
      Swal.fire("⚠️ Proses import sudah berjalan", "Tunggu hingga selesai", "warning");
    }
  };

  const openFileInputPopup = () => {
    Swal.fire({
      title: "Pilih File Excel",
      input: "file",
      inputAttributes: {
        accept: ".xlsx,.xls",
      },
      showCancelButton: true,
      cancelButtonText: "Batal",
      confirmButtonText: "Import",
      preConfirm: (file) => {
        if (file) {
          handleFileChange(file);
        } else {
          Swal.showValidationMessage("Harap pilih file Excel");
        }
      },
    });
  };



// 🚀 Init Pikaday hanya di client
useEffect(() => {
  (async () => {
    const Pikaday = (await import("pikaday")).default;
    await import("pikaday/css/pikaday.css");

    new Pikaday({
      field: document.getElementById("tanggalInput"),
      format: "YYYY-MM-DD",
    });
  })();
}, []);

useEffect(() => {
  const onError = (e) => alert("Error: " + e.message);
  const onRejection = (e) => alert("Promise error: " + e.reason);

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}, []);

// 🔹 Helper untuk menentukan warna badge status ekonomi
const warnaBadge = (miskinSangat) => {
  const v = (miskinSangat || "").toString().trim().toLowerCase();
  if (v === "sangat miskin") return "bg-[#E53935] text-white";
  if (v === "miskin") return "bg-[#ff6600] text-white";
  if (v === "kurang mampu") return "bg-[#ffc800] text-white";
  if (v === "mampu") return "bg-[#43A047] text-white";
  if (v === "kaya") return "bg-[#00B4D8] text-white";
  if (v === "sangat kaya") return "bg-[#9e4ecc] text-white";
  return "bg-slate-300 text-gray-900"; // default
};



const BadgeEkonomi = ({ status }) => {
  if (!status) return null;

  let warna = "bg-gray-400 text-white"; // default

  if (status === "Sangat Miskin") warna = "bg-rose-700 text-white";
  else if (status === "Miskin") warna = "bg-orange-600 text-white";
  else if (status === "Kurang Mampu") warna = "bg-amber-400 text-gray-900";
  else if (status === "Mampu") warna = "bg-lime-400 text-gray-900";
  else if (status === "Kaya") warna = "bg-emerald-600 text-white";
  else if (status === "Sangat Kaya") warna = "bg-indigo-600 text-white";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xl font-semibold ${warna}`}
    >
      {status}
    </span>
  );
};



// 🔹 Helper untuk mengisi dropdown pendidikan
function populatePendidikanSelect(selectId, selectedValue = "") {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  sel.innerHTML = "";

  // placeholder
  const placeholderOpt = document.createElement("option");
  placeholderOpt.value = "";
  placeholderOpt.textContent = "Pendidikan";
  placeholderOpt.style.color = "#9CA3AF"; // gray-400 (pudar)
  sel.appendChild(placeholderOpt);

  // daftar pendidikan tetap
  const pendidikanList = [
    "Tidak/Blm Sekolah",
    "Blm Tmt SD/Sederajat",
    "SD/Sederajat",
    "SLTP/Sederajat",
    "SLTA/Sederajat",
    "Diploma I/II",
    "Diploma III",
    "Diploma IV/Strata 1",
    "Strata II",
    "Strata III"
  ];

  // isi opsi normal
  pendidikanList.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    opt.style.color = "#1f2937"; // gray-800
    if (selectedValue && String(selectedValue) === String(p)) opt.selected = true;
    sel.appendChild(opt);
  });

  // set warna awal select (pudar kalau kosong)
  sel.style.color = sel.value ? "#1f2937" : "#9CA3AF";

  // ubah warna saat user memilih
  sel.addEventListener("change", (e) => {
    sel.style.color = e.target.value ? "#1f2937" : "#9CA3AF";
  });
}




// 🔹 Helper untuk menentukan kategori keluarga
const getKategoriKeluarga = (anggotaKeluarga) => {
  if (!anggotaKeluarga || anggotaKeluarga.length === 0) return "";
  const kepala = anggotaKeluarga.find(
    (a) => a.hubungan_keluarga === "Kepala Keluarga"
  );
  return kepala?.miskin_sangat || "";
};

const warnaHeaderKeluarga = (anggotaKeluarga) => {
  if (!anggotaKeluarga || anggotaKeluarga.length === 0) return "bg-gray-400";

  const kepala = anggotaKeluarga.find(a => a.hubungan_keluarga === "Kepala Keluarga");
  if (!kepala) return "bg-gray-400";

  return warnaBadge(kepala.miskin_sangat);
};


// 🔹 Komponen InfoFilter (tetap sama)
function InfoFilter({ jumlah, mode }) {
  if (jumlah === null) return null;

  const isi =
    mode === "filter"
      ? (
          <>Ditemukan <strong className="text-blue-600 font-semibold">{jumlah}</strong> Penduduk</>
        )
      : (
          <>Total <strong className="text-blue-600 font-semibold">{jumlah}</strong> Penduduk</>
        );

  return (
    <div id="filterStatusWrapper" className="flex items-center gap-2 text-gray-700">
      <span className="inline-block animate-checkmark">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none" opacity="0.2" />
          <path
            id="checkmark-path"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12l2.5 2.5L16 9"
            fill="none"
          />
        </svg>
      </span>
      <span id="filterText" className="transition-opacity duration-700 opacity-100">
        {isi}
      </span>
    </div>
  );
}

// 🔹 Komponen MultiSelectBantuan_Sosial
function MultiSelectBantuan({ options, selected, onChange }) {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef(null);

  const toggleOption = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter((x) => x !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  // 🔹 Tutup jika klik di luar
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border p-2 rounded bg-white text-left flex justify-between items-center"
      >
        <span>
          {selected.length > 0 ? selected.join(", ") : "Pilih Bantuan Sosial"}
        </span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-1150 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggleOption(opt)}
                className="mr-2"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}



//----------

const ambilOpsiBantuan = async () => {
  try {
    const res = await fetch("/api/penduduk?distinct=bantuan_sosial");
    const hasil = await res.json();
    if (res.ok) {
      setOpsiBantuan(hasil.data || []);
    }
  } catch (err) {
    console.error("❌ Gagal ambil opsi bantuan:", err);
  }
};

useEffect(() => {
  ambilOpsiBantuan();
}, []);

//---

// Hitung jumlah daftar hantu (req_delete)
const hitungHantu = async () => {
  try {
    const { data, error } = await supabase
      .from("penduduk")
      .select("id, req_delete");

    if (error) throw error;

    const count = data.filter((p) => {
      const val = (p.req_delete ?? "")
        .toString()
        .toLowerCase()
        .trim();
      return (
        val === "true" ||
        val === "1" ||
        val === "y" ||
        val === "yes" ||
        val === "t"
      );
    }).length;

    setJumlahHantu(count);
  } catch (err) {
    console.error("❌ Gagal hitung hantu:", err.message);
    setJumlahHantu(0);
  }
};

useEffect(() => {
  hitungHantu();

  // pastikan tidak ada channel lama yang nyangkut
  supabase.removeAllChannels();

  const channel = supabase
    .channel("hantu-listener")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "penduduk" },
      () => {
        console.log("📡 Deteksi perubahan di penduduk, update jumlah hantu…");
        hitungHantu();
      }
    )
    .subscribe();

  return () => {
    console.log("🧹 Cleanup hantu-listener");
    supabase.removeChannel(channel);
  };
}, []);




// Handler untuk lihat daftar hantu
const lihatDaftarHantu = async () => {
  try {
    const { data, error } = await supabase
      .from("penduduk")
      .select("id, nik, nama, alamat_dusun, req_delete");

    if (error) throw error;

    const daftarHantu = data.filter((p) => {
      const val = (p.req_delete ?? "")
        .toString()
        .toLowerCase()
        .trim();
      return ["true", "1", "y", "yes", "t"].includes(val);
    });

    //if (daftarHantu.length === 0) {
    //  Swal.fire("✅ Aman", "Tidak ada daftar hantu saat ini.", "success");
    //  return;
    //}

    // Buat HTML tabel
    const tableHTML = `
  <table style="width:100%; border-collapse:collapse; font-size:14px;">
    <thead>
      <tr style="background:#f3f4f6; text-align:center;">
        <th style="padding:8px; border:1px solid #ddd;">NIK</th>
        <th style="padding:8px; border:1px solid #ddd;">Nama</th>
        <th style="padding:8px; border:1px solid #ddd;">Dusun</th>
        <th style="padding:8px; border:1px solid #ddd;">Tindakan</th>
      </tr>
    </thead>
    <tbody>
      ${
        daftarHantu.length > 0
          ? daftarHantu.map((p) => `
              <tr>
                <td style="padding:6px; border:1px solid #ddd;">${p.nik}</td>
                <td style="padding:6px; border:1px solid #ddd;">${p.nama}</td>
                <td style="padding:6px; border:1px solid #ddd;">${p.alamat_dusun || "-"}</td>
                <td style="padding:6px; border:1px solid #ddd; text-align:center;">
                  <button onclick="window.hapusHantu('${p.id}')" style="padding:4px 8px; background:#525252; color:white; border:none; border-radius:4px; cursor:pointer; margin-right:4px;">
                    Lepas
                  </button>
                  <button onclick="window.hapusData('${p.id}')" style="padding:4px 8px; background:#ef4444; color:white; border:none; border-radius:4px; cursor:pointer;">
                    Hapus
                  </button>
                </td>
              </tr>
            `).join("")
          : `<tr><td colspan="4" style="text-align:center; padding:12px;">✅ Tidak ada daftar hantu</td></tr>`
      }
    </tbody>
  </table>
  <div style="margin-top:12px; text-align:right;">
    <div class="mt-3 text-right" style="justify-content: flex-end; display: flex;">
  <button 
    onclick="window.tambahHantu()" 
    class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 
           text-white text-sm font-medium shadow-md hover:shadow-lg 
           flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
  >
    <svg xmlns="http://www.w3.org/2000/svg" 
         fill="none" viewBox="0 0 24 24" 
         stroke-width="2" stroke="currentColor" 
         class="w-4 h-4">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
    </svg>
    Tambah Hantu Baru
  </button>
</div>

  </div>
`;


    Swal.fire({
      title: "👻 Daftar Hitam (Hantu)",
      html: tableHTML,
      width: 700,
      showConfirmButton: false,
    });

    // Lepas status hantu
    window.hapusHantu = async (id) => {
      try {
        await supabase.from("penduduk").update({ req_delete: null }).eq("id", id);
        Swal.fire("Terlepas", "Data berhasil dilepas dari daftar hantu", "success").then(() =>
          lihatDaftarHantu()
        );
      } catch (err) {
        Swal.fire("❌ Error", err.message, "error");
      }
    };

    // ❌ Hapus Data Permanen
    window.hapusData = async (id) => {
      const konfirmasi = await Swal.fire({
        title: "⚠️ Hapus Permanen?",
        text: "Data ini akan dihapus permanen dari database. Tindakan ini tidak bisa dibatalkan!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, Hapus",
        cancelButtonText: "Batal",
        confirmButtonColor: "#ef4444"
      });

      if (!konfirmasi.isConfirmed) return;

      try {
        await supabase.from("penduduk").delete().eq("id", id);
        Swal.fire("✅ Terhapus", "Data berhasil dihapus permanen", "success").then(() =>
          lihatDaftarHantu()
        );
      } catch (err) {
        Swal.fire("❌ Error", err.message, "error");
      }
    };

    // Tambah Hantu
     // Tambah Hantu
    window.tambahHantu = async () => {
      const { value: namaCari } = await Swal.fire({
        title: "Cari Penduduk",
        input: "text",
        inputLabel: "Masukkan Nama",
        inputPlaceholder: "juanda",
        showCancelButton: true,
        confirmButtonText: "Cari",
        confirmButtonColor: "#10b981",
        inputValidator: (value) => {
          if (!value || value.trim() === "") {
            return "❌ Isi nama dulu sebelum mencari";
          }
          return null;
        },
      });

      if (!namaCari) return;

      try {
        const { data, error } = await supabase
          .from("penduduk")
          .select("id, nik, nama, alamat_dusun")
          .ilike("nama", `%${namaCari}%`);

        if (error) throw error;

        if (!data || data.length === 0) {
          Swal.fire("❌ Tidak Ditemukan", "Penduduk tidak ditemukan", "warning");
          return;
        }

        const hasilHTML = `
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <thead>
              <tr style="background:#f3f4f6; text-align:center;">
                <th style="padding:8px; border:1px solid #ddd;">NIK</th>
                <th style="padding:8px; border:1px solid #ddd;">Nama</th>
                <th style="padding:8px; border:1px solid #ddd;">Dusun</th>
                <th style="padding:8px; border:1px solid #ddd;">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (p) => `
                <tr>
                  <td style="padding:6px; border:1px solid #ddd;">${p.nik}</td>
                  <td style="padding:6px; border:1px solid #ddd;">${p.nama}</td>
                  <td style="padding:6px; border:1px solid #ddd;">${p.alamat_dusun || "-"}</td>
                  <td style="padding:6px; border:1px solid #ddd; text-align:center;">
                    <button onclick="window.tandaiHantu('${p.id}')" style="padding:4px 8px; background:#10b981; color:white; border:none; border-radius:4px; cursor:pointer;">
                      Tambahkan
                    </button>
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `;

        Swal.fire({
          title: "Hasil Pencarian",
          html: hasilHTML,
          width: 700,
          showConfirmButton: false,
        });

        window.tandaiHantu = async (id) => {
          try {
            await supabase.from("penduduk").update({ req_delete: "true" }).eq("id", id);
    Swal.fire("✅ Ditambahkan", "Penduduk berhasil ditandai sebagai hantu", "success").then(() => {
      hitungHantu();        // 🔹 update notif langsung
      lihatDaftarHantu();   // 🔹 refresh daftar popup
    });
          } catch (err) {
            Swal.fire("❌ Error", err.message, "error");
          }
        };
      } catch (err) {
        Swal.fire("❌ Error", err.message, "error");
      }
    };
  } catch (err) {
    console.error("❌ Gagal ambil daftar hantu:", err.message);
    Swal.fire("Error", "Gagal ambil daftar hantu", "error");
  }
};


//----------


// Handler export -------------------
const toggleExportMenu = () => {
  setIsExportMenuOpen((prev) => !prev);
};
  // ✅ fungsi fetch lokasi berdasarkan kategori
const ambilLokasiMengaji = useCallback(async (kategori) => {
  if (!kategori) {
    setLokasiMengajiList([]);
    return;
  }

  let kategoriParam = "";
  if (kategori === "Ngaji Lokal") kategoriParam = "lokal";
  else if (kategori === "Ngaji Luar") kategoriParam = "luar";
  else if (kategori === "Guru Ngaji") kategoriParam = "guru";

  try {
    const res = await fetch(
      `/api/penduduk?distinct=lokasi_mengaji&kategori=${kategoriParam}`
    );
    const hasil = await res.json();
    setLokasiMengajiList(hasil.data || []);
  } catch (err) {
    console.error("❌ Gagal ambil lokasi mengaji:", err);
    setLokasiMengajiList([]);
  }
}, []);




// Apply filter sekali klik
// Terapkan semua filter
const applyFilters = () => {
  // simpan draft ke state utama
  setCariNama(draftCariNama);
  setFilterKK(draftFilterKK);
  setFilterDusun(draftFilterDusun);
  setFilterStatus(draftFilterStatus);
  setFilterPekerjaan(draftFilterPekerjaan);
  setFilterPendidikan(draftFilterPendidikan);
  setFilterJK(draftFilterJK);
  setUmurMin(draftUmurMin);
  setUmurMax(draftUmurMax);
  setFilterHubunganKeluarga(draftFilterHubunganKeluarga);
  setFilterYatim(draftFilterYatim);
  setFilterEkonomi(draftFilterEkonomi);
  setFilterKategoriMengaji(draftFilterKategoriMengaji);
  setFilterLokasiMengaji(draftFilterLokasiMengaji);
  setFilterUsia(draftFilterUsia);
  setFilterBantuan(draftFilterBantuan);
  


  // panggil ambilDataPenduduk dengan urutan parameter yang benar
  ambilDataPenduduk(
    1,                   // page
    false,               // modeEkspor
    draftCariNama,       // search
    draftFilterKK,       // kk
    draftFilterDusun,    // alamat_dusun
    draftFilterStatus,   // status
    draftFilterPekerjaan,// pekerjaan
    draftFilterPendidikan,// pendidikan
    draftFilterJK,       // jenis_kelamin
    draftFilterHubunganKeluarga, // hubungan_keluarga
    draftUmurMin,        // umur_min
    draftUmurMax,        // umur_max
    true,                 // showNotif
    draftFilterYatim,
    draftFilterEkonomi,
    draftFilterKategoriMengaji,
    draftFilterLokasiMengaji,
    draftFilterUsia,
    draftFilterBantuan
  );

  // tutup panel filter setelah diterapkan
  setIsFilterGroupVisible(false);
};


const resetSemuaFilter = () => {
  // kosongkan state utama
  setCariNama('');
  setFilterKK('');
  setFilterDusun('');
  setFilterStatus('');
  setFilterPekerjaan('');
  setFilterPendidikan('');
  setFilterJK('');
  setFilterHubunganKeluarga('');
  setUmurMin('');
  setUmurMax('');
  setFilterYatim('');
  setFilterEkonomi('');
  setFilterKategoriMengaji('');
  setFilterLokasiMengaji('');
  setFilterUsia('');
  setFilterBantuan(''); // ✅ pastikan bantuan sosial direset

  // kosongkan draft filter
  setDraftCariNama('');
  setDraftFilterKK('');
  setDraftFilterDusun('');
  setDraftFilterStatus('');
  setDraftFilterPekerjaan('');
  setDraftFilterPendidikan('');
  setDraftFilterJK('');
  setDraftFilterHubunganKeluarga('');
  setDraftUmurMin('');
  setDraftUmurMax('');
  setDraftFilterYatim('');
  setDraftFilterEkonomi('');
  setDraftFilterKategoriMengaji('');
  setDraftFilterLokasiMengaji('');
  setDraftFilterUsia('');
  setDraftFilterBantuan(''); // ✅ draft bantuan juga

  // reload data tanpa filter
  ambilDataPenduduk(1);
};

const adaFilterAktif = useMemo(() => {
  return Boolean(
    cariNama ||
    filterKK ||
    filterDusun ||
    filterStatus ||
    filterPekerjaan ||
    filterPendidikan ||
    filterJK ||
    filterHubunganKeluarga ||
    umurMin ||
    umurMax ||
    filterYatim ||
    filterEkonomi ||
    filterKategoriMengaji ||
    filterLokasiMengaji ||
    filterUsia ||
    (Array.isArray(filterBantuan) && filterBantuan.length > 0) // ✅ khusus bantuan
  );
}, [
  cariNama, filterKK, filterDusun, filterStatus,
  filterPekerjaan, filterPendidikan, filterJK, filterHubunganKeluarga,
  umurMin, umurMax, filterYatim, filterEkonomi, filterKategoriMengaji,
  filterLokasiMengaji, filterUsia, filterBantuan // ✅ dependensi tambahan
]);




// Tutup popup filter saat klik di luar area
useEffect(() => {
  const handleClickOutside = (e) => {
    const filterEl = document.getElementById("filterGroup");
    const filterBtn = document.getElementById("filterToggleBtn");
    if (
      filterEl &&
      !filterEl.contains(e.target) &&
      filterBtn &&
      !filterBtn.contains(e.target)
    ) {
      setIsFilterGroupVisible(false);
    }
  };
  if (isFilterGroupVisible) {
    document.addEventListener("mousedown", handleClickOutside);
  } else {
    document.removeEventListener("mousedown", handleClickOutside);
  }
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [isFilterGroupVisible]);


  // untuk info jumlah
  const [jumlahFilter, setJumlahFilter] = useState(null);
  const [modeInfo, setModeInfo] = useState("total"); // Default ke 'total' saat pertama load

  // State untuk detail keluarga
  const [selectedKK, setSelectedKK] = useState('');
  const [anggotaKeluarga, setAnggotaKeluarga] = useState([]);
  const [detailAnggota, setDetailAnggota] = useState(null);

  // Fungsi utilitas dari index.html
  const formatTanggalIndo = (tanggal) => {
    if (!tanggal) return '';
    const date = new Date(tanggal);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const normalisasiUniversal = (str) => {
    if (!str) return '';
    let hasil = str
      .toLowerCase()
      .trim()
      .replace(/\s*\/\s*/g, '/')
      .replace(/\s*-\s*/g, '-')
      .replace(/\s{2,}/g, ' ')
      .replace(/[^\w\s\/\-]/g, '')
      .replace(/\b\w/g, huruf => huruf.toUpperCase());

    const khususUppercase = {
      'Tni': 'TNI',
      'Pns': 'PNS',
      'Polri': 'POLRI',
      'P3k': 'P3K',
      'Pppk': 'PPPK'
    };
    if (khususUppercase[hasil]) {
      return khususUppercase[hasil];
    }
    return hasil;
  };
//======






//----------


  // ambil data dari API
const ambilDataPenduduk = useCallback(async (
  page = 1,
  modeEkspor = false,
  cariNamaOverride = cariNama,
  filterKKOverride = filterKK,
  filterDusunOverride = filterDusun,
  filterStatusOverride = filterStatus,
  filterPekerjaanOverride = filterPekerjaan,
  filterPendidikanOverride = filterPendidikan,
  filterJKOverride = filterJK,
  filterHubunganKeluargaOverride = filterHubunganKeluarga,
  umurMinOverride = umurMin,
  umurMaxOverride = umurMax,
  showNotif = false,
  filterYatimOverride = filterYatim,
  filterEkonomiOverride = filterEkonomi,
  filterKategoriMengajiOverride = filterKategoriMengaji,
  filterLokasiMengajiOverride = filterLokasiMengaji,
  filterUsiaOverride = filterUsia,
  filterBantuanOverride = filterBantuan
  
) => {
  setLoading(true);
  setCurrentPage(page);

  let statusParam = '';
  if (filterStatusOverride === 'Sudah Kawin') statusParam = 'S';
  else if (filterStatusOverride === 'Belum Kawin') statusParam = 'B';
  else if (filterStatusOverride === 'Pernah Kawin') statusParam = 'P';

  // default pakai umur dari state
  let umurMinFinal = umurMinOverride;
  let umurMaxFinal = umurMaxOverride;
  let manualFilterNonProduktif = false;

  if (filterUsiaOverride) {
    switch (String(filterUsiaOverride).toLowerCase()) {
      case "anak":
        umurMinFinal = 0; umurMaxFinal = 14; break;
      case "remaja":
        umurMinFinal = 15; umurMaxFinal = 24; break;
      case "dewasa":
        umurMinFinal = 25; umurMaxFinal = 59; break;
      case "lansia":
        umurMinFinal = 60; umurMaxFinal = 200; break;
      case "produktif":
        umurMinFinal = 15; umurMaxFinal = 64; break;
      case "non-produktif":
        umurMinFinal = ""; umurMaxFinal = "";
        manualFilterNonProduktif = true;
        break;
    }
  }

  const params = new URLSearchParams({
    search: cariNamaOverride,
    alamat_dusun: filterDusunOverride,
    jenis_kelamin: filterJKOverride,
    umur_min: umurMinFinal,
    umur_max: umurMaxFinal,
    kk: filterKKOverride,
    status: statusParam,
    pekerjaan: filterPekerjaanOverride,
    pendidikan: filterPendidikanOverride,
    hubungan_keluarga: filterHubunganKeluargaOverride,
    yatim_piatu: filterYatimOverride,
    miskin_sangat: filterEkonomiOverride,
    kategori_mengaji: filterKategoriMengajiOverride,
    lokasi_mengaji: filterLokasiMengajiOverride,
    bantuan_sosial: filterBantuanOverride,
    limit: modeEkspor ? 10000 : 20,
    page: modeEkspor ? 1 : page,
  });

if (Array.isArray(filterBantuanOverride) && filterBantuanOverride.length > 0) {
  params.append("bantuan_sosial", filterBantuanOverride.join(","));
}

  try {
    const res = await fetch(`/api/penduduk?${params.toString()}`);
    const hasil = await res.json();

    // filter manual non-produktif
    if (manualFilterNonProduktif && Array.isArray(hasil.data)) {
      hasil.data = hasil.data.filter(p => {
        const usia = getAgeYears(p.tanggal_lahir);
        return usia < 15 || usia > 64;
      });
      hasil.total = hasil.data.length;
    }

    if (!hasil || !Array.isArray(hasil.data)) {
      console.error("❌ Respon tidak sesuai:", hasil);
      Swal.fire("Gagal", hasil.error || "Data tidak ditemukan", "error");
      setPenduduk([]);
      setJumlahFilter(0);
      setTotalPage(1);
      return [];
    }

    if (modeEkspor) {
      return hasil.data;
    }

    setPenduduk(hasil.data);
    setTotalPage(Math.ceil(hasil.total / 20));
    setJumlahFilter(hasil.total);
    setModeInfo("filter");
    setFilteredData(hasil.data);

    if (showNotif) {
      Swal.fire({
        title: 'Filter Diterapkan',
        text: `${hasil?.total || 0} penduduk`,
        icon: 'info',
        showConfirmButton: false,
        timer: 1200
      });
    }

    return hasil;
  } catch (err) {
    console.error("❌ Gagal ambil data:", err);
    Swal.fire("Error", err.message, "error");
    return [];
  } finally {
    setLoading(false);
  }
}, [
  cariNama, filterDusun, filterJK, umurMin, umurMax, filterKK,
  filterStatus, filterPekerjaan, filterPendidikan, filterHubunganKeluarga,
  filterYatim, filterEkonomi, filterKategoriMengaji, filterLokasiMengaji, filterUsia, 
 filterBantuan
]);



  // Ambil semua data untuk dropdown filter dan statistik mini
  const ambilSemuaData = useCallback(async () => {
  try {
    const res = await fetch('/api/penduduk?limit=10000');
    const hasil = await res.json();
    if (!hasil || !Array.isArray(hasil.data)) return;
    setAllData(hasil.data);
    setJumlahTotal(hasil.data.length);  // 🔹 simpan ke jumlahTotal
    return hasil.data;
  } catch (err) {
    console.error("❌ Gagal ambil data awal:", err);
    return [];
  }
}, []);


// Isi dropdown filter secara otomatis
const isiDropdownsOtomatis = useCallback(async () => {
  const data = await ambilSemuaData();

  const pekerjaanUnik = [...new Set(data.map(p => p.pekerjaan).filter(Boolean))];
  const pendidikanUnik = [...new Set(data.map(p => p.pendidikan).filter(Boolean))];
  const statusKeluargaUnik = [...new Set(data.map(p => p.status_keluarga).filter(Boolean))]; // 🔹 baru
  const statusYatimUnik = [...new Set(data.map(p => p.status_yatim).filter(Boolean))];       // 🔹 baru
  const kategoriMiskinUnik = [...new Set(data.map(p => p.kategori_miskin).filter(Boolean))]; // 🔹 baru
  
  

  const pSelect = document.getElementById('filterPekerjaan');
  const dSelect = document.getElementById('filterDusun');
  const pendSelect = document.getElementById("filterPendidikan");
  const skSelect = document.getElementById('filterStatusKeluarga'); // 🔹 baru
  const sySelect = document.getElementById('filterStatusYatim');    // 🔹 baru
  const kmSelect = document.getElementById('filterKategoriMiskin'); // 🔹 baru
  const hkSelect = document.getElementById("filterHubunganKeluarga");

  // 🔹 Pekerjaan
  if (pSelect) {
    pSelect.innerHTML = '<option value="">Pekerjaan</option>';
    pekerjaanUnik.forEach(pekerjaan => {
      const opt = document.createElement('option');
      opt.value = pekerjaan;
      opt.textContent = pekerjaan;
      pSelect.appendChild(opt);
    });
  }

// ================== DUSUN ==================
  if (dSelect) {
  try {
    const resDusun = await fetch("/api/lokasidusun");
    const hasilDusun = await resDusun.json();
    const dusunList = hasilDusun.data || [];

    // kosongkan dulu
    dSelect.innerHTML = "";

    // 🔹 placeholder option dengan warna pudar
    const placeholderOpt = document.createElement("option");
    placeholderOpt.value = "";
    placeholderOpt.textContent = "Alamat Dusun";
    placeholderOpt.style.color = "#9CA3AF"; // Tailwind gray-400
    dSelect.appendChild(placeholderOpt);

    // 🔹 isi opsi dusun dengan warna normal
    dusunList.forEach(dusun => {
      const opt = document.createElement("option");
      opt.value = dusun;
      opt.textContent = dusun;
      opt.style.color = "#1f2937"; // Tailwind gray-800
      dSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("❌ Gagal ambil data dusun filter:", err);
    dSelect.innerHTML = '<option value="">Gagal load dusun</option>';
  }
}

// ================== STATUS ==================
const sSelect = document.getElementById("filterStatus");
if (sSelect) {
  try {
    const statusList = ["Sudah Kawin", "Belum Kawin", "Pernah Kawin"];

    sSelect.innerHTML = "";

    const placeholderOpt = document.createElement("option");
    placeholderOpt.value = "";
    placeholderOpt.textContent = "Status Perkawinan";
    placeholderOpt.style.color = "#9CA3AF";
    sSelect.appendChild(placeholderOpt);

    statusList.forEach(st => {
      const opt = document.createElement("option");
      opt.value = st;
      opt.textContent = st;
      opt.style.color = "#1f2937";
      sSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("❌ Gagal isi dropdown status:", err);
    sSelect.innerHTML = '<option value="">Gagal load status</option>';
  }
}

// ================== GENDER ==================
const jkSelect = document.getElementById("filterJK");
if (jkSelect) {
  jkSelect.innerHTML = "";

  const placeholderOpt = document.createElement("option");
  placeholderOpt.value = "";
  placeholderOpt.textContent = "Jenis Kelamin";
  placeholderOpt.style.color = "#9CA3AF";
  jkSelect.appendChild(placeholderOpt);

  const genderOptions = [
    { value: "L", label: "Laki-laki" },
    { value: "P", label: "Perempuan" },
  ];

  genderOptions.forEach(({ value, label }) => {
    const opt = document.createElement("option");
    opt.value = value;      // 🔹 simpan kode ("L"/"P")
    opt.textContent = label; // 🔹 tampilkan label
    opt.style.color = "#1f2937";
    jkSelect.appendChild(opt);
  });
}


// ================== PEKERJAAN ==================
const kerjaSelect = document.getElementById("filterPekerjaan");
if (kerjaSelect) {
  try {
    kerjaSelect.innerHTML = "";

    // placeholder pudar
    const placeholderOpt = document.createElement("option");
    placeholderOpt.value = "";
    placeholderOpt.textContent = "Pekerjaan";
    placeholderOpt.style.color = "#9CA3AF"; // tailwind gray-400
    kerjaSelect.appendChild(placeholderOpt);

    // gunakan pekerjaanUnik jika ada (dibuat sebelumnya), kalau tidak gunakan fallback statis
    const pekerjaanList = typeof pekerjaanUnik !== "undefined" && Array.isArray(pekerjaanUnik) && pekerjaanUnik.length
      ? pekerjaanUnik
      : ["Petani", "Pedagang", "Guru", "PNS", "Pelajar/Mahasiswa"];

    pekerjaanList.forEach(job => {
      const opt = document.createElement("option");
      opt.value = job;
      opt.textContent = job;
      opt.style.color = "#1f2937"; // tailwind gray-800
      kerjaSelect.appendChild(opt);
    });

    // set warna awal select berdasarkan value saat ini (draftFilterPekerjaan tersedia di closure)
    kerjaSelect.style.color = (typeof draftFilterPekerjaan !== "undefined" && draftFilterPekerjaan) ? "#1f2937" : "#9CA3AF";

    // pastikan warna berubah ketika user memilih item
    kerjaSelect.addEventListener("change", (e) => {
      kerjaSelect.style.color = e.target.value ? "#1f2937" : "#9CA3AF";
    });
  } catch (err) {
    console.error("❌ Gagal isi dropdown pekerjaan:", err);
    kerjaSelect.innerHTML = '<option value="">Gagal load pekerjaan</option>';
  }
}


 // 🔹 Pendidikan (manual UX, pakai list tetap)
if (pendSelect) {
  populatePendidikanSelect("filterPendidikan");
}

// 🔹 Isi dropdown Bantuan Sosial dari API distinct
const bantuanSelect = document.getElementById("filterBantuan");
if (bantuanSelect) {
  bantuanSelect.innerHTML = "";

  const placeholderOpt = document.createElement("option");
  placeholderOpt.value = "";
  placeholderOpt.textContent = "Bantuan Sosial";
  placeholderOpt.style.color = "#9CA3AF";
  bantuanSelect.appendChild(placeholderOpt);

  try {
    const res = await fetch("/api/penduduk?distinct=bantuan_sosial");
    const hasil = await res.json();

    if (hasil?.data && Array.isArray(hasil.data)) {
      hasil.data.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item;
        opt.textContent = item;
        opt.style.color = "#1f2937";
        bantuanSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("❌ Gagal ambil daftar bantuan sosial:", err);
  }

  bantuanSelect.style.color = bantuanSelect.value ? "#1f2937" : "#9CA3AF";
  bantuanSelect.addEventListener("change", (e) => {
    bantuanSelect.style.color = e.target.value ? "#1f2937" : "#9CA3AF";
  });
}


  // 🔹 Status Keluarga
  if (skSelect) {
    skSelect.innerHTML = '<option value="">Status Keluarga</option>';
    statusKeluargaUnik.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      skSelect.appendChild(opt);
    });
  }

 if (hkSelect) {
  hkSelect.innerHTML = "";

  // placeholder
  const placeholderOpt = document.createElement("option");
  placeholderOpt.value = "";
  placeholderOpt.textContent = "Hubungan Keluarga";
  placeholderOpt.style.color = "#9CA3AF"; // abu-abu pudar
  hkSelect.appendChild(placeholderOpt);

  const hubunganList = [
    "Kepala Keluarga",
    "Isteri",
    "Anak",
    "Cucu",
    "Orang Tua",
    "Menantu",
    "Famili",
    "Pembantu",
    "Saudara"
  ];

  hubunganList.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    opt.style.color = "#1f2937"; // hitam normal
    hkSelect.appendChild(opt);
  });

  // set warna awal (pudar kalau kosong)
  hkSelect.style.color = hkSelect.value ? "#1f2937" : "#9CA3AF";

  // update warna saat user pilih
  hkSelect.addEventListener("change", (e) => {
    hkSelect.style.color = e.target.value ? "#1f2937" : "#9CA3AF";
  });
}


  // 🔹 Status Yatim
// ================== STATUS YATIM ==================
const ySelect = document.getElementById("filterYatim");
if (ySelect) {
  try {
    const yatimList = ["Yatim", "Piatu", "Yatim Piatu"];
    ySelect.innerHTML = "";

    // placeholder pudar
    const placeholderOpt = document.createElement("option");
    placeholderOpt.value = "";
    placeholderOpt.textContent = "Status Ekonomi";
    placeholderOpt.style.color = "#9CA3AF"; // tailwind gray-400
    ySelect.appendChild(placeholderOpt);

    // opsi normal
    yatimList.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      opt.style.color = "#1f2937"; // tailwind gray-800
      ySelect.appendChild(opt);
    });

    // atur warna select saat tertutup (pudar kalau kosong)
    ySelect.style.color = ySelect.value ? "#1f2937" : "#9CA3AF";

    // update warna saat user memilih
    ySelect.addEventListener("change", (e) => {
      ySelect.style.color = e.target.value ? "#1f2937" : "#9CA3AF";
    });
  } catch (err) {
    console.error("❌ Gagal isi dropdown status yatim:", err);
    ySelect.innerHTML = '<option value="">Gagal load status yatim</option>';
  }
}


  // 🔹 Kategori Miskin
 // ================== KATEGORI EKONOMI ==================
const eSelect = document.getElementById("filterEkonomi");
if (eSelect) {
  try {
    const ekonomiList = [
      "Sangat Miskin",
      "Miskin",
      "Kurang Mampu",
      "Mampu",
      "Kaya",
      "Sangat Kaya"
    ];
    eSelect.innerHTML = "";

    // placeholder pudar
    const placeholderOpt = document.createElement("option");
    placeholderOpt.value = "";
    placeholderOpt.textContent = "Kategori Ekonomi";
    placeholderOpt.style.color = "#9CA3AF"; // abu-abu
    eSelect.appendChild(placeholderOpt);

    // opsi normal
    ekonomiList.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      opt.style.color = "#1f2937"; // hitam normal
      eSelect.appendChild(opt);
    });

    // warna awal
    eSelect.style.color = eSelect.value ? "#1f2937" : "#9CA3AF";

    // ubah warna ketika dipilih
    eSelect.addEventListener("change", (e) => {
      eSelect.style.color = e.target.value ? "#1f2937" : "#9CA3AF";
    });
  } catch (err) {
    console.error("❌ Gagal isi dropdown kategori ekonomi:", err);
    eSelect.innerHTML = '<option value="">Gagal load kategori ekonomi</option>';
  }
}
}, [ambilSemuaData]);

// ================== KATEGORI MENGAJI ==================
const kmSelect = document.getElementById("filterKategoriMengaji");
if (kmSelect) {
  try {
    const kategoriList = ["Ngaji Lokal", "Ngaji Luar", "Guru Ngaji"];
    kmSelect.innerHTML = "";

    // placeholder abu-abu
    const placeholderOpt = document.createElement("option");
    placeholderOpt.value = "";
    placeholderOpt.textContent = "Kategori Mengaji";
    placeholderOpt.style.color = "#9CA3AF";
    kmSelect.appendChild(placeholderOpt);

    // opsi normal
    kategoriList.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      opt.style.color = "#1f2937"; // hitam normal
      kmSelect.appendChild(opt);
    });

    // 🔹 set warna awal
    kmSelect.style.color = kmSelect.value ? "#1f2937" : "#9CA3AF";

    // 🔹 update warna saat user memilih
    kmSelect.addEventListener("change", (e) => {
      if (e.target.value === "") {
        kmSelect.style.color = "#9CA3AF"; // pudar kalau kosong
      } else {
        kmSelect.style.color = "#1f2937"; // hitam normal kalau ada pilihan
      }
    });
  } catch (err) {
    console.error("❌ Gagal isi dropdown kategori mengaji:", err);
    kmSelect.innerHTML = '<option value="">Gagal load kategori mengaji</option>';
  }
}


// ================== LOKASI MENGAJI ==================
const lmSelect = document.getElementById("filterLokasiMengaji");
if (lmSelect) {
  lmSelect.innerHTML = "";

  const placeholderOpt = document.createElement("option");
  placeholderOpt.value = "";
  placeholderOpt.textContent = "Lokasi Mengaji";
  placeholderOpt.style.color = "#9CA3AF";
  lmSelect.appendChild(placeholderOpt);

  // Lokasi mengaji diisi dinamis via API fetch yang sudah Anda buat
  // Jadi cukup biarkan placeholder di sini, data akan diisi di useEffect
}



  // Fungsi untuk menampilkan anggota keluarga di kolom 3
// Fungsi untuk menampilkan anggota keluarga di kolom 3
const tampilkanAnggotaKeluarga = useCallback(
  async (kk, nikTerpilih) => {
    if (!kk) {
      setAnggotaKeluarga([]);
      return [];
    }

    try {
      const res = await fetch(`/api/penduduk?kk=${encodeURIComponent(kk)}&limit=1000`);
      const hasil = await res.json();

      const data = Array.isArray(hasil)
        ? hasil
        : Array.isArray(hasil?.data)
        ? hasil.data
        : [];

      if (!data || data.length === 0) {
        setAnggotaKeluarga([]);
        setDetailAnggota(null);
        return [];
      }

      // 🔹 pisahkan kepala keluarga dan anggota lain
      const kepala = data.find(a => a.hubungan_keluarga === "Kepala Keluarga");
      const nonKepala = data.filter(a => a.hubungan_keluarga !== "Kepala Keluarga");

      // 🔹 urutkan anggota non-kepala dari tertua → termuda
      const sortedNonKepala = [...nonKepala].sort((a, b) => {
      const umurA = getAgeYears(a?.tanggal_lahir);
      const umurB = getAgeYears(b?.tanggal_lahir);
      if (umurB === umurA) {
        return (a?.nama || "").localeCompare(b?.nama || "", "id");
      }
      return umurB - umurA; // tertua dulu
    });


      // 🔹 gabungkan: kepala (jika ada) selalu di atas
      const sortedKeluarga = kepala ? [kepala, ...sortedNonKepala] : sortedNonKepala;

      setAnggotaKeluarga(sortedKeluarga);
      setSelectedKK(kk);

      // 🔹 restore anggota terpilih kalau ada
      if (nikTerpilih) {
        const anggotaTerpilih = sortedKeluarga.find(
          (a) => String(a?.nik) === String(nikTerpilih)
        );
        if (anggotaTerpilih) {
          setDetailAnggota(anggotaTerpilih);
        }
      } else if (detailAnggota) {
        const masihAda = sortedKeluarga.find(
          (a) => String(a.nik) === String(detailAnggota.nik)
        );
        if (masihAda) {
          setDetailAnggota(masihAda);
        } else {
          setDetailAnggota(null);
        }
      }

      return sortedKeluarga;
    } catch (err) {
      console.error("❌ Gagal ambil keluarga:", err);
      setAnggotaKeluarga([]);
      return [];
    }
  },
  [detailAnggota, getAgeYears]
);






  // Fungsi untuk menampilkan detail anggota keluarga yang dipilih dari daftar anggota
  const pilihKeluarga = useCallback((anggota) => {
    setDetailAnggota(anggota);
  }, []);

const handleEdit = useCallback((data) => {
  Swal.fire({
    title: `Edit Data: ${data.nama}`,
    html: `
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left border border-gray-200">
          <tbody class="divide-y divide-gray-100">
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600 w-40">Kode Desa</th>
              <td><input id="kode_desa" class="w-full p-2 border rounded bg-gray-100 cursor-not-allowed" value="${data.kode_desa}" readonly /></td>
            </tr>
            <tr><th class="bg-gray-50 px-4 py-2 text-gray-600">No. KK</th><td><input id="kk" class="w-full p-2 border rounded" value="${data.kk}" /></td></tr>
            <tr><th class="bg-gray-50 px-4 py-2 text-gray-600">NIK</th><td><input id="nik" class="w-full p-2 border rounded" value="${data.nik}" /></td></tr>
            <tr><th class="bg-gray-50 px-4 py-2 text-gray-600">Nama</th><td><input id="nama" class="w-full p-2 border rounded" value="${data.nama}" /></td></tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Tempat / Tgl Lahir</th>
              <td>
                <div class="flex gap-2">
                  <input id="tempat_lahir" class="w-1/2 p-2 border rounded" value="${data.tempat_lahir}" />
                  <input id="tanggal_lahir" type="text" class="w-1/2 p-2 border rounded" value="${formatTanggalIndo(data.tanggal_lahir)}" />
                </div>
              </td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Jenis Kelamin</th>
              <td>
                <select id="jenis_kelamin" class="w-full p-2 border rounded">
                  <option value="">--Pilih Jenis Kelamin--</option>
                  <option value="L" ${data.jenis_kelamin === 'L' ? 'selected' : ''}>Laki-laki</option>
                  <option value="P" ${data.jenis_kelamin === 'P' ? 'selected' : ''}>Perempuan</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Status</th>
              <td>
                <select id="status" class="w-full p-2 border rounded">
                  <option value="">--Pilih Status Pernikahan--</option>
                  <option value="S" ${data.status === 'S' ? 'selected' : ''}>Sudah Kawin</option>
                  <option value="B" ${data.status === 'B' ? 'selected' : ''}>Belum Kawin</option>
                  <option value="P" ${data.status === 'P' ? 'selected' : ''}>Pernah Kawin</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Pekerjaan</th>
              <td>
                <select id="pekerjaan" class="w-full p-2 border rounded">
                  <option value="">--Pilih Pekerjaan--</option>
                  <option value="Belum/Tidak Bekerja" ${data.pekerjaan === 'Belum/Tidak Bekerja' ? 'selected' : ''}>Belum/Tidak Bekerja</option>
                  <option value="Bidan" ${data.pekerjaan === 'Bidan' ? 'selected' : ''}>Bidan</option>
                  <option value="Buruh Harian Lepas" ${data.pekerjaan === 'Buruh Harian Lepas' ? 'selected' : ''}>Buruh Harian Lepas</option>
                  <option value="Buruh Tani/Perkebunan" ${data.pekerjaan === 'Buruh Tani/Perkebunan' ? 'selected' : ''}>Buruh Tani/Perkebunan</option>
                  <option value="Guru" ${data.pekerjaan === 'Guru' ? 'selected' : ''}>Guru</option>
                  <option value="Karyawan Honorer" ${data.pekerjaan === 'Karyawan Honorer' ? 'selected' : ''}>Karyawan Honorer</option>
                  <option value="Karyawan Swasta" ${data.pekerjaan === 'Karyawan Swasta' ? 'selected' : ''}>Karyawan Swasta</option>
                  <option value="Mekanik" ${data.pekerjaan === 'Mekanik' ? 'selected' : ''}>Mekanik</option>
                  <option value="Mengurus Rumah Tangga" ${data.pekerjaan === 'Mengurus Rumah Tangga' ? 'selected' : ''}>Mengurus Rumah Tangga</option>
                  <option value="Nelayan/Perikanan" ${data.pekerjaan === 'Nelayan/Perikanan' ? 'selected' : ''}>Nelayan/Perikanan</option>
                  <option value="Pedagang" ${data.pekerjaan === 'Pedagang' ? 'selected' : ''}>Pedagang</option>
                  <option value="Pelajar/Mahasiswa" ${data.pekerjaan === 'Pelajar/Mahasiswa' ? 'selected' : ''}>Pelajar/Mahasiswa</option>
                  <option value="Pensiunan" ${data.pekerjaan === 'Pensiunan' ? 'selected' : ''}>Pensiunan</option>
                  <option value="Perawat" ${data.pekerjaan === 'Perawat' ? 'selected' : ''}>Perawat</option>
                  <option value="Perdagangan" ${data.pekerjaan === 'Perdagangan' ? 'selected' : ''}>Perdagangan</option>
                  <option value="Petani/Pekebun" ${data.pekerjaan === 'Petani/Pekebun' ? 'selected' : ''}>Petani/Pekebun</option>
                  <option value="Peternak" ${data.pekerjaan === 'Peternak' ? 'selected' : ''}>Peternak</option>
                  <option value="PNS" ${data.pekerjaan === 'PNS' ? 'selected' : ''}>PNS</option>
                  <option value="Sopir" ${data.pekerjaan === 'Sopir' ? 'selected' : ''}>Sopir</option>
                  <option value="Tukang  Batu" ${data.pekerjaan === 'Tukang  Batu' ? 'selected' : ''}>Tukang  Batu</option>
                  <option value="Tukang Jahit" ${data.pekerjaan === 'Tukang Jahit' ? 'selected' : ''}>Tukang Jahit</option>
                  <option value="Tukang Kayu" ${data.pekerjaan === 'Tukang Kayu' ? 'selected' : ''}>Tukang Kayu</option>
                  <option value="Tukang Las/Pandai Besi" ${data.pekerjaan === 'Tukang Las/Pandai Besi' ? 'selected' : ''}>Tukang Las/Pandai Besi</option>
                  <option value="Ustadz/Mubaligh" ${data.pekerjaan === 'Ustadz/Mubaligh' ? 'selected' : ''}>Ustadz/Mubaligh</option>
                  <option value="Wiraswasta" ${data.pekerjaan === 'Wiraswasta' ? 'selected' : ''}>Wiraswasta</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Pendidikan</th>
              <td>
                <select id="pendidikan" class="w-full p-2 border rounded mb-2">
                  <option value="">--Pilih Pendidikan--</option>
                  <option value="Tidak/Blm Sekolah" ${data.pendidikan === 'Tidak/Blm Sekolah' ? 'selected' : ''}>Tidak/Blm Sekolah</option>
                  <option value="Blm Tmt SD/Sederajat" ${data.pendidikan === 'Blm Tmt SD/Sederajat' ? 'selected' : ''}>Blm Tmt SD/Sederajat</option>
                  <option value="SD/Sederajat" ${data.pendidikan === 'SD/Sederajat' ? 'selected' : ''}>SD/Sederajat</option>
                  <option value="SLTP/Sederajat" ${data.pendidikan === 'SLTP/Sederajat' ? 'selected' : ''}>SLTP/Sederajat</option>
                  <option value="SLTA/Sederajat" ${data.pendidikan === 'SLTA/Sederajat' ? 'selected' : ''}>SLTA/Sederajat</option>
                  <option value="Diploma I/II" ${data.pendidikan === 'Diploma I/II' ? 'selected' : ''}>Diploma I/II</option>
                  <option value="Diploma III" ${data.pendidikan === 'Diploma III' ? 'selected' : ''}>Diploma III</option>
                  <option value="Diploma IV/Strata 1" ${data.pendidikan === 'Diploma IV/Strata 1' ? 'selected' : ''}>Diploma IV/Strata 1</option>
                  <option value="Strata II" ${data.pendidikan === 'Strata II' ? 'selected' : ''}>Strata II</option>
                  <option value="Strata III" ${data.pendidikan === 'Strata III' ? 'selected' : ''}>Strata III</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Hubungan Keluarga</th>
              <td>
                <select id="hubungan_keluarga" class="w-full p-2 border rounded">
                  <option value="">--Pilih Hubungan Keluarga--</option>
                  <option value="Kepala Keluarga" ${data.hubungan_keluarga === 'Kepala Keluarga' ? 'selected' : ''}>Kepala Keluarga</option>
                  <option value="Isteri" ${data.hubungan_keluarga === 'Isteri' ? 'selected' : ''}>Isteri</option>
                  <option value="Anak" ${data.hubungan_keluarga === 'Anak' ? 'selected' : ''}>Anak</option>
                  <option value="Cucu" ${data.hubungan_keluarga === 'Cucu' ? 'selected' : ''}>Cucu</option>
                  <option value="Orang Tua" ${data.hubungan_keluarga === 'Orang Tua' ? 'selected' : ''}>Orang Tua</option>
                  <option value="Menantu" ${data.hubungan_keluarga === 'Menantu' ? 'selected' : ''}>Menantu</option>
                  <option value="Famili" ${data.hubungan_keluarga === 'Famili' ? 'selected' : ''}>Famili</option>
                  <option value="Pembantu" ${data.hubungan_keluarga === 'Pembantu' ? 'selected' : ''}>Pembantu</option>
                  <option value="Saudara" ${data.hubungan_keluarga === 'Saudara' ? 'selected' : ''}>Saudara</option>
                </select>
              </td>
            </tr>
            <tr id="tr_status_rumah_edit" style="display: none;">
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Status Rumah</th>
              <td>
                <select id="status_rumah_edit" class="w-full p-2 border rounded">
                  <option value="">--Pilih Status Rumah--</option>
                  <option value="Rumah Sendiri" ${data.status_rumah === 'Rumah Sendiri' ? 'selected' : ''}>Rumah Sendiri</option>
                  <option value="Numpang" ${data.status_rumah === 'Numpang' ? 'selected' : ''}>Numpang</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Dusun</th>
              <td>
                <div class="flex gap-2">
                  <select id="alamat_dusun_edit" class="w-full p-2 border rounded">
                    <option value="">--Pilih Dusun--</option>
                  </select>
                  <button type="button" id="btnDusunEdit" class="px-2 py-1 bg-gray-500 text-white rounded">⚙️</button>
                </div>
              </td>
            </tr>
            <tr><th class="bg-gray-50 px-4 py-2 text-gray-600">Desa</th><td><input id="desa_edit" class="w-full p-2 border rounded bg-gray-100 cursor-not-allowed" value="${data.desa}" disabled /></td></tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Status Yatim</th>
              <td>
                <select id="miskin_sangat" class="w-full p-2 border rounded">
                  <option value="">--Tidak Ada--</option>
                  <option value="Sangat Miskin" ${data.miskin_sangat === 'Sangat Miskin' ? 'selected' : ''}>Sangat Miskin</option>
                  <option value="Miskin" ${data.miskin_sangat === 'Miskin' ? 'selected' : ''}>Miskin</option>
                  <option value="Kurang Mampu" ${data.miskin_sangat === "Kurang Mampu" ? "selected" : ""}>Kurang Mampu</option>
                  <option value="Mampu" ${data.miskin_sangat === 'Mampu' ? 'selected' : ''}>Mampu</option>
                  <option value="Kaya" ${data.miskin_sangat === 'Kaya' ? 'selected' : ''}>Kaya</option>
                  <option value="Sangat Kaya" ${data.miskin_sangat === 'Sangat Kaya' ? 'selected' : ''}>Sangat Kaya</option>
                </select>
              </td>
            </tr>
            <tr>
            <th class="bg-gray-50 px-4 py-2 text-gray-600">Bantuan Sosial</th>
            <td>
              <div id="listBantuanEdit" class="flex flex-col gap-1 border rounded bg-gray-50"></div>
            </td>
          </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Kategori Mengaji</th>
              <td>
                <select id="kategori_mengaji_edit" class="w-full p-2 border rounded">
                  <option value="">--Tidak Ada--</option>
                  <option value="Ngaji Lokal" ${data.kategori_mengaji === 'Ngaji Lokal' ? 'selected' : ''}>Ngaji Lokal</option>
                  <option value="Ngaji Luar" ${data.kategori_mengaji === 'Ngaji Luar' ? 'selected' : ''}>Ngaji Luar</option>
                  <option value="Guru Ngaji" ${data.kategori_mengaji === 'Guru Ngaji' ? 'selected' : ''}>Guru Ngaji</option>
                </select>
              </td>
            </tr>
            <tr id="tr_lokasi_mengaji_edit" style="display: none;">
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Tempat Mengaji</th>
              <td>
                <select id="lokasi_mengaji_edit" class="w-full p-2 border rounded">
                  <option value="">--Pilih Lokasi Mengaji--</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    showCancelButton: true,
    cancelButtonText: 'Batal',
    confirmButtonText: 'Simpan Perubahan',
    confirmButtonColor: '#2563eb',
    focusConfirm: false,
    customClass: { popup: 'w-full max-w-3xl' },

    didOpen: async () => {
  const tanggalLahirInput = document.getElementById('tanggal_lahir');
  new Pikaday({ field: tanggalLahirInput, format: 'DD/MM/YYYY' });

  // 🔹 isi dropdown dusun
  await isiDropdownDusun("alamat_dusun_edit", data.alamat_dusun);
  const btnDusunEdit = document.getElementById("btnDusunEdit");
  if (btnDusunEdit) {
    btnDusunEdit.onclick = () => popupCrudDusun("alamat_dusun_edit");
  }

  // 🔹 toggle status rumah
  const hubunganKeluargaSelect = document.getElementById('hubungan_keluarga');
  const trStatusRumahEdit = document.getElementById('tr_status_rumah_edit');
  const statusRumahEditSelect = document.getElementById('status_rumah_edit');
  const toggleStatusRumahEdit = () => {
    if (hubunganKeluargaSelect.value.toLowerCase() === 'kepala keluarga') {
      trStatusRumahEdit.style.display = '';
    } else {
      trStatusRumahEdit.style.display = 'none';
      statusRumahEditSelect.value = '';
    }
  };
  hubunganKeluargaSelect.addEventListener('change', toggleStatusRumahEdit);
  toggleStatusRumahEdit();

  // 🔹 toggle lokasi mengaji
  const kategoriMengajiSelect = document.getElementById('kategori_mengaji_edit');
  const trLokasiMengajiEdit = document.getElementById('tr_lokasi_mengaji_edit');
  const lokasiMengajiEditSelect = document.getElementById('lokasi_mengaji_edit');
  const toggleLokasiMengajiEdit = async () => {
    const kategori = kategoriMengajiSelect.value;
    const selectedValue = data?.lokasi_mengaji || "";
    if (kategori === "Ngaji Lokal") {
      trLokasiMengajiEdit.style.display = '';
      await isiLokasiMengajiDropdown("lokasi_mengaji_edit", "lokal", selectedValue);
    } else if (kategori === "Ngaji Luar") {
      trLokasiMengajiEdit.style.display = '';
      await isiLokasiMengajiDropdown("lokasi_mengaji_edit", "luar", selectedValue);
    } else if (kategori === "Guru Ngaji") {
      trLokasiMengajiEdit.style.display = '';
      await isiLokasiMengajiDropdown("lokasi_mengaji_edit", "guru", selectedValue);
    } else {
      trLokasiMengajiEdit.style.display = 'none';
      lokasiMengajiEditSelect.value = '';
    }
  };
  kategoriMengajiSelect.addEventListener('change', toggleLokasiMengajiEdit);
  await toggleLokasiMengajiEdit();

  // 🔹 attach tombol ⚙ lokasi mengaji
  const kategoriAwal =
    data.kategori_mengaji === "Ngaji Lokal" ? "lokal" :
    data.kategori_mengaji === "Ngaji Luar" ? "luar" : "guru";
  attachCrudLokasi("lokasi_mengaji_edit", kategoriAwal);

  // 🔹 isi combobox bantuan sosial dari API
  // 🔹 isi combobox bantuan sosial dari API
// — GANTI blok lama 'isi combobox bantuan sosial dari API' dengan blok ini —
try {
  const res = await fetch("/api/penduduk?distinct=bantuan_sosial");
  const hasil = await res.json();
  const opsiBantuan = hasil?.data || [];

  const container = document.getElementById("listBantuanEdit");
  if (container) {
    // buat tombol di dalam cell popup (tetap ringkas)
    container.innerHTML = `<button type="button" id="btnBantuanEdit" class="w-full border p-2 rounded bg-white text-left">Pilih Bantuan Sosial</button>`;
    const btn = container.querySelector("#btnBantuanEdit");

    // buat dropdown di body agar tidak terpotong oleh overflow parent popup/table
    let dropdown = document.createElement("div");
    dropdown.id = "dropdownBantuanEdit";
    dropdown.className = "hidden";
    // style dasar (gunakan inline supaya konsisten di dalam popup swal)
    Object.assign(dropdown.style, {
      position: "absolute",
      zIndex: 99999,
      background: "white",
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
      maxHeight: "10rem",
      overflowY: "auto",
      borderRadius: "6px",
      boxSizing: "border-box",
      padding: "2px 0"
    });
    document.body.appendChild(dropdown);

    // isi opsi checkbox ke dropdown
    opsiBantuan.forEach(opt => {
      const checked = Array.isArray(data?.bantuan_sosial) && data.bantuan_sosial.includes(opt);
      const id = `bantuan_${opt.replace(/\s+/g, "_")}`;

      const label = document.createElement("label");
      label.className = "flex items-center px-3 py-1 hover:bg-gray-100 cursor-pointer";
      label.style.display = "flex";
      label.style.alignItems = "center";
      label.innerHTML = `<input type="checkbox" id="${id}" value="${opt}" ${checked ? "checked" : ""} style="margin-right:8px" /> <span style="white-space:nowrap">${opt}</span>`;
      dropdown.appendChild(label);
    });

    // fungsi posisi dropdown tepat di bawah tombol
    const positionDropdown = () => {
      const rect = btn.getBoundingClientRect();
      // gunakan page scroll untuk top agar tetap di viewport
      dropdown.style.left = `${rect.left}px`;
      dropdown.style.top = `${rect.bottom + window.scrollY}px`;
      dropdown.style.width = `${rect.width}px`;
    };

    // buka/tutup dropdown
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      positionDropdown();
      dropdown.classList.toggle("hidden");
    });

    // update label tombol saat checkbox berubah
    const updateLabel = () => {
      const selected = Array.from(dropdown.querySelectorAll("input[type='checkbox']:checked")).map(i => i.value);
      btn.textContent = selected.length ? selected.join(", ") : "Pilih Bantuan Sosial";
    };
    dropdown.addEventListener("change", updateLabel);
    updateLabel();

    // tutup saat klik luar
    const handleOutside = (ev) => {
      if (!dropdown.contains(ev.target) && ev.target !== btn) {
        dropdown.classList.add("hidden");
      }
    };
    // pakai setTimeout agar tidak langsung menutup ketika tombol diklik
    setTimeout(() => document.addEventListener("mousedown", handleOutside), 0);

    // reposition saat scroll/resize (dan tetap responsif terhadap scroll container)
    const reposition = () => { if (!dropdown.classList.contains("hidden")) positionDropdown(); };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);

    // Cleanup: hapus dropdown & listeners ketika popup Swal hilang
    const mo = new MutationObserver(() => {
      if (!Swal.getPopup()) {
        // hapus elemen & listeners
        if (dropdown && dropdown.parentNode) dropdown.parentNode.removeChild(dropdown);
        document.removeEventListener("mousedown", handleOutside);
        window.removeEventListener("resize", reposition);
        window.removeEventListener("scroll", reposition, true);
        mo.disconnect();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }
} catch (e) {
  console.error("❌ Gagal ambil opsi bantuan sosial (edit):", e);
}
},


    preConfirm: async () => {
  // 🔹 ambil tanggal lahir
  const tgl = document.getElementById('tanggal_lahir')?.value?.trim() || "";
  if (!tgl) {
    Swal.showValidationMessage("❌ Tanggal lahir wajib diisi");
    return false;
  }

  const parts = tgl.split('/');
  if (parts.length !== 3) {
    Swal.showValidationMessage("❌ Format tanggal harus dd/mm/yyyy");
    return false;
  }

  const [d, m, y] = parts;
  const tanggalISO = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

  // 🔹 ambil pilihan bantuan sosial (semua checkbox yang tercentang)
  const checkedBantuan = Array.from(
  document.querySelectorAll("#dropdownBantuanEdit input[type='checkbox']:checked")
).map(el => el.value);


  // 🔹 kumpulkan data form
  const payload = {
    id: data.id,
    kode_desa: document.getElementById('kode_desa')?.value || "2036",
    kk: document.getElementById('kk')?.value || "",
    nik: document.getElementById('nik')?.value || "",
    nama: document.getElementById('nama')?.value || "",
    tempat_lahir: document.getElementById('tempat_lahir')?.value || "",
    tanggal_lahir: tanggalISO,
    jenis_kelamin: document.getElementById('jenis_kelamin')?.value || "",
    status: document.getElementById('status')?.value || "",
    pekerjaan: document.getElementById('pekerjaan')?.value || "",
    alamat_dusun: document.getElementById('alamat_dusun_edit')?.value || "",
    desa: document.getElementById('desa_edit')?.value || "",
    pendidikan: document.getElementById('pendidikan')?.value || "",
    hubungan_keluarga: document.getElementById('hubungan_keluarga')?.value || "",
    status_rumah: document.getElementById('status_rumah_edit')?.value || "",
    yatim_piatu: document.getElementById('yatim_piatu')?.value || "",
    kategori_mengaji: document.getElementById('kategori_mengaji_edit')?.value || "",
    lokasi_mengaji: document.getElementById('lokasi_mengaji_edit')?.value || "",
    miskin_sangat: document.getElementById('miskin_sangat')?.value || "",
    bantuan_sosial: checkedBantuan, // ⬅️ array hasil ceklis
    kategori_usia: "" // backend yang hitung
  };

  try {
    // 🔹 kirim update ke backend
    const res = await fetch("/api/penduduk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal update");
    }
    const updatedData = await res.json();

    // 🔹 simpan selection sebelum edit
    const nikSebelumnya = detailAnggota ? String(detailAnggota.nik) : selectedNik;
    const kkSebelumnya = selectedKK;

    // 🔹 refresh tabel utama
    await ambilSemuaData();
    await ambilDataPenduduk(currentPage);

    // 🔹 refresh keluarga & warna badge
    const kkToUse = kkSebelumnya || updatedData.kk || null;
    if (kkToUse) {
      const keluargaBaru = await tampilkanAnggotaKeluarga(kkToUse, nikSebelumnya);
      const fresh = keluargaBaru?.find((a) => String(a.nik) === nikSebelumnya);
      if (fresh) {
        setDetailAnggota(fresh);
      } else if (updatedData && String(updatedData.nik) === nikSebelumnya) {
        setDetailAnggota(updatedData);
      }
    }

    // 🔹 restore highlight di tabel utama
    if (nikSebelumnya) setSelectedNik(nikSebelumnya);

  } catch (err) {
    console.error("❌ Error update:", err);
    Swal.showValidationMessage(`❌ Gagal simpan: ${err.message}`);
  }
}
  });
}, [ambilDataPenduduk, ambilSemuaData, currentPage, formatTanggalIndo, tampilkanAnggotaKeluarga, detailAnggota, selectedNik, selectedKK]);


 // handler hapus
const handleHapus = useCallback(async (nik) => {
  const result = await Swal.fire({
    title: `Yakin ingin hapus NIK ${nik}?`,
    text: 'Data yang dihapus tidak bisa dikembalikan!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e3342f',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal'
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`/api/penduduk?nik=${encodeURIComponent(nik)}`, {
        method: 'DELETE'
      });
      const hasil = await res.json();

      if (!res.ok) throw new Error(hasil.error || "Gagal hapus data");

      setSelectedNik(null); // clear selection

      Swal.fire({
        icon: 'success',
        title: '✅ Dihapus!',
        text: 'Data berhasil dihapus.',
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true
      });

      // 🔹 refresh tabel & cache data
      ambilDataPenduduk(currentPage);
      ambilSemuaData();

    } catch (err) {
      Swal.fire('❌ Gagal!', err.message, 'error');
    }
  }
}, [ambilDataPenduduk, ambilSemuaData, currentPage]);


const handleTambahAnggotaBaru = (kepala) => {
  // helper lokal untuk parse dd/mm/yyyy → yyyy-mm-dd
  const parseTanggalToISO = (tgl) => {
    if (!tgl) return null;
    const parts = tgl.trim().split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  Swal.fire({
    title: 'Tambah Anggota Baru',
    html: `
      <input id="nama" class="swal2-input" placeholder="Nama Anggota" />
      <input id="nik" class="swal2-input" placeholder="NIK (16 digit)" />
      <input id="tanggal_lahir" class="swal2-input" placeholder="dd/mm/yyyy" />
      <select id="jenis_kelamin" class="swal2-input">
        <option value="">--Jenis Kelamin--</option>
        <option value="L">Laki-laki</option>
        <option value="P">Perempuan</option>
      </select>
      <select id="hubungan_keluarga" class="swal2-input">
        <option value="Anak" selected>Anak</option>
        <option value="Isteri">Isteri</option>
        <option value="Cucu">Cucu</option>
        <option value="Famili">Famili</option>
        <option value="Saudara">Saudara</option>
        <option value="Orang Tua">Orang Tua</option>
        <option value="Menantu">Menantu</option>
        <option value="Pembantu">Pembantu</option>
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    preConfirm: async () => {
      const nik = document.getElementById('nik').value.trim();
      const nama = document.getElementById('nama').value.trim();
      const tgl = document.getElementById('tanggal_lahir').value.trim();
      const jenis_kelamin = document.getElementById('jenis_kelamin').value.trim();
      const hubungan_keluarga = document.getElementById('hubungan_keluarga').value.trim();
      const tanggalISO = parseTanggalToISO(tgl);

      if (!/^\d{16}$/.test(nik)) {
        Swal.showValidationMessage("❌ NIK harus 16 digit");
        return false;
      }
      if (!nama) {
        Swal.showValidationMessage("❌ Nama wajib diisi");
        return false;
      }
      if (!tanggalISO) {
        Swal.showValidationMessage("❌ Tanggal lahir tidak valid (format dd/mm/yyyy)");
        return false;
      }
      if (!hubungan_keluarga) {
        Swal.showValidationMessage("❌ Hubungan keluarga wajib dipilih");
        return false;
      }

      const payload = {
        nik,
        nama,
        tanggal_lahir: tanggalISO,
        jenis_kelamin,
        hubungan_keluarga,
        kk: kepala.kk,                       // ikut kepala
        alamat_dusun: kepala.alamat_dusun,   // ikut kepala
        miskin_sangat: kepala.miskin_sangat, // ikut kepala
        kode_desa: kepala.kode_desa,
        desa: kepala.desa,
      };

      const res = await fetch('/api/penduduk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) {
        Swal.showValidationMessage("❌ " + (json.error || "Gagal simpan"));
        return false;
      }
      return json;
    }
  }).then(result => {
    if (result.isConfirmed) {
      Swal.fire("✅", "Anggota baru berhasil ditambahkan", "success");

      // langsung update daftar keluarga di sisi kanan
      const dataBaru = result.value?.data?.[0] || null;
      if (dataBaru) {
        setAnggotaKeluarga(prev => [...prev, dataBaru]);
      }
    }
  });
};



const eksporExcel = useCallback(async () => {
  const allColumns = [
    { key: "kode_desa", label: "Kode Desa" },
    { key: "kk", label: "No KK" },
    { key: "nik", label: "NIK" },
    { key: "nama", label: "Nama" },
    { key: "tempat_lahir", label: "Tempat Lahir" },
    { key: "tanggal_lahir", label: "Tanggal Lahir" },
    { key: "status", label: "Status" },
    { key: "jenis_kelamin", label: "Jenis Kelamin" },
    { key: "pekerjaan", label: "Pekerjaan" },
    { key: "alamat_dusun", label: "Alamat Dusun" },
    { key: "desa", label: "Desa" },
    { key: "pendidikan", label: "Pendidikan" },
    { key: "hubungan_keluarga", label: "Hubungan Keluarga" },
    { key: "status_rumah", label: "Status Rumah" },
    { key: "yatim_piatu", label: "Yatim Piatu" },
    { key: "miskin_sangat", label: "Miskin Sangat" },
    { key: "kategori_mengaji", label: "Kategori Mengaji" },
    { key: "lokasi_mengaji", label: "Lokasi Mengaji" },
    { key: "bantuan_sosial", label: "Bantuan Sosial" },
  ];

  // 🔹 bagi ke 3 kolom
  const perCol = Math.ceil(allColumns.length / 3);
  const col1 = allColumns.slice(0, perCol);
  const col2 = allColumns.slice(perCol, perCol * 2);
  const col3 = allColumns.slice(perCol * 2);

  const pilihan = await Swal.fire({
    title: "Ekspor Data Penduduk",
    html: `
  <p style="margin-bottom:8px; font-size:14px; color:#374151; text-align:left;">
    Data akan diekspor berdasarkan kolom yang dipilih di bawah ini:
  </p>
  <div style="margin-bottom:10px; display:flex; align-items:center; gap:8px;">
    <input type="checkbox" id="masterCheckbox" checked>
    <label for="masterCheckbox" style="font-size:14px; font-weight:500; cursor:pointer;">
      Pilih/Hapus Semua
    </label>
  </div>
  <div style="border:1px solid #e5e7eb; border-radius:8px; padding:10px; background:#fff;">
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; text-align:left; max-height:260px; overflow-y:auto;">
      <div>
        ${col1.map(col => `
          <label style="display:flex; align-items:center; gap:6px; font-size:14px; margin-bottom:6px;">
            <input type="checkbox" class="swal-column" value="${col.key}" checked>
            <span>${col.label}</span>
          </label>
        `).join("")}
      </div>
      <div>
        ${col2.map(col => `
          <label style="display:flex; align-items:center; gap:6px; font-size:14px; margin-bottom:6px;">
            <input type="checkbox" class="swal-column" value="${col.key}" checked>
            <span>${col.label}</span>
          </label>
        `).join("")}
      </div>
      <div>
        ${col3.map(col => `
          <label style="display:flex; align-items:center; gap:6px; font-size:14px; margin-bottom:6px;">
            <input type="checkbox" class="swal-column" value="${col.key}" checked>
            <span>${col.label}</span>
          </label>
        `).join("")}
      </div>
    </div>
  </div>
`,
    showCancelButton: true,
    confirmButtonText: "Ekspor Sekarang",
    cancelButtonText: "Batal",
    confirmButtonColor: "#10b981",
    width: 650,
    didOpen: () => {
      const popup = Swal.getPopup();
      const master = popup.querySelector('#masterCheckbox');
      const items = popup.querySelectorAll('.swal-column');

      // toggle semua item kalau master berubah
      master.addEventListener('change', () => {
        items.forEach(cb => cb.checked = master.checked);
      });

      // update master kalau item berubah
      items.forEach(cb => {
        cb.addEventListener('change', () => {
          const allChecked = Array.from(items).every(x => x.checked);
          const noneChecked = Array.from(items).every(x => !x.checked);
          if (allChecked) {
            master.checked = true;
            master.indeterminate = false;
          } else if (noneChecked) {
            master.checked = false;
            master.indeterminate = false;
          } else {
            master.indeterminate = true; // status setengah
          }
        });
      });
    },
    preConfirm: () => {
      const popup = Swal.getPopup();
      const checked = Array.from(
        popup.querySelectorAll(".swal-column:checked")
      ).map(el => el.value);

      if (checked.length === 0) {
        Swal.showValidationMessage("❌ Pilih minimal satu kolom untuk diekspor");
        return false;
      }
      return checked;
    },
  });

  if (!pilihan.isConfirmed) return;

  const selectedKeys = pilihan.value; // array key kolom terpilih

  // 🔹 popup kedua: pilih mode export
  const mode = await Swal.fire({
    title: "Pilih Jenis Ekspor",
    html: `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <button id="btnAll" class="swal2-styled rounded-lg" style="background:#10b981;color:#fff">EXPOR SELURUH PENDUDUK</button>
        <button id="btnBersih" class="swal2-styled rounded-lg" style="background:#facc15; color:#000;">EXPOR DATA BERSIH</button>
        <button id="btnHantu" class="swal2-styled rounded-lg" style="background:#ef4444;color:#fff">EXPOR DATA HANTU</button>
      </div>
    `,
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: "Batal",
    didOpen: () => {
      const popup = Swal.getPopup();
      popup.querySelector("#btnAll").addEventListener("click", () => Swal.close({ value: "all" }));
      popup.querySelector("#btnBersih").addEventListener("click", () => Swal.close({ value: "bersih" }));
      popup.querySelector("#btnHantu").addEventListener("click", () => Swal.close({ value: "hantu" }));
    }
  });

  if (!mode.value) return;
  const filterMode = mode.value;

  try {
    // 🔹 ambil semua data terfilter dari backend (modeEkspor = true agar ambil banyak)
    let data = await ambilDataPenduduk(1, true);

    if (!data || data.length === 0) {
      Swal.fire("Kosong", "Tidak ada data untuk diekspor", "warning");
      return;
    }

    // filter sesuai pilihan
    if (filterMode === "bersih") {
      data = data.filter(r => !r.req_delete);
    } else if (filterMode === "hantu") {
      data = data.filter(r => r.req_delete);
    }

    // =========================
    // 🔹 group by KK, urutkan keluarga
    // =========================
    const grouped = data.reduce((acc, row) => {
      const kkRaw = (row.kk ?? "").toString().trim();
      const kk = kkRaw === "" ? "__NO_KK__" : kkRaw;
      if (!acc[kk]) acc[kk] = [];
      acc[kk].push(row);
      return acc;
    }, {});

    const groupKeys = Object.keys(grouped).sort((a, b) => {
      if (a === "__NO_KK__") return 1;
      if (b === "__NO_KK__") return -1;
      const na = Number(String(a).replace(/\D/g, ""));
      const nb = Number(String(b).replace(/\D/g, ""));
      if (!isNaN(na) && !isNaN(nb) && na !== 0 && nb !== 0) {
        return na - nb;
      }
      return String(a).localeCompare(String(b), "id");
    });

    let sortedData = [];
    groupKeys.forEach(key => {
      const keluarga = grouped[key] || [];
      const kepala = keluarga.find(a => String(a.hubungan_keluarga).toLowerCase() === "kepala keluarga");
      const anggota = keluarga
        .filter(a => String(a.hubungan_keluarga).toLowerCase() !== "kepala keluarga")
        .sort((a, b) => {
          const ageA = getAgeYears(a?.tanggal_lahir);
          const ageB = getAgeYears(b?.tanggal_lahir);
          if (isNaN(ageA) && isNaN(ageB)) return (a?.nama || "").localeCompare(b?.nama || "", "id");
          if (isNaN(ageA)) return 1;
          if (isNaN(ageB)) return -1;
          if (ageB === ageA) return (a?.nama || "").localeCompare(b?.nama || "", "id");
          return ageB - ageA;
        });
      if (kepala) sortedData.push(kepala);
      sortedData = sortedData.concat(anggota);
    });

    // 🔹 buat workbook exceljs
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Penduduk");

    worksheet.columns = selectedKeys.map(k => {
    return { header: k, key: k, width: 20 }; // pakai nama field asli
    });


    sortedData.forEach(row => {
      const newRow = {};
      selectedKeys.forEach(k => {
        if (k === "tanggal_lahir") {
          newRow[k] = row.tanggal_lahir ? formatTanggalIndo(row.tanggal_lahir) : "";
        } else if (k === "bantuan_sosial") {
          newRow[k] = Array.isArray(row.bantuan_sosial)
            ? row.bantuan_sosial.join(", ")
            : (row.bantuan_sosial || "");
        } else {
          newRow[k] = row[k] ?? "";
        }
      });

      const excelRow = worksheet.addRow(newRow);

      const reqVal = String(row.req_delete ?? "").toLowerCase().trim();
      const isDeleted = ["true", "1", "y", "yes", "t"].includes(reqVal);
      if (isDeleted) {
        excelRow.eachCell(cell => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
          cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `data_penduduk_${filterMode}.xlsx`);

    Swal.fire("Berhasil", `Data berhasil diekspor (${filterMode})`, "success");
  } catch (err) {
    console.error("❌ Gagal ekspor:", err);
    Swal.fire("Error", err.message || String(err), "error");
  }
}, [ambilDataPenduduk, formatTanggalIndo, getAgeYears]);


// 🔹 Tambah Data (versi perbaikan lengkap)
const handleTambahData = useCallback((defaultValues = {}) => {

  // helper lokal untuk parse dd/mm/yyyy -> yyyy-mm-dd
  const parseTanggalToISO = (tgl) => {
    if (!tgl) return null;
    const parts = tgl.trim().split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(p => p.trim());
    if (!/^\d{1,2}$/.test(d) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(y)) return null;
    const dd = d.padStart(2, '0');
    const mm = m.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  Swal.fire({
    title: 'Tambah Data Penduduk',
    html: `
      <div class="">
        <table class="w-full text-sm text-left border border-gray-200">
          <tbody class="divide-y divide-gray-100">
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600 w-40">Kode Desa</th>
              <td><input id="kode_desa" class="w-full p-2 border rounded bg-gray-100 cursor-not-allowed" placeholder="Kode Desa" value="${defaultValues.kode_desa || "2036"}" readonly/></td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">No. KK</th>
              <td><input id="kk" class="w-full p-2 border rounded" placeholder="Nomor KK" value="${defaultValues.kk || ""}" /></td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">NIK</th>
              <td><input id="nik" class="w-full p-2 border rounded" placeholder="NIK" /></td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Nama</th>
              <td><input id="nama" class="w-full p-2 border rounded" placeholder="Nama Lengkap" /></td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Tempat / Tgl Lahir</th>
              <td>
                <div class="flex gap-2">
                  <input id="tempat_lahir" class="w-1/2 p-2 border rounded" placeholder="Tempat" />
                  <input id="tanggal_lahir" type="text" placeholder="dd/mm/yyyy" class="w-1/2 p-2 border rounded" />
                </div>
              </td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Jenis Kelamin</th>
              <td>
                <select id="jenis_kelamin" class="w-full p-2 border rounded">
                  <option value="">--Pilih Jenis Kelamin--</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Status</th>
              <td>
                <select id="status" class="w-full p-2 border rounded">
                  <option value="">--Pilih Status Pernikahan--</option>
                  <option value="S">Sudah Kawin</option>
                  <option value="B">Belum Kawin</option>
                  <option value="P">Pernah Kawin</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Pekerjaan</th>
              <td>
               <select id="pekerjaan" class="w-full p-2 border rounded">
                  <option value="">--Pilih Pekerjaan--</option>
                  <option value="Belum/Tidak Bekerja">Belum/Tidak Bekerja</option>
                  <option value="Bidan">Bidan</option>
                  <option value="Buruh Harian Lepas">Buruh Harian Lepas</option>
                  <option value="Buruh Tani/Perkebunan">Buruh Tani/Perkebunan</option>
                  <option value="Guru">Guru</option>
                  <option value="Karyawan Honorer">Karyawan Honorer</option>
                  <option value="Karyawan Swasta">Karyawan Swasta</option>
                  <option value="Mekanik">Mekanik</option>
                  <option value="Mengurus Rumah Tangga">Mengurus Rumah Tangga</option>
                  <option value="Nelayan/Perikanan">Nelayan/Perikanan</option>
                  <option value="Pedagang">Pedagang</option>
                  <option value="Pelajar/Mahasiswa">Pelajar/Mahasiswa</option>
                  <option value="Pensiunan">Pensiunan</option>
                  <option value="Perawat">Perawat</option>
                  <option value="Perdagangan">Perdagangan</option>
                  <option value="Petani/Pekebun">Petani/Pekebun</option>
                  <option value="Peternak">Peternak</option>
                  <option value="PNS">PNS</option>
                  <option value="Sopir">Sopir</option>
                  <option value="Tukang  Batu">Tukang  Batu</option>
                  <option value="Tukang Jahit">Tukang Jahit</option>
                  <option value="Tukang Kayu">Tukang Kayu</option>
                  <option value="Tukang Las/Pandai Besi">Tukang Las/Pandai Besi</option>
                  <option value="Ustadz/Mubaligh">Ustadz/Mubaligh</option>
                  <option value="Wiraswasta">Wiraswasta</option>
                </select>
              </td>
            </tr>            
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Pendidikan</th>
              <td>
                <select id="pendidikan" class="w-full p-2 border rounded">
                  <option value="">--Pilih Pendidikan--</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Status Keluarga</th>
              <td>
                <select id="hubungan_keluarga" class="w-full p-2 border rounded">
                  <option value="">--Pilih Hubungan Keluarga--</option>
                  <option value="Kepala Keluarga">Kepala Keluarga</option>
                  <option value="Isteri">Isteri</option>
                  <option value="Anak">Anak</option>
                  <option value="Cucu">Cucu</option>
                  <option value="Orang Tua">Orang Tua</option>
                  <option value="Menantu">Menantu</option>
                  <option value="Famili">Famili</option>
                  <option value="Pembantu">Pembantu</option>
                  <option value="Saudara">Saudara</option>
                </select>
              </td>
            </tr>
            <tr id="tr_status_rumah" style="display: none;">
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Status Rumah</th>
              <td>
                <select id="status_rumah" class="w-full p-2 border rounded">
                  <option value="">--Pilih Status Kepemilikan Rumah--</option>
                  <option value="Rumah Sendiri">Rumah Sendiri</option>
                  <option value="Numpang">Numpang</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Alamat Dusun</th>
              <td>
                <div class="flex gap-2">
                  <select id="alamat_dusun" class="w-full p-2 border rounded">
                    <option value="">--Pilih Dusun--</option>
                  </select>
                  <button type="button" id="btnDusun" class="px-2 py-1 bg-gray-500 text-white rounded">⚙️</button>
                </div>
              </td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Gampong</th>
              <td><input id="desa" class="w-full p-2 border rounded bg-gray-100 cursor-not-allowed" placeholder="Nama Desa" value="${defaultValues.desa || "Bugak Krueng"}" disabled/></td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Status Yatim</th>
              <td>
                <select id="yatim_piatu" class="w-full p-2 border rounded">
                  <option value="">--Tidak Ada--</option>
                  <option value="Yatim">Yatim</option>
                  <option value="Piatu">Piatu</option>
                  <option value="Yatim Piatu">Yatim Piatu</option>
                </select>
              </td>
            </tr>
            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Kategori Miskin</th>
              <td>
                <select id="miskin_sangat" class="w-full p-2 border rounded">
                  <option value="">--Tidak Ada--</option>
                  <option value="Sangat Miskin" ${defaultValues.miskin_sangat === "Sangat Miskin" ? "selected" : ""}>Sangat Miskin</option>
                  <option value="Miskin" ${defaultValues.miskin_sangat === "Miskin" ? "selected" : ""}>Miskin</option>
                  <option value="Kurang Mampu" ${defaultValues.miskin_sangat === "Kurang Mampu" ? "selected" : ""}>Kurang Mampu</option>
                  <option value="Mampu" ${defaultValues.miskin_sangat === "Mampu" ? "selected" : ""}>Mampu</option>
                  <option value="Kaya" ${defaultValues.miskin_sangat === "Kaya" ? "selected" : ""}>Kaya</option>
                  <option value="Sangat Kaya" ${defaultValues.miskin_sangat === "Sangat Kaya" ? "selected" : ""}>Sangat Kaya</option>
                </select>
              </td>
            </tr>
            <tr>
  <th class="bg-gray-50 px-4 py-2 text-gray-600">Bantuan Sosial</th>
  <td>
    <!-- gantikan select statis dengan container untuk tombol + dropdown -->
    <div id="listBantuanTambah" class="flex flex-col gap-1 border rounded bg-gray-50"></div>
  </td>
</tr>

            <tr>
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Kategori Mengaji</th>
              <td>
                <select id="kategori_mengaji" class="w-full p-2 border rounded">
                  <option value="">--Tidak Ada--</option>
                  <option value="Ngaji lokal">Ngaji Lokal</option>
                  <option value="Ngaji Luar">Ngaji Luar</option>
                  <option value="Guru Ngaji">Guru Ngaji</option>
                </select>
              </td>
            </tr>
            <tr id="tr_lokasi_mengaji" style="display: none;">
              <th class="bg-gray-50 px-4 py-2 text-gray-600">Tempat Mengaji</th>
              <td>
                <select id="lokasi_mengaji" class="w-full p-2 border rounded">
                  <option value="">--Tempat Mengaji--</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    showCancelButton: true,
    cancelButtonText: 'Batal',
    confirmButtonText: 'Simpan',
    confirmButtonColor: '#2563eb',
    focusConfirm: false,
    customClass: { popup: 'w-full max-w-3xl' },

    didOpen: async () => {
  // isi dusun & tombol config
  isiDropdownDusun("alamat_dusun", defaultValues.alamat_dusun || "");
  const btnDusun = document.getElementById("btnDusun");
  if (btnDusun) btnDusun.onclick = () => popupCrudDusun("alamat_dusun");
  populatePendidikanSelect("pendidikan", defaultValues?.pendidikan || "");

  // toggle status rumah
  const hubunganKeluargaSelect = document.getElementById('hubungan_keluarga');
  const trStatusRumah = document.getElementById('tr_status_rumah');
  const statusRumahSelect = document.getElementById('status_rumah');
  const toggleStatusRumah = () => {
    if (hubunganKeluargaSelect.value.toLowerCase() === 'kepala keluarga') {
      trStatusRumah.style.display = '';
    } else {
      trStatusRumah.style.display = 'none';
      if (statusRumahSelect) statusRumahSelect.value = '';
    }
  };
  hubunganKeluargaSelect.addEventListener('change', toggleStatusRumah);
  toggleStatusRumah();

  // lokasi mengaji
  const kategoriMengajiSelect = document.getElementById('kategori_mengaji');
  const trLokasiMengaji = document.getElementById('tr_lokasi_mengaji');
  const lokasiMengajiSelect = document.getElementById('lokasi_mengaji');
  attachCrudLokasi("lokasi_mengaji");
  const toggleLokasiMengaji = async () => {
    const kategori = (kategoriMengajiSelect.value || '').trim();
    if (kategori !== '') {
      trLokasiMengaji.style.display = '';
      if (kategori.toLowerCase().includes('lokal')) {
        await isiLokasiMengajiDropdown("lokasi_mengaji", "lokal", "");
      } else if (kategori.toLowerCase().includes('luar')) {
        await isiLokasiMengajiDropdown("lokasi_mengaji", "luar", "");
      } else if (kategori.toLowerCase().includes('guru')) {
        await isiLokasiMengajiDropdown("lokasi_mengaji", "guru", "");
      } else {
        await isiLokasiMengajiDropdown("lokasi_mengaji", "lokal", "");
      }
    } else {
      trLokasiMengaji.style.display = 'none';
      if (lokasiMengajiSelect) lokasiMengajiSelect.value = '';
    }
  };
  kategoriMengajiSelect.addEventListener('change', toggleLokasiMengaji);
  toggleLokasiMengaji();

  // 🔹 Bantuan Sosial → buat dropdown di luar popup agar tidak ketutup
  try {
    const res = await fetch("/api/penduduk?distinct=bantuan_sosial");
    const hasil = await res.json();
    const opsiBantuan = hasil?.data || [];

    const container = document.getElementById("listBantuanTambah");
    if (container) {
      container.innerHTML = `<button type="button" id="btnBantuanTambah" class="w-full border p-2 rounded bg-white text-left">Pilih Bantuan Sosial</button>`;
      const btn = container.querySelector("#btnBantuanTambah");

      // dropdown dibuat di body agar tidak terpotong overflow popup
      let dropdown = document.createElement("div");
      dropdown.id = "dropdownBantuanTambah";
      dropdown.className = "hidden";
      Object.assign(dropdown.style, {
        position: "absolute",
        zIndex: 99999,
        background: "white",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
        maxHeight: "12rem",
        overflowY: "auto",
        borderRadius: "6px",
        boxSizing: "border-box",
        padding: "4px 0"
      });
      document.body.appendChild(dropdown);

      // isi opsi checkbox
      opsiBantuan.forEach(opt => {
        const id = `bantuan_tambah_${opt.replace(/\s+/g, "_")}`;
        const label = document.createElement("label");
        label.className = "flex items-center px-3 py-1 hover:bg-gray-100 cursor-pointer";
        label.innerHTML = `<input type="checkbox" id="${id}" value="${opt}" style="margin-right:8px" /> <span>${opt}</span>`;
        dropdown.appendChild(label);
      });

      // posisi dropdown
      const positionDropdown = () => {
        const rect = btn.getBoundingClientRect();
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.top = `${rect.bottom + window.scrollY}px`;
        dropdown.style.width = `${rect.width}px`;
      };

      // buka/tutup
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        positionDropdown();
        dropdown.classList.toggle("hidden");
      });

      // update label tombol
      const updateLabel = () => {
        const selected = Array.from(dropdown.querySelectorAll("input[type='checkbox']:checked")).map(i => i.value);
        btn.textContent = selected.length ? selected.join(", ") : "Pilih Bantuan Sosial";
      };
      dropdown.addEventListener("change", updateLabel);

      // klik luar → tutup
      const handleOutside = (ev) => {
        if (!dropdown.contains(ev.target) && ev.target !== btn) {
          dropdown.classList.add("hidden");
        }
      };
      setTimeout(() => document.addEventListener("mousedown", handleOutside), 0);

      // reposition saat resize/scroll
      const reposition = () => { if (!dropdown.classList.contains("hidden")) positionDropdown(); };
      window.addEventListener("resize", reposition);
      window.addEventListener("scroll", reposition, true);

      // cleanup ketika Swal ditutup
      const mo = new MutationObserver(() => {
        if (!Swal.getPopup()) {
          if (dropdown && dropdown.parentNode) dropdown.parentNode.removeChild(dropdown);
          document.removeEventListener("mousedown", handleOutside);
          window.removeEventListener("resize", reposition);
          window.removeEventListener("scroll", reposition, true);
          mo.disconnect();
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  } catch (e) {
    console.error("❌ Gagal ambil opsi bantuan sosial (tambah):", e);
  }
},

// ⚠️ tidak perlu lagi willClose dengan picker

preConfirm: async () => {
  try {
    // ambil & validasi input
    const nikRaw = (document.getElementById('nik')?.value || '').trim();
    const namaRaw = (document.getElementById('nama')?.value || '').trim();
    const tglRaw = (document.getElementById('tanggal_lahir')?.value || '').trim();
    const tanggalISO = parseTanggalToISO(tglRaw);

    if (!namaRaw) {
      Swal.showValidationMessage("❌ Nama wajib diisi");
      return false;
    }
    if (!nikRaw) {
      Swal.showValidationMessage("❌ NIK wajib diisi");
      return false;
    }
    if (!/^\d{16}$/.test(String(nikRaw))) {
      Swal.showValidationMessage("❌ NIK harus 16 digit angka");
      return false;
    }
    if (!tanggalISO) {
      Swal.showValidationMessage("❌ Tanggal lahir tidak valid (format dd/mm/yyyy)");
      return false;
    }

    // normalisasi ringan
    const nama = normalisasiUniversal(namaRaw);
    const tempat_lahir = normalisasiUniversal(document.getElementById('tempat_lahir')?.value || '');
    const pekerjaan = document.getElementById('pekerjaan')?.value || '';
    const pendidikan = document.getElementById('pendidikan')?.value || '';

    // kategori mengaji normalisasi casing
    const kategoriRaw = (document.getElementById('kategori_mengaji')?.value || '').trim();
    let kategori_mengaji = '';
    if (kategoriRaw.toLowerCase().includes('lokal')) kategori_mengaji = 'Ngaji Lokal';
    else if (kategoriRaw.toLowerCase().includes('luar')) kategori_mengaji = 'Ngaji Luar';
    else if (kategoriRaw.toLowerCase().includes('guru')) kategori_mengaji = 'Guru Ngaji';
    else kategori_mengaji = kategoriRaw || '';

    // ambil bantuan sosial dari dropdown baru
    const checkedBantuan = Array.from(
      document.querySelectorAll("#dropdownBantuanTambah input[type='checkbox']:checked")
    ).map(el => el.value);

    const payload = {
      kode_desa: document.getElementById('kode_desa')?.value || "2036",
      kk: document.getElementById('kk')?.value || "",
      nik: String(nikRaw),
      nama,
      tempat_lahir: tempat_lahir || null,
      tanggal_lahir: tanggalISO,
      jenis_kelamin: document.getElementById('jenis_kelamin')?.value || null,
      status: document.getElementById('status')?.value || null,
      pekerjaan: pekerjaan || null,
      alamat_dusun: document.getElementById('alamat_dusun')?.value || null,
      desa: document.getElementById('desa')?.value || null,
      pendidikan: pendidikan || null,
      hubungan_keluarga: document.getElementById('hubungan_keluarga')?.value || null,
      status_rumah: document.getElementById('status_rumah')?.value || null,
      yatim_piatu: document.getElementById('yatim_piatu')?.value || null,
      kategori_mengaji,
      lokasi_mengaji: document.getElementById('lokasi_mengaji')?.value || null,
      miskin_sangat: document.getElementById('miskin_sangat')?.value || null,
      bantuan_sosial: checkedBantuan,
      kategori_usia: ''
    };

    // kirim ke backend
    const res = await fetch('/api/penduduk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      Swal.showValidationMessage('❌ ' + (json?.error || 'Gagal menyimpan data'));
      return false;
    }
    return json;
  } catch (err) {
    console.error('❌ Error simpan tambah:', err);
    Swal.showValidationMessage('❌ Gagal simpan: ' + (err.message || err));
    return false;
  }
}

}).then(result => {
  if (result.isConfirmed) {
    Swal.fire({
      icon: 'success',
      title: '✅ Berhasil!',
      text: 'Data berhasil disimpan.',
      showConfirmButton: false,
      timer: 1200
    });
    // refresh data dan dropdown
    ambilDataPenduduk(currentPage);
    ambilSemuaData();

    // ✅ update langsung ke daftar keluarga (urut usia tua → muda)
    const dataBaru = result.value?.data?.[0] || null;
    if (dataBaru && setAnggotaKeluarga) {
      setAnggotaKeluarga(prev => {
        let baru = [...prev, dataBaru];
        baru.sort((a, b) => {
          if (!a.tanggal_lahir) return 1;
          if (!b.tanggal_lahir) return -1;
          return new Date(a.tanggal_lahir) - new Date(b.tanggal_lahir);
        });
        return baru;
      });
    }
  }
});
}, [ambilDataPenduduk, ambilSemuaData, currentPage, normalisasiUniversal, setAnggotaKeluarga]);


// Fungsi untuk mengisi dropdown dusun
const isiDropdownDusun = async (selectId, selected = "") => {
  const select = document.getElementById(selectId);
  if (!select) return;

  try {
    const res = await fetch("/api/lokasidusun"); // 🔹 endpoint CRUD dusun
    const hasil = await res.json();

    select.innerHTML = `<option value="">--Pilih Dusun--</option>`;
    (hasil.data || []).forEach(dusun => {
      const opt = document.createElement("option");
      opt.value = dusun;
      opt.textContent = dusun;
      if (dusun === selected) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("❌ Gagal ambil dusun:", err);
    select.innerHTML = `<option value="">Gagal ambil data</option>`;
  }
};







  // Fungsi untuk mengisi dropdown lokasi mengaji
const isiLokasiMengajiDropdown = useCallback(
  async (selectId, kategori = "lokal", selected = "") => {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
      const res = await fetch(`/api/penduduk?distinct=lokasi_mengaji&kategori=${kategori}`);
      const hasil = await res.json();
      console.log("DEBUG isiLokasiMengajiDropdown response:", hasil);

      if (!hasil || !Array.isArray(hasil.data)) {
        throw new Error("Data lokasi mengaji tidak valid");
      }

      select.innerHTML = `<option value="">--Pilih Lokasi Mengaji--</option>`;
      hasil.data.forEach(loc => {
        const opt = document.createElement("option");
        opt.value = loc;
        opt.textContent = loc;
        if (loc === selected) opt.selected = true;
        select.appendChild(opt);
      });
    } catch (err) {
      console.error("❌ Gagal ambil lokasi mengaji:", err);
      select.innerHTML = `<option value="">Gagal ambil lokasi</option>`;
    }
  },
  []
);



// Fungsi untuk menampilkan lokasi mengaji
useEffect(() => {
  ambilLokasiMengaji(draftFilterKategoriMengaji);
}, [draftFilterKategoriMengaji, ambilLokasiMengaji]);




  // Render Pagination
  const renderPagination = useCallback(() => {
    const pages = [];
    const total = totalPage;
    const current = currentPage;

    const createBtn = (label, page, disabled = false, active = false) => (
      <button
        key={label === 'Prev' || label === 'Next' ? label : page}
        onClick={() => !disabled && ambilDataPenduduk(page)}
        className={`px-3 py-1 rounded border text-sm ${
          active
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-800 hover:bg-blue-100'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
      >
        {label}
      </button>
    );

    pages.push(createBtn('Prev', current - 1, current === 1));

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) {
      pages.push(createBtn(i, i, false, i === current));
    }
    pages.push(createBtn('Next', current + 1, current === total));

    return pages;
  }, [totalPage, currentPage, ambilDataPenduduk]);

  // Efek samping untuk memuat data awal dan dropdown
  useEffect(() => {
    ambilSemuaData();
    ambilDataPenduduk(1);
    isiDropdownsOtomatis();
    ambilOpsiBantuan();
  }, [ambilSemuaData, ambilDataPenduduk, isiDropdownsOtomatis]);

 useEffect(() => {
  if (!selectedNik) return;

  // timer untuk tunggu DOM selesai render
  const scrollTimer = setTimeout(() => {
    const row = document.getElementById(`row-${selectedNik}`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.add("bg-yellow-100");

      // hapus highlight kuning setelah 1.8 detik
      const highlightTimer = setTimeout(() => {
        row.classList.remove("bg-yellow-100");
      }, 1800);

      // cleanup highlight timer kalau komponen unmount / selectedNik berubah cepat
      return () => clearTimeout(highlightTimer);
    } else {
      console.warn("⚠️ Row tidak ditemukan untuk scroll:", selectedNik);
    }
  }, 100); // delay 100ms cukup aman

  // cleanup timer scroll
  return () => clearTimeout(scrollTimer);
}, [selectedNik, penduduk]);



  return (
    <div className="max-w-full mx-auto relative">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Data Penduduk</h1>
      </div>

      {/* HEADER / ACTION BAR */}
<div className="bg-white border-b-4 border-green-600 shadow-sm rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 sticky top-0 z-40 relative">
  {/* Judul */}
  <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
  <img 
    src="/bireuen.png" 
    alt="Data Penduduk" 
    className="w-8 h-8 object-contain"
  />
  BUGAK KRUENG
</h2>


  {/* Action buttons */}
  <div className="flex flex-wrap gap-2">
    {/* Tambah */}
    <button
      onClick={handleTambahData}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm flex items-center gap-2"
    >
      <Plus size={18} /> Tambah
    </button>

    {/* Filter */}
    <button
      id="filterToggleBtn"
      onClick={() => setIsFilterGroupVisible(!isFilterGroupVisible)}
      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
    >
      <Filter size={18} /> Filter
    </button>


<button
  type="button"
  onClick={resetSemuaFilter}
  disabled={!adaFilterAktif}
  className={`flex items-center justify-center px-3 py-2 rounded-lg border transition
    ${adaFilterAktif
      ? "border-gray-300 hover:bg-gray-100 cursor-pointer"
      : "border-gray-200 opacity-40 cursor-not-allowed"}`}
  title="Reset Filter"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-6 h-6"
  >
    {/* corong filter (outline) */}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 4h18l-6.5 8v6l-5 3v-9L3 4z"
    />
    {/* silang dinamis */}
    <path
      d="M15.5 2.5l6 6m0-6l-6 6"
      stroke={adaFilterAktif ? "red" : "#9CA3AF"} // abu-abu kalau nonaktif
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
</button>



<div className="flex items-center gap-3">
  {/* Export Dropdown */}
  <div
    className="relative"
    tabIndex={0} // supaya bisa terima fokus
    onBlur={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        setIsExportMenuOpen(false);
      }
    }}
  >
    <div className="flex items-center gap-3">
  {/* Export Dropdown */}
  <div
    className="relative"
    tabIndex={0} // supaya bisa terima fokus
    onBlur={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        setIsExportMenuOpen(false);
      }
    }}
  >
    <button
      type="button" // ✅ cegah reload form
      onClick={() => setIsExportMenuOpen((prev) => !prev)}
      className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition flex items-center gap-2"
    >
      <Download size={18} /> Export ▼
    </button>

    {isExportMenuOpen && (
      <div className="absolute left-0 mt-2 w-48 bg-white text-gray-700 border border-gray-200 rounded shadow-lg z-50">
        {/* ✅ Export */}
        <button
          type="button" // ✅ cegah reload
          onClick={() => {
            eksporExcel();
            setIsExportMenuOpen(false);
          }}
          className="block w-full px-4 py-2 text-left hover:bg-green-50 text-green-700"
        >
          Export Excel
        </button>

        {/* ✅ Import */}


        <div>
      <button className="block w-full px-4 py-2 text-left hover:bg-yellow-50 text-yellow-700 cursor-pointer" onClick={openFileInputPopup}>
        Import Excel
      </button>

      {/* elemen lain di sini */}
    </div>
   





        {/* ✅ Delete */}
        <button
          type="button" // ✅ cegah reload
          onClick={() => {
            hapusSemuaData();
            setIsExportMenuOpen(false);
          }}
          className="block w-full px-4 py-2 text-left hover:bg-red-50 text-red-700"
        >
          Delete Database
        </button>
      </div>
    )}
  </div>
</div>
</div>

  {/* Notifikasi Daftar Hantu */}
{/* Notifikasi Daftar Hantu */}
<button
  onClick={lihatDaftarHantu}
  className="relative hover:text-yellow-300 transition"
  title="Lihat daftar hantu"
  style={{ fontSize: "20px" }}
>
  🔔
  {jumlahHantu > 0 && (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
      {jumlahHantu}
    </span>
  )}
</button>


</div>
  </div>


  {/* Info Filter */}
  <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium shadow-sm">
    <InfoFilter 
  jumlah={modeInfo === "filter" ? jumlahFilter : jumlahTotal} 
  mode={modeInfo} 
/>

  </div>

 {/* Overlay gelap */}
  {isFilterGroupVisible && (
    <div
      onClick={() => setIsFilterGroupVisible(false)}
      className="fixed inset-0 bg-black bg-opacity-20 z-40"
    ></div>
  )}

  {/* Popup Filter */}
<div
  id="filterGroup"
  className={`absolute left-0 right-0 top-full mt-1 z-50 bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow-2xl p-6
              grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4
              transition-all duration-400 ease-in-out origin-top transform
              ${isFilterGroupVisible 
                ? "opacity-100 scale-100 visible" 
                : "opacity-0 scale-90 invisible"}`}
>
  {/* Cari Nama */}
  <input
    id="cariNama"
    type="text"
    placeholder="Cari Nama..."
    className="border border-gray-300 p-2 rounded w-full"
    value={draftCariNama}
    onChange={(e) => setDraftCariNama(e.target.value)}
  />

  {/* Nomor KK */}
  <input
    type="text"
    id="filterKK"
    placeholder="Nomor KK"
    className="border border-gray-300 p-2 rounded w-full"
    value={draftFilterKK}
    onChange={(e) => setDraftFilterKK(e.target.value)}
  />

  {/* Dusun */}
{/* Dusun */}
<select
  id="filterDusun"
  className={`border border-gray-300 p-2 rounded w-full ${draftFilterDusun ? "text-gray-800" : "text-gray-400"}`}
  value={draftFilterDusun}
  onChange={(e) => setDraftFilterDusun(e.target.value)}
>
  <option value="">Alamat Dusun</option>
  {/* isiDropdownsOtomatis */}
</select>




  {/* Status */}
  <select
  id="filterStatus"
  value={draftFilterStatus}
  onChange={(e) => setDraftFilterStatus(e.target.value)}
  className={`border border-gray-300 p-2 rounded w-full ${draftFilterStatus ? "text-gray-800" : "text-gray-400"}`}
>
  <option value="">Status Perkawinan</option>
  <option value="Sudah Kawin">Sudah Kawin</option>
  <option value="Belum Kawin">Belum Kawin</option>
  <option value="Pernah Kawin">Pernah Kawin</option>
</select>
       

  {/* Gender */}
  <select
  id="filterJK"
  value={draftFilterJK}
  onChange={(e) => setDraftFilterJK(e.target.value)}
  className={`border border-gray-300 p-2 rounded w-full ${draftFilterJK ? "text-gray-800" : "text-gray-400"}`}
>
  <option value="">Jenis Kelamin</option>
  <option value="Laki-laki">Laki-laki</option>
  <option value="Perempuan">Perempuan</option>
</select>


  {/* Umur Min */}
  <input
    id="umurMin"
    type="number"
    placeholder="Umur Min"
    className="border border-gray-300 p-2 rounded w-full"
    value={draftUmurMin}
    onChange={(e) => setDraftUmurMin(e.target.value)}
  />

  {/* Umur Max */}
  <input
    id="umurMax"
    type="number"
    placeholder="Umur Max"
    className="border border-gray-300 p-2 rounded w-full"
    value={draftUmurMax}
    onChange={(e) => setDraftUmurMax(e.target.value)}
  />

{/* Pekerjaan */}
<select
  id="filterPekerjaan"
  value={draftFilterPekerjaan}
  onChange={(e) => setDraftFilterPekerjaan(e.target.value)}
  className={`border border-gray-300 p-2 rounded w-full ${draftFilterPekerjaan ? "text-gray-800" : "text-gray-400"}`}
>
  <option value="">Pekerjaan</option>
  {/* isiDropdownsOtomatis */}
</select>


{/* Pendidikan */}
<select
  id="filterPendidikan"
  className="border border-gray-300 p-2 rounded w-full"
  value={draftFilterPendidikan}
  onChange={(e) => setDraftFilterPendidikan(e.target.value)}
>
  <option value="">Pendidikan</option>
  {/* isiDropdownsOtomatis */}
</select>


{/* Hubungan Keluarga */}
<select
  id="filterHubunganKeluarga"
  className="border border-gray-300 p-2 rounded w-full"
  value={draftFilterHubunganKeluarga}
  onChange={(e) => setDraftFilterHubunganKeluarga(e.target.value)}
>
  <option value="">Hubungan Keluarga</option>
  <option value="Kepala Keluarga">Kepala Keluarga</option>
  <option value="Istri">Istri</option>
  <option value="Anak">Anak</option>
  <option value="Famili Lain">Famili Lain</option>
</select>

{/* Status Yatim */}
<select
  id="filterYatim"
  value={draftFilterYatim}
  onChange={(e) => setDraftFilterYatim(e.target.value)}
  className="border border-gray-300 p-2 rounded w-full"
>
  <option value="">Status Ekonomi</option>
  <option value="Yatim">Yatim</option>
  <option value="Piatu">Piatu</option>
  <option value="Yatim Piatu">Yatim Piatu</option>
</select>



{/* Kategori Ekonomi */}
<select
  value={draftFilterEkonomi}
  onChange={(e) => setDraftFilterEkonomi(e.target.value)}
  className="w-full p-2 border rounded"
  style={{ color: draftFilterEkonomi ? "#1f2937" : "#9CA3AF" }}
>
  <option value="" style={{ color: "#9CA3AF" }}>Kategori Ekonomi</option>
  <option value="Sangat Miskin" style={{ color: "#1f2937" }}>Sangat Miskin</option>
  <option value="Miskin" style={{ color: "#1f2937" }}>Miskin</option>
  <option value="Kurang Mampu" style={{ color: "#1f2937" }}>Kurang Mampu</option>
  <option value="Mampu" style={{ color: "#1f2937" }}>Mampu</option>
  <option value="Kaya" style={{ color: "#1f2937" }}>Kaya</option>
  <option value="Sangat Kaya" style={{ color: "#1f2937" }}>Sangat Kaya</option>
</select>



{/* Kategori Mengaji */}
<select
  value={draftFilterKategoriMengaji}
  onChange={(e) => setDraftFilterKategoriMengaji(e.target.value)}
  className="w-full p-2 border rounded"
  style={{ color: draftFilterKategoriMengaji ? "#1f2937" : "#9CA3AF" }}
>
  <option value="" style={{ color: "#9CA3AF" }}>Kategori Mengaji</option>
  <option value="Ngaji Lokal" style={{ color: "#1f2937" }}>Ngaji Lokal</option>
  <option value="Ngaji Luar" style={{ color: "#1f2937" }}>Ngaji Luar</option>
  <option value="Guru Ngaji" style={{ color: "#1f2937" }}>Guru Ngaji</option>
</select>





{/* Lokasi Mengaji */}
<select
  value={draftFilterLokasiMengaji}
  onChange={(e) => setDraftFilterLokasiMengaji(e.target.value)}
  className="w-full p-2 border rounded"
  style={{ color: draftFilterLokasiMengaji ? "#1f2937" : "#9CA3AF" }}
>
  <option value="" style={{ color: "#9CA3AF" }}>Lokasi Mengaji</option>
  {lokasiMengajiList.map((lokasi, i) => (
    <option key={i} value={lokasi} style={{ color: "#1f2937" }}>
      {lokasi}
    </option>
  ))}
</select>





{/* Kategori Usia */}
<select
  value={draftFilterUsia}
  onChange={(e) => setDraftFilterUsia(e.target.value)}
  className="w-full p-2 border rounded"
  style={{ color: draftFilterUsia ? "#1f2937" : "#9CA3AF" }}
>
  <option value="" style={{ color: "#9CA3AF" }}>Kategori Usia</option>
  <option value="anak" style={{ color: "#1f2937" }}>Anak-anak</option>
  <option value="remaja" style={{ color: "#1f2937" }}>Remaja</option>
  <option value="dewasa" style={{ color: "#1f2937" }}>Dewasa</option>
  <option value="lansia" style={{ color: "#1f2937" }}>Lansia</option>
  <option value="produktif" style={{ color: "#1f2937" }}>Produktif</option>
  <option value="non-produktif" style={{ color: "#1f2937" }}>Non-Produktif</option>
</select>



{/* Komponen MultiSelectBantuan_Sosial */}
<div className="mb-3">
  <MultiSelectBantuan
    options={opsiBantuan}
    selected={draftFilterBantuan}
    onChange={setDraftFilterBantuan}
  />
</div>


  {/* Tombol Aksi */}
  <div className="flex gap-2 col-span-full sm:col-span-2">
    <button
      id="filterBtn"
      onClick={applyFilters}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full sm:w-auto"
    >
      Terapkan
    </button>

   <button
  id="resetBtn"
  type="button"
  onClick={() => {
    // kosongkan state utama
    setCariNama('');
    setFilterKK('');
    setFilterDusun('');
    setFilterStatus('');
    setFilterPekerjaan('');
    setFilterPendidikan('');
    setFilterJK('');
    setFilterHubunganKeluarga('');
    setUmurMin('');
    setUmurMax('');
    setFilterYatim('');
    setFilterEkonomi('');
    setFilterKategoriMengaji('');
    setFilterLokasiMengaji('');
    setFilterUsia('');
    setFilterBantuan([]);

    // kosongkan draft filter
    setDraftCariNama('');
    setDraftFilterKK('');
    setDraftFilterDusun('');
    setDraftFilterStatus('');
    setDraftFilterPekerjaan('');
    setDraftFilterPendidikan('');
    setDraftFilterJK('');
    setDraftFilterHubunganKeluarga('');
    setDraftUmurMin('');
    setDraftUmurMax('');
    setDraftFilterYatim('');
    setDraftFilterEkonomi('');
    setDraftFilterKategoriMengaji('');
    setDraftFilterLokasiMengaji('');
    setDraftFilterUsia('');
    setDraftFilterBantuan([]);

    // 🔹 panggil ambilDataPenduduk tanpa filter
    ambilDataPenduduk(
      1,    // page
      false, // modeEkspor
      "",    // cariNama
      "",    // KK
      "",    // Dusun
      "",    // Status
      "",    // Pekerjaan
      "",    // Pendidikan
      "",    // JenisKelamin
      "",    // HubunganKeluarga
      "",    // UmurMin
      "",    // UmurMax
      false, // showNotif
      "",    // Yatim
      "",    // Ekonomi
      "",    // KategoriMengaji
      "",    // LokasiMengaji
      ""     // Usia
    );

    // ⚠️ jangan close popup lagi
    // setIsFilterGroupVisible(false);
  }}
  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded w-full sm:w-auto"
>
  Reset
</button>

  </div>
</div>
</div>
   

      {/* START: Container baru untuk menyejajarkan kolom */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Kolom utama (tabel data penduduk) */}
        <div className="flex-grow overflow-x-auto bg-white rounded shadow">
          <table className="w-full text-sm border border-gray-200 border-t rounded-lg overflow-hidden">
            <thead className="bg-white rounded-t-lg shadow divide-y text-gray-800 text-center" style={{ height: '3.5rem' }}>
              <tr>
                <th className="p-2 text-center ml-12">&nbsp;&nbsp; NO </th>
                <th className="p-2 text-center">NIK</th>
                <th className="p-2 text-center">NAMA</th>
                <th className="p-2 text-center">TANGGAL LAHIR</th>
                <th className="p-2 text-center">DUSUN</th>
                <th className="p-2 text-center">TINDAKAN</th>
              </tr>
            </thead>
            <tbody id="data-body" className="divide-y divide-gray-100">
              {loading ? (
  <tr>
    <td colSpan="6" className="p-6 text-center">
      <div className="flex flex-col items-center justify-center gap-3">
        {/* Ikon animasi */}
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>

        {/* Teks animasi */}
        <span className="text-gray-600 font-medium animate-pulse">
          Memuat data...
        </span>
      </div>
    </td>
  </tr>
) 
 : penduduk.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                penduduk.map((p, i) => (
                  <tr
  id={`row-${p.nik}`}
  key={p.nik}
  data-kk={p.kk || ''}
  data-nik={p.nik || ''}
  onClick={() => { setSelectedNik(String(p.nik)); tampilkanAnggotaKeluarga(p.kk, p.nik); }}
  className={`${(p.req_delete || '').toLowerCase() === 'true'
    ? 'text-red-600 font-semibold bg-red-50'
    : ''} cursor-pointer ${selectedNik === String(p.nik) ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
>


                    <td className="p-2 text-center">{(currentPage - 1) * 20 + i + 1}</td>
                    <td className="p-2 text-center">{p.nik || ''}</td>
                    <td className="p-2">{p.nama || ''}</td>
                    <td className="p-2 text-center">{formatTanggalIndo(p.tanggal_lahir) || ''}</td>
                    <td className="p-2 text-center">{p.alamat_dusun || ''}</td>
                    <td className="p-3 flex gap-3 justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                        className="flex items-center gap-0 bg-yellow-500 hover:bg-yellow-600 text-black px-1 py-1 rounded text-xs sm:text-sm transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                          <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                          <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleHapus(p.nik); }}
                        className="flex items-center gap-0 bg-red-500 hover:bg-red-600 text-white px-1 py-1 rounded text-xs sm:text-sm transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-3 h-3 sm:w-4 sm:h-4">
                          <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375Z" />
                          <path fillRule="evenodd"
                            d="m3.087 9 .54 9.176A3 3 0 0 0 6.62 21h10.757a3 3 0 0 0 2.995-2.824L20.913 9H3.087Zm6.133 2.845a.75.75 0 0 1 1.06 0l1.72 1.72 1.72-1.72a.75.75 0 1 1 1.06 1.06l-1.72 1.72 1.72 1.72a.75.75 0 1 1 -1.06 1.06L12 15.685l-1.72 1.72a.75.75 0 1 1 -1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 0 1 0-1.06Z"
                            clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
           {/* ✅ Tambahkan pagination di bawah tabel */}
  <div className="mt-4 flex justify-center gap-2 ml-2 mb-4">
    {renderPagination()}
        </div>
    </div>



       {/* Kolom 2 (Anggota & Detail Keluarga) */}
<div className="w-full lg:w-1/3 flex flex-col gap-4">
  {(() => {
    let kategori = null;
    let adaKepala = false;

    // ✅ Cari Kepala Keluarga
    const kepala = anggotaKeluarga.find(
      (a) => a.hubungan_keluarga === "Kepala Keluarga"
    );
    if (kepala) {
      adaKepala = true;
      if (kepala.miskin_sangat) {
        kategori = kepala.miskin_sangat;
      }
    }

    // 🎨 Tentukan warna background
    let warnaHeader = "bg-slate-300 text-gray-900"; // default
   if (kepala) {
  if (kategori === "Sangat Miskin") warnaHeader = "bg-[#E53935] text-white";
  else if (kategori === "Miskin") warnaHeader = "bg-[#ff6600] text-white";
  else if (kategori === "Kurang Mampu") warnaHeader = "bg-[#ffc800] text-white";
  else if (kategori === "Mampu") warnaHeader = "bg-[#43A047] text-white";
  else if (kategori === "Kaya") warnaHeader = "bg-[#00B4D8] text-white";
  else if (kategori === "Sangat Kaya") warnaHeader = "bg-[#9e4ecc] text-white";
  else warnaHeader = "bg-slate-300 text-gray-900";
}

    return (
      <div className="bg-white rounded shadow">
        {/* Header */}
        <div
          className={`flex justify-between items-center px-4 py-3 rounded-t ${warnaHeader}`}
        >
          <div className="font-bold flex items-center gap-2">
            {kepala ? (
              kategori ? (
  <>
     <svg
    xmlns="http://www.w3.org/2000/svg"
    height="30px"
    viewBox="0 -960 960 960"
    width="30px"
    fill="currentColor"
    className="inline-block text-white"
  >
    <path d="M240-320q-33 0-56.5-23.5T160-400q0-33 23.5-56.5T240-480q33 0 56.5 23.5T320-400q0 33-23.5 56.5T240-320Zm480 0q-33 0-56.5-23.5T640-400q0-33 23.5-56.5T720-480q33 0 56.5 23.5T800-400q0 33-23.5 56.5T720-320Zm-240-40q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM284-120q14-69 68.5-114.5T480-280q73 0 127.5 45.5T676-120H284Zm-204 0q0-66 47-113t113-47q17 0 32 3t29 9q-30 29-50 66.5T224-120H80Zm656 0q-7-44-27-81.5T659-268q14-6 29-9t32-3q66 0 113 47t47 113H736ZM88-480l-48-64 440-336 160 122v-82h120v174l160 122-48 64-392-299L88-480Z" />
  </svg>
    <span className="ml-2">Kategori Keluarga</span>
    <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-300 text-black">
      {kategori}
                  </span>
                </>
              ) : (
                <>
                 <svg
    xmlns="http://www.w3.org/2000/svg"
    height="30px"
    viewBox="0 -960 960 960"
    width="30px"
    fill="black"
    className="inline-block text-white"
  >
    <path d="M240-320q-33 0-56.5-23.5T160-400q0-33 23.5-56.5T240-480q33 0 56.5 23.5T320-400q0 33-23.5 56.5T240-320Zm480 0q-33 0-56.5-23.5T640-400q0-33 23.5-56.5T720-480q33 0 56.5 23.5T800-400q0 33-23.5 56.5T720-320Zm-240-40q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM284-120q14-69 68.5-114.5T480-280q73 0 127.5 45.5T676-120H284Zm-204 0q0-66 47-113t113-47q17 0 32 3t29 9q-30 29-50 66.5T224-120H80Zm656 0q-7-44-27-81.5T659-268q14-6 29-9t32-3q66 0 113 47t47 113H736ZM88-480l-48-64 440-336 160 122v-82h120v174l160 122-48 64-392-299L88-480Z" />
  </svg>
    <span className="ml-2">Status Ekonomi belum dipilih!</span>
    <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-300 text-black">
                    
                  </span>
                </>
              )
            ) : (
              <>
               <svg
    xmlns="http://www.w3.org/2000/svg"
    height="30px"
    viewBox="0 -960 960 960"
    width="30px"
    fill="black"
    className="inline-block text-white"
  >
    <path d="M240-320q-33 0-56.5-23.5T160-400q0-33 23.5-56.5T240-480q33 0 56.5 23.5T320-400q0 33-23.5 56.5T240-320Zm480 0q-33 0-56.5-23.5T640-400q0-33 23.5-56.5T720-480q33 0 56.5 23.5T800-400q0 33-23.5 56.5T720-320Zm-240-40q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM284-120q14-69 68.5-114.5T480-280q73 0 127.5 45.5T676-120H284Zm-204 0q0-66 47-113t113-47q17 0 32 3t29 9q-30 29-50 66.5T224-120H80Zm656 0q-7-44-27-81.5T659-268q14-6 29-9t32-3q66 0 113 47t47 113H736ZM88-480l-48-64 440-336 160 122v-82h120v174l160 122-48 64-392-299L88-480Z" />
  </svg>
    <span className="ml-2">Belum ada Kepala Keluarga !</span>
    <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-300 text-black">
                  
                </span>
              </>
            )}
          </div>

          {/* 🔄 Tombol Reload */}
          {kepala && anggotaKeluarga.length > 0 && (
           <button
  onClick={() => tampilkanAnggotaKeluarga(kepala.kk)}
  className="p-2 rounded-full bg-white text-gray-600 hover:bg-green-100 hover:text-green-600 shadow transition duration-200"
  title="Reload Data"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    className="w-5 h-5"
  >
    <path
      fillRule="evenodd"
      d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z"
      clipRule="evenodd"
    />
  </svg>
</button>

          )}
        </div>

        {/* Isi daftar */}
        <div className="px-3 py-4">
          <ul
            id="listKeluarga"
            className="text-sm text-gray-700 min-h-[4rem] max-h-64 overflow-y-auto divide-y"
          >
            {anggotaKeluarga.length === 0 ? (
              <li className="text-gray-400 px-2 py-1">
                Tidak ada anggota keluarga
              </li>
            ) : (
              anggotaKeluarga.map((anggota) => {
                let warna = "bg-gray-400";
                if (anggota.miskin_sangat === "Sangat Miskin") warna = "bg-red-700";
                else if (anggota.miskin_sangat === "Miskin") warna = "bg-red-500";
                else if (anggota.miskin_sangat === "Kurang Mampu") warna = "bg-orange-300";
                else if (anggota.miskin_sangat === "Mampu") warna = "bg-yellow-400";
                else if (anggota.miskin_sangat === "Kaya") warna = "bg-green-500";
                else if (anggota.miskin_sangat === "Sangat Kaya") warna = "bg-blue-500";

                return (
                  <li
                    key={anggota.nik}
                    className={`flex justify-between items-center cursor-pointer hover:text-blue-600 px-2 py-1 ${
                      String(detailAnggota?.nik) === String(anggota.nik)
                        ? "font-bold text-blue-700 bg-white-50"
                        : ""
                    }`}
                    onClick={() => pilihKeluarga(anggota)}
                  >
                    <span>{anggota.nama}</span>
                    <span
                      title={anggota.miskin_sangat || "Tidak ada data"}
                      className={`w-4 h-4 rounded-full inline-block ${warnaBadge(
                        anggota.miskin_sangat
                      )}`}
                    ></span>
                  </li>
                );
              })
            )}
          </ul>

          {/* ➕ Tombol + Anggota Baru dipindahkan ke bawah card */}
          {kepala && (
            <div className="mt-4">
              <button
                onClick={() =>
                  handleTambahData({
                    kk: kepala.kk,
                    alamat_dusun: kepala.alamat_dusun,
                    miskin_sangat: kepala.miskin_sangat,
                    kode_desa: kepala.kode_desa,
                    desa: kepala.desa,
                  })
                }
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md shadow text-sm"
              >
                + Anggota Baru
              </button>
            </div>
          )}
        </div>
      </div>
    );
  })()}

{/* Form Bantuan Sosial */}
<div className="mb-1 mt-0 border rounded-lg bg-white shadow-sm overflow-hidden">
  {/* Isi panel */}
  <div className="p-3">
    <div className="flex flex-wrap gap-2">
      {(() => {
        const kk = anggotaKeluarga?.find(
          (a) =>
            a.hubungan_keluarga &&
            a.hubungan_keluarga.toLowerCase() === "kepala keluarga"
        );

        const bantuanRaw = kk?.bantuan_sosial || "";

        const bantuanList = Array.isArray(bantuanRaw)
          ? bantuanRaw
          : String(bantuanRaw)
              .split(",")
              .map((b) => b.trim())
              .filter((b) => b !== "");

        // daftar warna (bisa ditambah sampai 20 sesuai kebutuhan)
        const colors = [
          "bg-blue-100 text-blue-800",
          "bg-green-100 text-green-800",
          "bg-yellow-100 text-yellow-800",
          "bg-purple-100 text-purple-800",
          "bg-pink-100 text-pink-800",
          "bg-red-100 text-red-800",
          "bg-indigo-100 text-indigo-800",
          "bg-teal-100 text-teal-800",
          "bg-orange-100 text-orange-800",
          "bg-cyan-100 text-cyan-800",
          "bg-emerald-100 text-emerald-800",
          "bg-fuchsia-100 text-fuchsia-800",
          "bg-lime-100 text-lime-800",
          "bg-rose-100 text-rose-800",
          "bg-sky-100 text-sky-800",
          "bg-violet-100 text-violet-800",
          "bg-amber-100 text-amber-800",
          "bg-stone-100 text-stone-800",
          "bg-slate-100 text-slate-800",
          "bg-neutral-100 text-neutral-800",
        ];

        return bantuanList.length > 0 ? (
          bantuanList.map((bantuan, idx) => {
            const colorClass = colors[idx % colors.length]; // konsisten per urutan
            return (
              <span
                key={idx}
                className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}
              >
                {bantuan}
              </span>
            );
          })
        ) : (
          <span className="text-gray-400 italic text-sm">
            Tidak ada data bantuan
          </span>
        );
      })()}
    </div>
  </div>
</div>




{/* Kotak Detail Anggota */}
<div className="bg-white rounded-xl shadow-md border border-gray-200">
  {/* Header */}
  <div className="flex justify-between items-center px-4 py-3 border-b-2 border-blue-500">
    <h3 className="font-bold text-lg text-gray-700 flex items-center gap-2">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    className="w-6 h-6 text-gray-700"
    fill="currentColor"
    aria-hidden="true"
    role="img"
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.33 0-8 1.67-8 5v1h16v-1c0-3.33-4.67-5-8-5z" />
  </svg>
  <span>Detail</span>
</h3>

    {detailAnggota && (
      <div className="space-x-2">
       <div className="flex gap-2">
  {/* Tombol Edit */}
  <button
    onClick={() => handleEdit(detailAnggota)}
    className="flex items-center gap-2 px-4 py-1 h-7 text-sm rounded-md bg-blue-400 text-white hover:bg-blue-600 shadow-sm transition"
  >
    {/* Icon Pencil (edit) */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.651 1.65a2 2 0 010 2.829l-9.193 9.192a4 4 0 01-1.632.96l-3.234.97.97-3.234a4 4 0 01.96-1.632l9.192-9.193a2 2 0 012.829 0z" />
    </svg>
    <span>Edit</span>
  </button>

  {/* Tombol Hapus */}
  <button
    onClick={() => handleHapus(detailAnggota.nik)}
    className="flex items-center gap-2 px-4 py-1.5 h-7 text-sm rounded-md bg-red-400 text-white hover:bg-red-600 shadow-sm transition"
  >
    {/* Icon Trash (hapus) */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h10" />
    </svg>
    <span>Hapus</span>
  </button>
</div>

      </div>
    )}
  </div>

  {/* Isi detail */}
  <div id="detailAnggotaKeluarga" className="text-sm text-gray-700">
    {detailAnggota ? (
      <table className="w-full border-collapse" style={{ marginTop: "10px", marginBottom: "15px" }}>
  <tbody>
   {[
  ["Nama", detailAnggota.nama],
  ["NIK", detailAnggota.nik],
  ["No. KK", detailAnggota.kk],
  ["Tempat Lahir", detailAnggota.tempat_lahir],
  ["Tanggal Lahir", formatTanggalIndo(detailAnggota.tanggal_lahir)],
  ["Jenis Kelamin",
    detailAnggota.jenis_kelamin === "L" ? "Laki-laki" :
    detailAnggota.jenis_kelamin === "P" ? "Perempuan" : "-"
  ],
  ["Status Pernikahan",
    detailAnggota.status === "S" ? "Sudah Kawin" :
    detailAnggota.status === "B" ? "Belum Kawin" :
    detailAnggota.status === "P" ? "Pernah Kawin" : "-"
  ],
  ["Pekerjaan", detailAnggota.pekerjaan],
  ["Pendidikan", detailAnggota.pendidikan],
  ["Hubungan Keluarga", detailAnggota.hubungan_keluarga],
  ["Status Rumah", detailAnggota.status_rumah],
  ["Dusun", detailAnggota.alamat_dusun],
  ["Desa", detailAnggota.desa],
  ["Status Yatim/Piatu", detailAnggota.yatim_piatu],
  ["Kategori Mengaji", detailAnggota.kategori_mengaji],
  ["Lokasi Mengaji", detailAnggota.lokasi_mengaji],
  ["Kondisi Ekonomi", detailAnggota.miskin_sangat],
  ["Jumlah Usia", hitungUsia(detailAnggota.tanggal_lahir)],
  ["Kategori Usia", kategoriProduktif(detailAnggota.tanggal_lahir)],
].map(([label, value], i) => (
  <tr key={i} className="border-b last:border-none">
    <td className="px-3 py-1 text-gray-500" style={{ width: "37%" }}>
      {label}
    </td>
    <td
      className={`px-3 py-1 ${
        label === "Nama"
          ? "font-bold text-blue-700 text-sm"
          : "font-medium text-gray-800"
      }`}
      style={{ width: "63%" }}
    >
      {value || "-"}
    </td>
  </tr>
))}
  </tbody>
</table>

    ) : (
      <p className="italic text-gray-500 p-4">
        Pilih anggota keluarga untuk melihat detail.
      </p>
    )}
  </div>
</div>

        </div>
      </div>
    </div>
  );




  



}  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< PENUTUP BATAS FUNCTION UTAMA









// -----------------------------
// Helper umur / kategori (single source of truth)
// -----------------------------
function parseTanggalFlexible(tanggal) {
  if (!tanggal) return null;
  if (typeof tanggal !== "string") return null;

  // format dd/mm/yyyy
  if (tanggal.includes("/")) {
    const parts = tanggal.split("/");
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    return new Date(`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`);
  }

  // format yyyy-mm-dd atau ISO
  const d = new Date(tanggal);
  return isNaN(d.getTime()) ? null : d;
}

function getAgeYears(tanggalLahir) {
  const lahir = parseTanggalFlexible(tanggalLahir);
  if (!lahir) return NaN;
  const today = new Date();
  let umur = today.getFullYear() - lahir.getFullYear();
  const m = today.getMonth() - lahir.getMonth();
  const dd = today.getDate() - lahir.getDate();
  if (m < 0 || (m === 0 && dd < 0)) umur--;
  return umur;
}

function getAgeDecimalOne(tanggalLahir) {
  const lahir = parseTanggalFlexible(tanggalLahir);
  if (!lahir) return NaN;
  const today = new Date();
  let tahun = today.getFullYear() - lahir.getFullYear();
  let bulan = today.getMonth() - lahir.getMonth();
  let hari = today.getDate() - lahir.getDate();
  if (hari < 0) bulan--;
  if (bulan < 0) { tahun--; bulan += 12; }
  return Number((tahun + bulan/12).toFixed(1)); // ex: 12.9
}

function getAgeCategoryFromYears(years) {
  if (isNaN(years)) return "-";
  if (years < 5) return "Balita";
  if (years <= 14) return "Anak-anak";
  if (years <= 24) return "Remaja";
  if (years <= 59) return "Dewasa";
  return "Lansia";
}

// fungsi utama untuk UI detail
function hitungUsia(tanggalLahir) {
  const dec = getAgeDecimalOne(tanggalLahir);
  const years = getAgeYears(tanggalLahir);
  const kategori = getAgeCategoryFromYears(years);
  if (isNaN(dec) || isNaN(years)) return "—";
  return `${dec} Tahun (${kategori})`;
}




const kategoriProduktif = (tanggalLahir) => {
  if (!tanggalLahir) return "-";
  let lahir;
  if (tanggalLahir.includes("/")) {
    const [d, m, y] = tanggalLahir.split("/");
    lahir = new Date(`${y}-${m}-${d}`);
  } else if (tanggalLahir.includes("-")) {
    lahir = new Date(tanggalLahir);
  } else {
    return "-";
  }
  if (isNaN(lahir.getTime())) return "-";
  const today = new Date();
  let usia = today.getFullYear() - lahir.getFullYear();
  const bulan = today.getMonth() - lahir.getMonth();
  if (bulan < 0 || (bulan === 0 && today.getDate() < lahir.getDate())) {
    usia--;
  }
  return usia >= 15 && usia <= 64 ? "Produktif" : "Non-Produktif";
};



function parseTanggalToISO(tgl) {
  if (!tgl) return null;
  const parts = tgl.split("/");
  if (parts.length !== 3) return null;

  const [d, m, y] = parts;
  if (!d || !m || !y) return null;

  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

//------------
const popupCrudDusun = async (selectId) => {
  // 🔹 Helper: isi dropdown dusun
  const isiDropdownDusun = async (selected = "") => {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
      const res = await fetch("/api/lokasidusun");
      const hasil = await res.json();

      select.innerHTML = `<option value="">--Pilih Dusun--</option>`;
      (hasil.data || []).forEach((dusun) => {
        const opt = document.createElement("option");
        opt.value = dusun;
        opt.textContent = dusun;
        if (dusun === selected) opt.selected = true;
        select.appendChild(opt);
      });
    } catch (err) {
      console.error("❌ Gagal ambil dusun:", err);
      select.innerHTML = `<option value="">Gagal ambil data</option>`;
    }
  };

  // 🔹 Helper overlay form
  const showOverlayForm = (title, defaultValue, onSubmit) => {
    const overlay = document.getElementById("dusun-overlay");
    const content = document.getElementById("overlay-content");
    content.innerHTML = `
      <h2 class="text-lg font-bold mb-2">${title}</h2>
      <input id="dusun-input" type="text" value="${defaultValue}" class="w-full p-2 border rounded mb-3" />
      <div class="flex justify-end gap-2">
        <button class="px-3 py-1 bg-gray-400 text-white rounded" onclick="hideOverlay()">Batal</button>
        <button class="px-3 py-1 bg-blue-600 text-white rounded" onclick="submitOverlay()">Simpan</button>
      </div>
    `;
    window.submitOverlay = async () => {
      const val = document.getElementById("dusun-input").value.trim();
      if (val) {
        await onSubmit(val);
        hideOverlay();
      }
    };
    overlay.classList.remove("hidden");
  };

  // 🔹 Helper overlay konfirmasi
  const showOverlayConfirm = (message, onConfirm) => {
    const overlay = document.getElementById("dusun-overlay");
    const content = document.getElementById("overlay-content");
    content.innerHTML = `
      <h2 class="text-lg font-bold mb-4">${message}</h2>
      <div class="flex justify-end gap-2">
        <button class="px-3 py-1 bg-gray-400 text-white rounded" onclick="hideOverlay()">Batal</button>
        <button class="px-3 py-1 bg-red-600 text-white rounded" onclick="confirmOverlay()">Hapus</button>
      </div>
    `;
    window.confirmOverlay = async () => {
      await onConfirm();
      hideOverlay();
    };
    overlay.classList.remove("hidden");
  };

  // 🔹 Helper tutup overlay
  window.hideOverlay = () => {
    document.getElementById("dusun-overlay").classList.add("hidden");
  };

  // 🔹 Render popup utama
  const renderPopup = async () => {
    const res = await fetch("/api/lokasidusun");
    const hasil = await res.json();
    const data = hasil.data || [];

    let html = `
      <div id="dusun-wrapper" class="relative">
        <div class="overflow-x-auto max-h-64">
          <table class="w-full text-sm text-left border border-gray-200">
            <thead>
              <tr class="bg-gray-100">
                <th class="px-4 py-2">#</th>
                <th class="px-4 py-2">Nama Dusun</th>
                <th class="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
    `;

    data.forEach((dusun, i) => {
      html += `
        <tr>
          <td class="border px-4 py-2">${i + 1}</td>
          <td class="border px-4 py-2">${dusun}</td>
          <td class="border px-4 py-2 flex gap-2">
            <button class="px-2 py-1 text-xs bg-yellow-500 text-white rounded"
              onclick="window.overlayEditDusun('${dusun}')">✏️ Edit</button>
            <button class="px-2 py-1 text-xs bg-red-600 text-white rounded"
              onclick="window.overlayDeleteDusun('${dusun}')">🗑 Hapus</button>
          </td>
        </tr>`;
    });

    html += `
            </tbody>
          </table>
        </div>
        <div class="mt-4 text-right">
          <button id="btnTambahDusun" class="px-3 py-1 bg-green-600 text-white rounded">➕ Tambah Dusun</button>
        </div>

        <!-- Overlay -->
        <div id="dusun-overlay" class="hidden absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div id="overlay-content" class="bg-white p-4 rounded shadow-lg w-96"></div>
        </div>
      </div>
    `;

    await Swal.fire({
      title: "Kelola Dusun",
      html,
      width: "45em",
      showConfirmButton: false,
      didOpen: () => {
        // Tambah
        document.getElementById("btnTambahDusun").onclick = () => {
          showOverlayForm("Tambah Dusun", "", async (nama) => {
            await fetch("/api/lokasidusun", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nama }),
            });
            await isiDropdownDusun(nama);
            renderPopup();
          });
        };

        // Global handler edit
        window.overlayEditDusun = (oldNama) => {
          showOverlayForm("Edit Dusun", oldNama, async (newNama) => {
            await fetch("/api/lokasidusun", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ oldNama, newNama }),
            });
            await isiDropdownDusun(newNama);
            renderPopup();
          });
        };

        // Global handler delete
        window.overlayDeleteDusun = (nama) => {
          showOverlayConfirm(`Hapus "${nama}"?`, async () => {
            await fetch("/api/lokasidusun", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nama }),
            });
            await isiDropdownDusun("");
            renderPopup();
          });
        };
      },
    });
  };

  renderPopup();
};



//------------
function attachCrudLokasi(selectId, kategoriAwal = null) {
  const lokasiMengajiSelect = document.getElementById(selectId);
  if (!lokasiMengajiSelect || document.getElementById(`btnCrudLokasi_${selectId}`)) return;

  // wrapper flex
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "8px";

  lokasiMengajiSelect.parentNode.insertBefore(wrapper, lokasiMengajiSelect);
  wrapper.appendChild(lokasiMengajiSelect);

  // tombol ⚙
  const crudBtn = document.createElement("button");
  crudBtn.id = `btnCrudLokasi_${selectId}`;
  crudBtn.innerHTML = "⚙";
  crudBtn.className = "btn btn-sm btn-outline-primary";
  crudBtn.style.fontSize = "26px";
  crudBtn.style.padding = "2px 8px";
  crudBtn.style.lineHeight = "1";
  wrapper.appendChild(crudBtn);

  // panel overlay
  const popup = Swal.getPopup();
  const crudPanel = document.createElement("div");
  crudPanel.id = `crudPanel_${selectId}`;
  crudPanel.style = `
    display:none;
    position:absolute;
    top:12%;
    left:6%;
    right:6%;
    bottom:12%;
    background:#fff;
    z-index:9999;
    padding:14px;
    border-radius:8px;
    box-shadow:0 8px 30px rgba(0,0,0,0.25);
    overflow:auto;
  `;

  crudPanel.innerHTML = `
    <!-- Header -->
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:#f8f9fa; border-radius:6px; margin-bottom:12px;">
      <h3 style="margin:0; font-size:16px; font-weight:600;">Kelola Lokasi Mengaji</h3>
      <button id="btnCloseCrud_${selectId}" 
  style="
    display:flex;
    align-items:center;
    gap:6px;
    border:none;
    background:#6c757d;
    color:#fff;
    padding:6px 12px;
    border-radius:6px;
    cursor:pointer;
    font-size:14px;
  ">
  <span>Tutup</span>
  <svg xmlns="http://www.w3.org/2000/svg" 
       viewBox="0 0 24 24" 
       fill="currentColor" 
       style="width:18px; height:18px;">
    <path fill-rule="evenodd" d="M2.515 10.674a1.875 1.875 0 0 0 0 2.652L8.89 19.7c.352.351.829.549 1.326.549H19.5a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-9.284c-.497 0-.974.198-1.326.55l-6.375 6.374ZM12.53 9.22a.75.75 0 1 0-1.06 1.06L13.19 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 1 0 1.06-1.06L15.31 12l1.72-1.72a.75.75 0 1 0-1.06-1.06l-1.72 1.72-1.72-1.72Z" clip-rule="evenodd"/>
  </svg>
</button>

    </div>

    <!-- Kategori -->
    <div style="margin-bottom:8px;">
      <label style="display:block; font-weight:600; margin-bottom:4px; font-size:14px;">Kategori</label>
      <select id="crudKategori_${selectId}" style="width:84%; margin-left:-0px; padding:8px 10px; border-radius:6px; border:1px solid #ccc; font-size:14px;">
        <option value="lokal">Ngaji Lokal</option>
        <option value="luar">Ngaji Luar</option>
        <option value="guru">Guru Ngaji</option>
      </select>
    </div>

    <!-- Input + Tambah -->
    <div style="display:flex; gap:8px; align-items:flex-end; margin-bottom:18px;">
      <div style="flex:1;">
        <label style="display:block; font-weight:600; margin-bottom:4px; font-size:14px;">Nama Lokasi</label>
        <input id="crudNama_${selectId}" placeholder="Nama Lokasi" style="width:100%; padding:8px 10px; border-radius:6px; border:1px solid #ccc; font-size:14px;" />
      </div>
      <button id="btnTambahLokasi_${selectId}" style="background:#28a745; border:none; color:#fff; padding:10px 16px; border-radius:6px; cursor:pointer; font-weight:600; font-size:14px;">Tambah</button>
    </div>

    <!-- List -->
    <div id="crudList_${selectId}" style="max-height:240px; overflow:auto; border:1px solid #e6e6e6; padding:8px; border-radius:6px; background:#fafafa"></div>
  `;
  popup.appendChild(crudPanel);

  // helper load list
  const loadList = async () => {
    const kategori = crudPanel.querySelector(`#crudKategori_${selectId}`).value;
    const res = await fetch(`/api/lokasimengaji?kategori=${encodeURIComponent(kategori)}`);
    const hasil = await res.json();
    const listDiv = crudPanel.querySelector(`#crudList_${selectId}`);
    listDiv.innerHTML = (hasil.data || []).map(item => `
      <div style="display:flex; justify-content:space-between; align-items:center;
                  padding:8px; margin-bottom:6px; border-radius:6px; background:#fff; border:1px solid #eee">
        <div style="flex:1; padding-right:8px">${item}</div>
        <div style="display:flex; gap:6px">
          <button data-nama="${item}" class="btnEdit" style="border:none;background:#ffc107;padding:3px 3px;border-radius:6px;cursor:pointer"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4"><path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" /></svg></button>
          <button data-nama="${item}" class="btnHapus" style="border:none;background:#dc3545;color:#fff;padding:3px 3px;border-radius:6px;cursor:pointer"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clip-rule="evenodd" /></svg></button>
        </div>
      </div>
    `).join("");
    
    // edit & hapus handler
    listDiv.querySelectorAll(".btnEdit").forEach(btn => {
      btn.onclick = async () => {
        const oldNama = btn.dataset.nama;
        const { value: newNama } = await Swal.fire({
          title: "Edit Lokasi",
          input: "text",
          inputValue: oldNama,
          showCancelButton: true
        });
        if (newNama && newNama !== oldNama) {
          await fetch("/api/lokasimengaji", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kategori, oldNama, newNama })
          });
          await loadList();
          await isiLokasiMengajiDropdown(selectId, kategori);
        }
      };
    });

    listDiv.querySelectorAll(".btnHapus").forEach(btn => {
      btn.onclick = async () => {
        const nama = btn.dataset.nama;
        const confirm = await Swal.fire({
          title: "Yakin hapus?",
          text: nama,
          icon: "warning",
          showCancelButton: true
        });
        if (confirm.isConfirmed) {
          await fetch("/api/lokasimengaji", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kategori, nama })
          });
          await loadList();
          await isiLokasiMengajiDropdown(selectId, kategori);
        }
      };
    });
  };

  // events
  crudBtn.addEventListener("click", async () => {
    if (kategoriAwal) {
      crudPanel.querySelector(`#crudKategori_${selectId}`).value = kategoriAwal;
    }
    crudPanel.style.display = "block";
    crudPanel.querySelector(`#crudNama_${selectId}`).focus();
    await loadList();
  });

  crudPanel.querySelector(`#btnCloseCrud_${selectId}`).addEventListener("click", () => {
    crudPanel.style.display = "none";
    lokasiMengajiSelect.focus();
  });

  crudPanel.querySelector(`#btnTambahLokasi_${selectId}`).addEventListener("click", async () => {
    const nama = crudPanel.querySelector(`#crudNama_${selectId}`).value.trim();
    if (!nama) return Swal.fire("Nama wajib diisi", "", "warning");
    const kategori = crudPanel.querySelector(`#crudKategori_${selectId}`).value;
    await fetch("/api/lokasimengaji", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kategori, nama })
    });
    crudPanel.querySelector(`#crudNama_${selectId}`).value = "";
    await loadList();
    await isiLokasiMengajiDropdown(selectId, kategori);
  });

  crudPanel.querySelector(`#crudKategori_${selectId}`).addEventListener("change", loadList);
}

//-------

const handleExport = async () => {
  try {
    const res = await fetch("/api/penduduk/export");
    if (!res.ok) throw new Error("Gagal ambil file dari server");

    const blob = await res.blob();
    saveAs(blob, "data_penduduk.xlsx");
  } catch (err) {
    console.error("❌ Gagal ekspor:", err);
    Swal.fire("Error", err.message, "error");
  }
};


//------



//-----------




