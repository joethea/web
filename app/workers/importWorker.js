         // importWorker.js
         import * as XLSX from 'xlsx'; // Pastikan XLSX di-bundle untuk worker

         self.onmessage = async (e) => {
           const { fileBuffer, batchSize } = e.data;
           
           try {
             const wb = XLSX.read(fileBuffer, { type: "buffer" });
             const sheet = wb.Sheets[wb.SheetNames[0]];
             const rows = XLSX.utils.sheet_to_json(sheet);
             
             const batches = [];
             for (let i = 0; i < rows.length; i += batchSize) {
               batches.push(rows.slice(i, i + batchSize));
             }
             
             self.postMessage({ success: true, batches });
           } catch (err) {
             self.postMessage({ success: false, error: err.message });
           }
         };
         