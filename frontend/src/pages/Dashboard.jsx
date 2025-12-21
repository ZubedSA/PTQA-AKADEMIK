import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js'
import { Users, GraduationCap, Home, BookMarked, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ConnectionStatus from '../components/common/ConnectionStatus'
import './Dashboard.css'

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalSantri: 0,
        totalGuru: 0,
        totalKelas: 0,
        totalHalaqoh: 0
    })
    const [hafalanStats, setHafalanStats] = useState({
        total: 0,
        lancar: 0,
        sedang: 0,
        lemah: 0,
        bacaNazhor: 0
    })
    const [loading, setLoading] = useState(true)
    const [hafalanTrend, setHafalanTrend] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    const [greeting, setGreeting] = useState('')

    const updateGreeting = () => {
        const hour = new Date().getHours()
        if (hour >= 4 && hour < 11) {
            setGreeting('Selamat Pagi')
        } else if (hour >= 11 && hour < 15) {
            setGreeting('Selamat Siang')
        } else if (hour >= 15 && hour < 18) {
            setGreeting('Selamat Sore')
        } else {
            setGreeting('Selamat Malam')
        }
    }

    // Chart data
    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'],
        datasets: [
            {
                label: 'Total Hafalan',
                data: hafalanTrend,
                borderColor: '#059669',
                backgroundColor: 'rgba(26, 92, 56, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#059669',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            }
        ]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#059669',
                padding: 12,
                cornerRadius: 8,
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#6b7280' } },
            y: { min: 0, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: '#6b7280' } }
        }
    }

    useEffect(() => {
        fetchStats()
        fetchHafalanStats()
        fetchHafalanTrend()
        updateGreeting()
        const interval = setInterval(updateGreeting, 60000)
        return () => clearInterval(interval)
    }, [])

    const fetchStats = async () => {
        setLoading(true)
        try {
            const [santriRes, guruRes, kelasRes, halaqohRes] = await Promise.all([
                supabase.from('santri').select('*', { count: 'exact', head: true }),
                supabase.from('guru').select('*', { count: 'exact', head: true }),
                supabase.from('kelas').select('*', { count: 'exact', head: true }),
                supabase.from('halaqoh').select('*', { count: 'exact', head: true })
            ])

            setStats({
                totalSantri: santriRes.count || 0,
                totalGuru: guruRes.count || 0,
                totalKelas: kelasRes.count || 0,
                totalHalaqoh: halaqohRes.count || 0
            })
        } catch (error) {
            console.error('Error fetching stats:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchHafalanStats = async () => {
        try {
            const { data, error } = await supabase.from('hafalan').select('status')
            if (error) throw error

            const total = data?.length || 0
            const lancar = data?.filter(h => h.status === 'Lancar').length || 0
            const sedang = data?.filter(h => h.status === 'Sedang').length || 0
            const lemah = data?.filter(h => h.status === 'Lemah').length || 0
            const bacaNazhor = data?.filter(h => h.status === 'Baca Nazhor').length || 0

            setHafalanStats({ total, lancar, sedang, lemah, bacaNazhor })
        } catch (error) {
            console.log('Error fetching hafalan stats:', error.message)
        }
    }

    const fetchHafalanTrend = async () => {
        try {
            const { data, error } = await supabase.from('hafalan').select('tanggal')
            if (error) throw error

            const currentYear = new Date().getFullYear()
            const monthlyCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

            data?.forEach(h => {
                if (h.tanggal) {
                    const date = new Date(h.tanggal)
                    if (date.getFullYear() === currentYear) {
                        monthlyCount[date.getMonth()]++
                    }
                }
            })

            setHafalanTrend(monthlyCount)
        } catch (error) {
            console.log('Error fetching hafalan trend:', error.message)
        }
    }

    return (
        <div className="dashboard">
            {/* Welcome Header */}
            <div className="dashboard-welcome">
                <h1>👋 {greeting}!</h1>
                <p>Selamat datang di Sistem Akademik PTQA Batuan</p>
            </div>

            {/* Stats Ringkasan - 2 Kolom */}
            <div className="dashboard-stats-grid">
                <div className="dashboard-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Total Santri</span>
                        <span className="stat-value green">{loading ? '...' : stats.totalSantri}</span>
                    </div>
                    <div className="stat-icon-box green">
                        <Users size={24} />
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Total Guru</span>
                        <span className="stat-value blue">{loading ? '...' : stats.totalGuru}</span>
                    </div>
                    <div className="stat-icon-box blue">
                        <GraduationCap size={24} />
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Jumlah Kelas</span>
                        <span className="stat-value yellow">{loading ? '...' : stats.totalKelas}</span>
                    </div>
                    <div className="stat-icon-box yellow">
                        <Home size={24} />
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Jumlah Halaqoh</span>
                        <span className="stat-value teal">{loading ? '...' : stats.totalHalaqoh}</span>
                    </div>
                    <div className="stat-icon-box teal">
                        <BookMarked size={24} />
                    </div>
                </div>
            </div>

            {/* Section Divider */}
            <div className="dashboard-section-title">📖 Statistik Hafalan</div>

            {/* Stats Hafalan - 2 Kolom */}
            <div className="dashboard-stats-grid">
                <div className="dashboard-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Total</span>
                        <span className="stat-value purple">{hafalanStats.total}</span>
                    </div>
                    <div className="stat-icon-box purple">
                        <FileText size={24} />
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Lancar</span>
                        <span className="stat-value green">{hafalanStats.lancar}</span>
                    </div>
                    <div className="stat-icon-box green">
                        <CheckCircle size={24} />
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Sedang</span>
                        <span className="stat-value blue">{hafalanStats.sedang}</span>
                    </div>
                    <div className="stat-icon-box blue">
                        <Clock size={24} />
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Lemah</span>
                        <span className="stat-value yellow">{hafalanStats.lemah}</span>
                    </div>
                    <div className="stat-icon-box yellow">
                        <AlertCircle size={24} />
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Baca Nazhor</span>
                        <span className="stat-value purple">{hafalanStats.bacaNazhor}</span>
                    </div>
                    <div className="stat-icon-box purple">
                        <BookMarked size={24} />
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="dashboard-chart-card">
                <h3 className="chart-title">📊 Tren Hafalan Bulanan</h3>
                <div className="chart-container">
                    <Line data={chartData} options={chartOptions} />
                </div>
                <div className="chart-legend">
                    <span className="legend-item">
                        <span className="legend-dot"></span>
                        Total Setoran
                    </span>
                </div>
            </div>

            {/* Connection Status */}
            <ConnectionStatus />
        </div>
    )
}

export default Dashboard
