import * as XLSX from "xlsx";
import Swal from "sweetalert2";

export async function importExcelFile(file, ambilDataPenduduk, setImportLoading) {
  if (!file) return;

  console.log("📂 File dipilih:", file);

  try {
    setImportLoading(true);
    
    // Step 1: Parse Excel
    const buffer = await file.arrayBuffer();
    let rows = [];
    try {
      const wb = XLSX.read(buffer, { type: "buffer" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
      console.log("✅ Parsed rows:", rows.length);
    } catch (parseErr) {
      console.error("❌ Gagal parsing Excel:", parseErr);
      Swal.fire("❌ Error", "Format file Excel tidak valid", "error");
      return;
    }

    // Step 2: Tampilkan loading
    Swal.fire({
      title: "Mengimpor Data...",
      text: "Mohon tunggu sebentar",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const buildInvalidTable = (rows) => `
      <div style="max-height:400px; overflow:auto; text-align:center;">
        <table style="width:100%; border-collapse: collapse; font-size:13px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:6px; border:1px solid #ddd;">Baris</th>
              <th style="padding:6px; border:1px solid #ddd;">NIK</th>
              <th style="padding:6px; border:1px solid #ddd;">Nama</th>
              <th style="padding:6px; border:1px solid #ddd;">Alasan</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) => `
                  <tr>
                    <td style="padding:6px; border:1px solid #ddd;">${r.row || "-"}</td>
                    <td style="padding:6px; border:1px solid #ddd;">${r.nik || "-"}</td>
                    <td style="padding:6px; border:1px solid #ddd;">${r.nama || "-"}</td>
                    <td style="padding:6px; border:1px solid #ddd;">
                      ${Array.isArray(r.errors) ? r.errors.join(", ") : r.errors || "-"}
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    // Step 3: Kirim batch ke server
    const BATCH_SIZE = 100;
    let totalInserted = 0;
    let totalSkipped = 0;
    let allInvalid = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      try {
        const res = await fetch("/api/penduduk/import/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: batch }),
        });

        const hasil = await res.json();
        console.log("📤 Batch result:", hasil);

        if (!res.ok) throw new Error(hasil.error || "Batch gagal diproses");

        totalInserted += hasil.inserted || 0;
        totalSkipped += hasil.skipped || 0;
        if (Array.isArray(hasil.invalid)) {
          allInvalid = allInvalid.concat(hasil.invalid);
        }
      } catch (err) {
        console.error("❌ Error kirim batch:", err);
        allInvalid.push({
          row: "-",
          nik: "-",
          nama: "-",
          errors: [err.message || "Gagal upload batch"],
        });
      }
    }

    // Step 4: Tutup loading & tampilkan hasil
    Swal.close();

    if (allInvalid.length > 0) {
       Swal.fire({
  title: `✅ <b>${totalInserted}</b> data berhasil diimport`,
  html: `
    <div style="margin-bottom:12px; font-size:20px;">   
      ⚠️ <b>${allInvalid.length}</b> data gagal diimport.
    </div>
    ${buildInvalidTable(allInvalid)}
  `,
  width: 800,
  icon: "success",
});
    } else if (totalSkipped > 0) {
      Swal.fire({
        title: "ℹ️ Info",
        text: `${totalInserted} dimasukkan, ${totalSkipped} dilewati (duplikat).`,
        icon: "info",
        timer: 2500,
        showConfirmButton: false,
      });
    } else {
      Swal.fire("✅ Selesai", `${totalInserted} data berhasil diimport`, "success");
    }

    await ambilDataPenduduk(1);
  } catch (err) {
    console.error("❌ Fatal error import:", err);
    Swal.close();
    Swal.fire("❌ Gagal", err.message, "error");
  } finally {
    setImportLoading(false);
  }
}
