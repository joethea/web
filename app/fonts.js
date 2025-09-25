import { Poppins, Bebas_Neue } from "next/font/google";

// Default font untuk body
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

// Font khusus untuk judul
export const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
});
