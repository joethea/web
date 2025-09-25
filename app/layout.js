import "./globals.css";
import { poppins } from "./fonts";

export const metadata = {
  title: "Penduduk App",
  description: "Manajemen Data Penduduk dengan Next.js + Supabase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      {/* Gunakan Poppins untuk default body */}
      <body className={`${poppins.className} bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
