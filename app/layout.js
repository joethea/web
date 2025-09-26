import "./globals.css";
import { poppins } from "./fonts";

export const metadata = {
  title: "Penduduk App",
  description: "Manajemen Data Penduduk dengan Next.js + Supabase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* ✅ Wajib agar responsive jalan */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}

