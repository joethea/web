"use client";
import DashboardLayout from "./components/DashboardLayout";
import PendudukPage from "./components/PendudukPage";
import PendudukPageHP from "./components/PendudukPageHP";

export default function ResponsivePendudukPage() {
  return (
    <DashboardLayout defaultPage="penduduk">
      {/* ✅ Versi HP / Tablet (<= 1024px) */}
      <div className="block lg:hidden border-2 border-green-500 p-2">
        <div className="bg-green-200 text-green-800 text-center font-bold p-2 mb-2">
          📱 MODE HP / TABLET AKTIF
        </div>
        <PendudukPageHP />
      </div>

      {/* ✅ Versi Desktop (> 1024px) */}
      <div className="hidden lg:block border-2 border-blue-500 p-2">
        <div className="bg-blue-200 text-blue-800 text-center font-bold p-2 mb-2">
          💻 MODE DESKTOP AKTIF
        </div>
        <PendudukPage />
      </div>
    </DashboardLayout>
  );
}
