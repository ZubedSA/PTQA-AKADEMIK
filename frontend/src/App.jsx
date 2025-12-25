import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SantriList from './pages/santri/SantriList'
import SantriForm from './pages/santri/SantriForm'
import GuruList from './pages/guru/GuruList'
import GuruForm from './pages/guru/GuruForm'
import KelasPage from './pages/kelas/KelasPage'
import HalaqohPage from './pages/halaqoh/HalaqohPage'
import MapelPage from './pages/mapel/MapelPage'
import InputNilaiPage from './pages/nilai/InputNilaiPage'
import RekapNilaiPage from './pages/nilai/RekapNilaiPage'
import HafalanList from './pages/hafalan/HafalanList'
import HafalanForm from './pages/hafalan/HafalanForm'
import PresensiPage from './pages/presensi/PresensiPage'
import SemesterPage from './pages/semester/SemesterPage'
import LaporanPage from './pages/laporan/LaporanPage'
import AuditLogPage from './pages/auditlog/AuditLogPage'
import PengaturanPage from './pages/pengaturan/PengaturanPage'
import ProfilSettingsPage from './pages/profil/ProfilSettingsPage'
import WaliSantriPage from './pages/walisantri/WaliSantriPage'
import BackupPage from './pages/backup/BackupPage'
import SystemStatusPage from './pages/system/SystemStatusPage'
// Keuangan Pages
import KasPemasukanPage from './pages/keuangan/KasPemasukanPage'
import KasPengeluaranPage from './pages/keuangan/KasPengeluaranPage'
import KasLaporanPage from './pages/keuangan/KasLaporanPage'
import TagihanSantriPage from './pages/keuangan/TagihanSantriPage'
import KategoriPembayaranPage from './pages/keuangan/KategoriPembayaranPage'
import PembayaranSantriPage from './pages/keuangan/PembayaranSantriPage'
import LaporanPembayaranPage from './pages/keuangan/LaporanPembayaranPage'
import AnggaranPage from './pages/keuangan/AnggaranPage'
import PersetujuanDanaPage from './pages/keuangan/PersetujuanDanaPage'
import RealisasiDanaPage from './pages/keuangan/RealisasiDanaPage'
import LaporanPenyaluranPage from './pages/keuangan/LaporanPenyaluranPage'
import './index.css'
import './components/common/ErrorBoundary.css'

// Component untuk redirect berdasarkan role setelah login
const RoleBasedRedirect = () => {
  const { role, loading } = useAuth()

  if (loading) {
    return <div className="loading">Memuat...</div>
  }

  // Wali diarahkan ke portal wali
  if (role === 'wali') {
    return <Navigate to="/wali-santri" replace />
  }

  // Admin dan Guru ke dashboard
  return <Dashboard />
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes - Require Authentication */}
              <Route element={<Layout />}>

                {/* Dashboard - Role-based redirect */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <RoleBasedRedirect />
                  </ProtectedRoute>
                } />

                {/* ============ ADMIN ONLY ROUTES ============ */}

                {/* Santri Management */}
                <Route path="/santri" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <SantriList />
                  </ProtectedRoute>
                } />
                <Route path="/santri/create" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <SantriForm />
                  </ProtectedRoute>
                } />
                <Route path="/santri/:id" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <SantriForm />
                  </ProtectedRoute>
                } />
                <Route path="/santri/:id/edit" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <SantriForm />
                  </ProtectedRoute>
                } />

                {/* Guru Management */}
                <Route path="/guru" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <GuruList />
                  </ProtectedRoute>
                } />
                <Route path="/guru/create" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <GuruForm />
                  </ProtectedRoute>
                } />
                <Route path="/guru/:id" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <GuruForm />
                  </ProtectedRoute>
                } />
                <Route path="/guru/:id/edit" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <GuruForm />
                  </ProtectedRoute>
                } />

                {/* Master Data - Admin Only */}
                <Route path="/kelas" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <KelasPage />
                  </ProtectedRoute>
                } />
                <Route path="/mapel" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <MapelPage />
                  </ProtectedRoute>
                } />
                <Route path="/semester" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <SemesterPage />
                  </ProtectedRoute>
                } />

                {/* Admin Settings */}
                <Route path="/audit-log" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <AuditLogPage />
                  </ProtectedRoute>
                } />
                <Route path="/pengaturan" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <PengaturanPage />
                  </ProtectedRoute>
                } />
                <Route path="/backup" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <BackupPage />
                  </ProtectedRoute>
                } />
                <Route path="/system-status" element={
                  <ProtectedRoute roles={['admin']} fallbackRedirect="/wali-santri">
                    <SystemStatusPage />
                  </ProtectedRoute>
                } />

                {/* ============ ADMIN + GURU ROUTES ============ */}

                {/* Halaqoh */}
                <Route path="/halaqoh" element={
                  <ProtectedRoute roles={['admin', 'guru']} fallbackRedirect="/wali-santri">
                    <HalaqohPage />
                  </ProtectedRoute>
                } />

                {/* Hafalan */}
                <Route path="/hafalan" element={
                  <ProtectedRoute roles={['admin', 'guru']} fallbackRedirect="/wali-santri">
                    <HafalanList />
                  </ProtectedRoute>
                } />
                <Route path="/hafalan/create" element={
                  <ProtectedRoute roles={['admin', 'guru']} fallbackRedirect="/wali-santri">
                    <HafalanForm />
                  </ProtectedRoute>
                } />
                <Route path="/hafalan/:id/edit" element={
                  <ProtectedRoute roles={['admin', 'guru']} fallbackRedirect="/wali-santri">
                    <HafalanForm />
                  </ProtectedRoute>
                } />

                {/* Presensi */}
                <Route path="/presensi" element={
                  <ProtectedRoute roles={['admin', 'guru']} fallbackRedirect="/wali-santri">
                    <PresensiPage />
                  </ProtectedRoute>
                } />

                {/* Nilai */}
                <Route path="/input-nilai" element={
                  <ProtectedRoute roles={['admin', 'guru']} fallbackRedirect="/wali-santri">
                    <InputNilaiPage />
                  </ProtectedRoute>
                } />
                <Route path="/rekap-nilai" element={
                  <ProtectedRoute roles={['admin', 'guru']} fallbackRedirect="/wali-santri">
                    <RekapNilaiPage />
                  </ProtectedRoute>
                } />

                {/* Laporan */}
                <Route path="/laporan" element={
                  <ProtectedRoute roles={['admin', 'guru']} fallbackRedirect="/wali-santri">
                    <LaporanPage />
                  </ProtectedRoute>
                } />

                {/* ============ KEUANGAN ROUTES (Admin, Bendahara, Pengasuh) ============ */}

                {/* Kas - Pemasukan */}
                <Route path="/keuangan/kas/pemasukan" element={
                  <ProtectedRoute roles={['admin', 'bendahara', 'pengasuh']} fallbackRedirect="/wali-santri">
                    <KasPemasukanPage />
                  </ProtectedRoute>
                } />
                {/* Kas - Pengeluaran */}
                <Route path="/keuangan/kas/pengeluaran" element={
                  <ProtectedRoute roles={['admin', 'bendahara', 'pengasuh']} fallbackRedirect="/wali-santri">
                    <KasPengeluaranPage />
                  </ProtectedRoute>
                } />
                {/* Kas - Laporan */}
                <Route path="/keuangan/kas/laporan" element={
                  <ProtectedRoute roles={['admin', 'bendahara', 'pengasuh']} fallbackRedirect="/wali-santri">
                    <KasLaporanPage />
                  </ProtectedRoute>
                } />

                {/* Pembayaran - Tagihan Santri */}
                <Route path="/keuangan/pembayaran/tagihan" element={
                  <ProtectedRoute roles={['admin', 'bendahara', 'pengasuh']} fallbackRedirect="/wali-santri">
                    <TagihanSantriPage />
                  </ProtectedRoute>
                } />
                {/* Pembayaran - Kategori */}
                <Route path="/keuangan/pembayaran/kategori" element={
                  <ProtectedRoute roles={['admin', 'bendahara', 'pengasuh']} fallbackRedirect="/wali-santri">
                    <KategoriPembayaranPage />
                  </ProtectedRoute>
                } />
                {/* Pembayaran - Pembayaran Santri */}
                <Route path="/keuangan/pembayaran/bayar" element={
                  <ProtectedRoute roles={['admin', 'bendahara', 'pengasuh']} fallbackRedirect="/wali-santri">
                    <PembayaranSantriPage />
                  </ProtectedRoute>
                } />
                {/* Pembayaran - Laporan */}
                <Route path="/keuangan/pembayaran/laporan" element={
                  <ProtectedRoute roles={['admin', 'bendahara', 'pengasuh']} fallbackRedirect="/wali-santri">
                    <LaporanPembayaranPage />
                  </ProtectedRoute>
                } />

                {/* Penyaluran Dana - Anggaran */}
                <Route path="/keuangan/dana/anggaran" element={
                  <ProtectedRoute roles={['admin', 'bendahara', 'pengasuh']} fallbackRedirect="/wali-santri">
                    <AnggaranPage />
                  </ProtectedRoute>
                } />
                {/* Penyaluran Dana - Persetujuan */}
                <Route path="/keuangan/dana/persetujuan" element={
                  <ProtectedRoute roles={['admin', 'bendahara', 'pengasuh']} fallbackRedirect="/wali-santri">
                    <PersetujuanDanaPage />
                  </ProtectedRoute>
                } />
                {/* Penyaluran Dana - Realisasi */}
                <Route path="/keuangan/dana/realisasi" element={
                  <ProtectedRoute roles={['admin', 'bendahara', 'pengasuh']} fallbackRedirect="/wali-santri">
                    <RealisasiDanaPage />
                  </ProtectedRoute>
                } />
                {/* Penyaluran Dana - Laporan */}
                <Route path="/keuangan/dana/laporan" element={
                  <ProtectedRoute roles={['admin', 'bendahara', 'pengasuh']} fallbackRedirect="/wali-santri">
                    <LaporanPenyaluranPage />
                  </ProtectedRoute>
                } />

                {/* ============ ALL AUTHENTICATED USERS ============ */}

                {/* Wali Santri Portal */}
                <Route path="/wali-santri" element={
                  <ProtectedRoute>
                    <WaliSantriPage />
                  </ProtectedRoute>
                } />

                {/* Profil Settings */}
                <Route path="/profil-settings" element={
                  <ProtectedRoute>
                    <ProfilSettingsPage />
                  </ProtectedRoute>
                } />

                {/* 404 - Redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
