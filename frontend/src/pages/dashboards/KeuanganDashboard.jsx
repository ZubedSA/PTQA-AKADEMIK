import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Receipt,
    PiggyBank,
    FileBarChart,
    ArrowUpCircle,
    ArrowDownCircle,
    CheckCircle,
    Tag
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './KeuanganDashboard.css'

// Register ChartJS
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
)

/**
 * Keuangan Dashboard - Operasional keuangan (bendahara)
 * Fokus pada kas, pembayaran, dan penyaluran dana
 */
const KeuanganDashboard = () => {
    const [keuanganStats, setKeuanganStats] = useState({
        pemasukan: 0,
        pengeluaran: 0,
        pembayaran: 0,
        saldo: 0
    })
    const [monthlyData, setMonthlyData] = useState({
        pemasukan: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        pengeluaran: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    })
    const [loading, setLoading] = useState(true)
    const [greeting, setGreeting] = useState('')

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
    const currentYear = new Date().getFullYear()

    const updateGreeting = () => {
        const hour = new Date().getHours()
        if (hour >= 4 && hour < 11) setGreeting('Selamat Pagi')
        else if (hour >= 11 && hour < 15) setGreeting('Selamat Siang')
        else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore')
        else setGreeting('Selamat Malam')
    }

    useEffect(() => {
        fetchKeuanganStats()
        fetchMonthlyData()
        updateGreeting()
        const interval = setInterval(updateGreeting, 60000)
        return () => clearInterval(interval)
    }, [])

    const fetchKeuanganStats = async () => {
        setLoading(true)
        try {
            const startOfYear = `${currentYear}-01-01`
            const endOfYear = `${currentYear}-12-31`

            const [pemasukanRes, pengeluaranRes, pembayaranRes] = await Promise.all([
                supabase.from('kas_pemasukan').select('jumlah').gte('tanggal', startOfYear).lte('tanggal', endOfYear),
                supabase.from('kas_pengeluaran').select('jumlah').gte('tanggal', startOfYear).lte('tanggal', endOfYear),
                supabase.from('pembayaran_santri').select('jumlah').gte('tanggal', startOfYear).lte('tanggal', endOfYear)
            ])

            const totalPemasukan = pemasukanRes.data?.reduce((sum, d) => sum + Number(d.jumlah || 0), 0) || 0
            const totalPengeluaran = pengeluaranRes.data?.reduce((sum, d) => sum + Number(d.jumlah || 0), 0) || 0
            const totalPembayaran = pembayaranRes.data?.reduce((sum, d) => sum + Number(d.jumlah || 0), 0) || 0

            setKeuanganStats({
                pemasukan: totalPemasukan,
                pengeluaran: totalPengeluaran,
                pembayaran: totalPembayaran,
                saldo: totalPemasukan - totalPengeluaran
            })
        } catch (error) {
            console.log('Error fetching keuangan stats:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchMonthlyData = async () => {
        try {
            const startOfYear = `${currentYear}-01-01`
            const endOfYear = `${currentYear}-12-31`

            const [pemasukanRes, pengeluaranRes] = await Promise.all([
                supabase.from('kas_pemasukan').select('jumlah, tanggal').gte('tanggal', startOfYear).lte('tanggal', endOfYear),
                supabase.from('kas_pengeluaran').select('jumlah, tanggal').gte('tanggal', startOfYear).lte('tanggal', endOfYear)
            ])

            const pemasukan = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            const pengeluaran = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

            pemasukanRes.data?.forEach(d => {
                const month = new Date(d.tanggal).getMonth()
                pemasukan[month] += Number(d.jumlah || 0)
            })

            pengeluaranRes.data?.forEach(d => {
                const month = new Date(d.tanggal).getMonth()
                pengeluaran[month] += Number(d.jumlah || 0)
            })

            setMonthlyData({ pemasukan, pengeluaran })
        } catch (error) {
            console.log('Error fetching monthly data:', error.message)
        }
    }

    const formatCurrency = (amount, short = false) => {
        if (short && amount >= 1000000) {
            return `Rp ${(amount / 1000000).toFixed(1)}jt`
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    // Chart Data
    const kasBarData = {
        labels: months,
        datasets: [
            {
                label: 'Pemasukan',
                data: monthlyData.pemasukan,
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 4
            },
            {
                label: 'Pengeluaran',
                data: monthlyData.pengeluaran,
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderRadius: 4
            }
        ]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top' }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => formatCurrency(value, true)
                }
            }
        }
    }

    return (
        <div className="keuangan-dashboard">
            {/* Welcome Header */}
            <div className="dashboard-welcome keuangan">
                <div className="welcome-content">
                    <h1>👋 {greeting}!</h1>
                    <p>Dashboard Keuangan PTQA Batuan - Tahun {currentYear}</p>
                </div>
                <div className="welcome-badge">
                    <Wallet size={20} />
                    <span>Keuangan</span>
                </div>
            </div>

            {/* Financial Stats */}
            <div className="keuangan-stats-grid">
                <div className="keuangan-stat-card income">
                    <div className="stat-info">
                        <span className="stat-label">Total Pemasukan</span>
                        <span className="stat-value">{loading ? '...' : formatCurrency(keuanganStats.pemasukan)}</span>
                    </div>
                    <div className="stat-icon-box">
                        <ArrowUpCircle size={24} />
                    </div>
                </div>
                <div className="keuangan-stat-card expense">
                    <div className="stat-info">
                        <span className="stat-label">Total Pengeluaran</span>
                        <span className="stat-value">{loading ? '...' : formatCurrency(keuanganStats.pengeluaran)}</span>
                    </div>
                    <div className="stat-icon-box">
                        <ArrowDownCircle size={24} />
                    </div>
                </div>
                <div className="keuangan-stat-card payment">
                    <div className="stat-info">
                        <span className="stat-label">Pembayaran Santri</span>
                        <span className="stat-value">{loading ? '...' : formatCurrency(keuanganStats.pembayaran)}</span>
                    </div>
                    <div className="stat-icon-box">
                        <CreditCard size={24} />
                    </div>
                </div>
                <div className={`keuangan-stat-card balance ${keuanganStats.saldo >= 0 ? 'positive' : 'negative'}`}>
                    <div className="stat-info">
                        <span className="stat-label">Saldo Kas</span>
                        <span className="stat-value">{loading ? '...' : formatCurrency(keuanganStats.saldo)}</span>
                    </div>
                    <div className="stat-icon-box">
                        <Wallet size={24} />
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="keuangan-card chart-card">
                <div className="card-header">
                    <h3><TrendingUp size={20} /> Alur Kas Bulanan {currentYear}</h3>
                </div>
                <div className="chart-container">
                    <Bar data={kasBarData} options={chartOptions} />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="keuangan-card">
                <div className="card-header">
                    <h3><Wallet size={20} /> Menu Keuangan</h3>
                </div>
                <div className="quick-actions-grid">
                    <div className="action-group">
                        <h4><PiggyBank size={16} /> Alur KAS</h4>
                        <div className="action-links">
                            <Link to="/keuangan/kas/pemasukan"><ArrowUpCircle size={16} /> Pemasukan</Link>
                            <Link to="/keuangan/kas/pengeluaran"><ArrowDownCircle size={16} /> Pengeluaran</Link>
                            <Link to="/keuangan/kas/laporan"><FileBarChart size={16} /> Laporan Kas</Link>
                        </div>
                    </div>
                    <div className="action-group">
                        <h4><CreditCard size={16} /> Pembayaran</h4>
                        <div className="action-links">
                            <Link to="/keuangan/pembayaran/tagihan"><Receipt size={16} /> Tagihan Santri</Link>
                            <Link to="/keuangan/pembayaran/kategori"><Tag size={16} /> Kategori</Link>
                            <Link to="/keuangan/pembayaran/bayar"><CreditCard size={16} /> Pembayaran</Link>
                            <Link to="/keuangan/pembayaran/laporan"><FileBarChart size={16} /> Laporan</Link>
                        </div>
                    </div>
                    <div className="action-group">
                        <h4><TrendingUp size={16} /> Penyaluran Dana</h4>
                        <div className="action-links">
                            <Link to="/keuangan/dana/anggaran"><PiggyBank size={16} /> Anggaran</Link>
                            <Link to="/keuangan/dana/persetujuan"><CheckCircle size={16} /> Persetujuan</Link>
                            <Link to="/keuangan/dana/realisasi"><TrendingUp size={16} /> Realisasi</Link>
                            <Link to="/keuangan/dana/laporan"><FileBarChart size={16} /> Laporan</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default KeuanganDashboard
