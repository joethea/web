penduduk-nextjs-final
=====================

- Next.js (App Router) project ready to use with Supabase.
- Columns displayed: NO, NIK, NAMA, TANGGAL LAHIR, DUSUN, TINDAKAN.
- API endpoints:
  GET  /api/penduduk?search=&page=1&limit=20
  POST /api/penduduk  (body: { nik, nama, tanggal_lahir, alamat_dusun })
  DELETE /api/penduduk?nik=...
  GET /api/penduduk/export
  POST /api/penduduk/import  (form-data file field 'file')

Setup:
1. Create Supabase project and run SQL:
   create table if not exists penduduk (
     nik varchar(16) primary key,
     nama text not null,
     tanggal_lahir date,
     alamat_dusun text
   );
2. Create .env.local with:
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_KEY=your-anon-key
3. npm install
4. npm run dev

Notes:
- This project uses Supabase for persistence. Import expects a sheet with columns NIK and NAMA (other columns optional).
- Export will return an Excel with columns NO, NIK, NAMA, TANGGAL LAHIR, DUSUN.
