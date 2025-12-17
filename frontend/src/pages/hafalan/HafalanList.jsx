import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, RefreshCw, FileText, BarChart3, CheckCircle, Clock, AlertCircle, Filter, Calendar, MessageCircle, Trophy, Save, Printer, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './Hafalan.css'

const HafalanList = () => {
    const [hafalan, setHafalan] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedHafalan, setSelectedHafalan] = useState(null)
    const [activeTab, setActiveTab] = useState('list') // 'list', 'rekap', or 'pencapaian'
    const [activeFilter, setActiveFilter] = useState('Semua')
    const [stats, setStats] = useState({ total: 0, lancar: 0, sedang: 0, lemah: 0, bacaNazhor: 0 })

    // Date filter for Input Hafalan tab
    const [dateFilter, setDateFilter] = useState({ dari: '', sampai: '' })
    const [filterHalaqoh, setFilterHalaqoh] = useState('') // Filter halaqoh untuk tab Input Hafalan

    // Rekap filters
    const [halaqohList, setHalaqohList] = useState([])
    const [rekapFilters, setRekapFilters] = useState({
        tanggalMulai: '',
        tanggalSelesai: '',
        halaqoh_id: '',
        santri_nama: ''
    })
    const [rekapData, setRekapData] = useState([])
    const [rekapStats, setRekapStats] = useState({ totalData: 0, lancar: 0, sedang: 0, lemah: 0, bacaNazhor: 0 })

    // Pencapaian state
    const [semesterList, setSemesterList] = useState([])
    const [santriList, setSantriList] = useState([])
    const [pencapaianSemester, setPencapaianSemester] = useState('')
    const [pencapaianSearch, setPencapaianSearch] = useState('')
    const [pencapaianData, setPencapaianData] = useState({})
    const [savingPencapaian, setSavingPencapaian] = useState(false)

    useEffect(() => {
        fetchHafalan()
        fetchHalaqoh()
        fetchSemester()
        fetchSantriList()
    }, [])

    useEffect(() => {
        if (activeTab === 'pencapaian' && pencapaianSemester) {
            fetchPencapaian()
        }
    }, [activeTab, pencapaianSemester])

    const fetchSemester = async () => {
        try {
            const { data } = await supabase.from('semester').select('id, nama, tahun_ajaran, is_active').order('is_active', { ascending: false })
            setSemesterList(data || [])
            const activeSem = data?.find(s => s.is_active)
            if (activeSem) setPencapaianSemester(activeSem.id)
        } catch (err) {
            console.error('Error:', err.message)
        }
    }

    const fetchSantriList = async () => {
        try {
            const { data } = await supabase.from('santri').select('id, nis, nama, kelas:kelas_id(nama)').eq('status', 'Aktif').order('nama')
            setSantriList(data?.map(s => ({ ...s, kelas: s.kelas?.nama || '-' })) || [])
        } catch (err) {
            console.error('Error:', err.message)
        }
    }

    const fetchPencapaian = async () => {
        try {
            const { data } = await supabase.from('pencapaian_hafalan').select('santri_id, jumlah_hafalan, predikat, total_hafalan').eq('semester_id', pencapaianSemester)
            const pencapaianMap = {}
            santriList.forEach(s => {
                pencapaianMap[s.id] = { jumlah_hafalan: '', predikat: 'Baik', total_hafalan: '' }
            })
            data?.forEach(p => {
                pencapaianMap[p.santri_id] = {
                    jumlah_hafalan: p.jumlah_hafalan || '',
                    predikat: p.predikat || 'Baik',
                    total_hafalan: p.total_hafalan || ''
                }
            })
            setPencapaianData(pencapaianMap)
        } catch (err) {
            console.error('Error:', err.message)
        }
    }

    const handlePencapaianChange = (santriId, field, value) => {
        setPencapaianData(prev => ({
            ...prev,
            [santriId]: { ...prev[santriId], [field]: value }
        }))
    }

    const savePencapaian = async () => {
        if (!pencapaianSemester) return alert('Pilih semester terlebih dahulu')
        setSavingPencapaian(true)
        try {
            await supabase.from('pencapaian_hafalan').delete().eq('semester_id', pencapaianSemester)
            const insertData = Object.entries(pencapaianData)
                .filter(([_, v]) => v.jumlah_hafalan || v.total_hafalan)
                .map(([santriId, v]) => ({
                    santri_id: santriId,
                    semester_id: pencapaianSemester,
                    jumlah_hafalan: v.jumlah_hafalan,
                    predikat: v.predikat,
                    total_hafalan: v.total_hafalan
                }))
            if (insertData.length > 0) {
                const { error } = await supabase.from('pencapaian_hafalan').insert(insertData)
                if (error) throw error
            }
            alert('Pencapaian hafalan berhasil disimpan!')
        } catch (err) {
            console.error('Error:', err.message)
            alert('Gagal menyimpan: ' + err.message)
        } finally {
            setSavingPencapaian(false)
        }
    }

    const fetchHalaqoh = async () => {
        try {
            const { data } = await supabase.from('halaqoh').select('id, nama').order('nama')
            setHalaqohList(data || [])
        } catch (err) {
            console.error('Error:', err.message)
        }
    }

    const fetchHafalan = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('hafalan')
                .select(`
                    *,
                    santri:santri_id(nama, nama_wali, no_telp_wali, kelas:kelas_id(nama), halaqoh:halaqoh_id(id, nama)),
                    penguji:penguji_id(nama)
                `)
                .order('tanggal', { ascending: false })

            if (error) throw error

            const mapped = data.map(h => ({
                ...h,
                santri_nama: h.santri?.nama || '-',
                nama_wali: h.santri?.nama_wali || '-',
                no_telp_wali: h.santri?.no_telp_wali || '',
                kelas_nama: h.santri?.kelas?.nama || '-',
                halaqoh_id: h.santri?.halaqoh?.id || null,
                halaqoh_nama: h.santri?.halaqoh?.nama || '-',
                penguji_nama: h.penguji?.nama || '-'
            }))

            setHafalan(mapped)
            calculateStats(mapped)
        } catch (err) {
            console.error('Error:', err.message)
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = (data) => {
        const total = data.length
        const lancar = data.filter(h => h.status === 'Lancar').length
        const sedang = data.filter(h => h.status === 'Sedang').length
        const lemah = data.filter(h => h.status === 'Lemah').length
        const bacaNazhor = data.filter(h => h.status === 'Baca Nazhor').length
        setStats({ total, lancar, sedang, lemah, bacaNazhor })
    }

    const handleDelete = async () => {
        if (!selectedHafalan) return
        try {
            const { error } = await supabase.from('hafalan').delete().eq('id', selectedHafalan.id)
            if (error) throw error
            setHafalan(hafalan.filter(h => h.id !== selectedHafalan.id))
            setShowDeleteModal(false)
            setSelectedHafalan(null)
            fetchHafalan()
        } catch (err) {
            alert('Error: ' + err.message)
        }
    }

    // Filter for Input Hafalan tab
    const filteredHafalan = hafalan.filter(h => {
        const matchSearch = h.santri_nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.surah?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.surah_mulai?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchFilter = activeFilter === 'Semua' || h.jenis === activeFilter

        // Date filter
        let matchDate = true
        if (dateFilter.dari) {
            matchDate = matchDate && h.tanggal >= dateFilter.dari
        }
        if (dateFilter.sampai) {
            matchDate = matchDate && h.tanggal <= dateFilter.sampai
        }

        // Halaqoh filter
        const matchHalaqoh = !filterHalaqoh || h.halaqoh_id === filterHalaqoh

        return matchSearch && matchFilter && matchDate && matchHalaqoh
    })

    // Fungsi kirim WhatsApp
    const sendWhatsApp = (item) => {
        // Gunakan nomor dari database, atau minta input jika tidak ada
        let phone = item.no_telp_wali || ''

        // Format nomor (hapus karakter non-digit, tambah 62 jika perlu)
        phone = phone.replace(/\D/g, '')
        if (phone.startsWith('0')) {
            phone = '62' + phone.substring(1)
        }

        // Jika tidak ada nomor, minta input manual
        if (!phone) {
            phone = prompt(`Nomor telepon wali ${item.nama_wali || 'santri'} tidak tersedia.\n\nMasukkan nomor WhatsApp (contoh: 6281234567890):`)
            if (!phone) return
            phone = phone.replace(/\D/g, '')
            if (phone.startsWith('0')) {
                phone = '62' + phone.substring(1)
            }
        }

        const message = `Assalamu'alaikum Wr. Wb.

*LAPORAN HAFALAN SANTRI*
━━━━━━━━━━━━━━━━━━━━

Kepada Yth. Bapak/Ibu *${item.nama_wali || 'Wali Santri'}*

📌 *Nama Santri:* ${item.santri_nama}
📅 *Tanggal:* ${item.tanggal}
📖 *Jenis:* ${item.jenis || 'Setoran'}

*Detail Hafalan:*
• Juz: ${item.juz}
• Surah: ${item.surah}
• Ayat: ${item.ayat_mulai} - ${item.ayat_selesai}

*Status:* ${item.status}
*Penguji:* ${item.penguji_nama || '-'}

${item.catatan ? `*Catatan:* ${item.catatan}` : ''}

Demikian laporan hafalan ananda. Jazakumullah khairan.

_PTQA Batuan_`

        const encoded = encodeURIComponent(message)
        window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank')
    }

    // Filter for Rekap Hafalan tab
    const applyRekapFilter = () => {
        let filtered = [...hafalan]

        // Filter by date range
        if (rekapFilters.tanggalMulai) {
            filtered = filtered.filter(h => h.tanggal >= rekapFilters.tanggalMulai)
        }
        if (rekapFilters.tanggalSelesai) {
            filtered = filtered.filter(h => h.tanggal <= rekapFilters.tanggalSelesai)
        }

        // Filter by halaqoh
        if (rekapFilters.halaqoh_id) {
            filtered = filtered.filter(h => h.halaqoh_id === rekapFilters.halaqoh_id)
        }

        // Filter by santri name
        if (rekapFilters.santri_nama) {
            filtered = filtered.filter(h =>
                h.santri_nama?.toLowerCase().includes(rekapFilters.santri_nama.toLowerCase())
            )
        }

        setRekapData(filtered)

        // Calculate rekap stats dengan status baru
        const totalData = filtered.length
        const lancar = filtered.filter(h => h.status === 'Lancar').length
        const sedang = filtered.filter(h => h.status === 'Sedang').length
        const lemah = filtered.filter(h => h.status === 'Lemah').length
        const bacaNazhor = filtered.filter(h => h.status === 'Baca Nazhor').length
        // Jenis stats
        const setoran = filtered.filter(h => h.jenis === 'Setoran').length
        const murojaah = filtered.filter(h => h.jenis === "Muroja'ah").length
        const ziyadahUlang = filtered.filter(h => h.jenis === 'Ziyadah Ulang').length

        setRekapStats({ totalData, lancar, sedang, lemah, bacaNazhor, setoran, murojaah, ziyadahUlang })
    }

    // Fungsi Print Rekap
    const handlePrint = () => {
        const printContent = document.getElementById('rekap-print-area')
        if (!printContent) return

        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
            <html>
                <head>
                    <title>Rekap Hafalan - PTQA Batuan</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { text-align: center; color: #2c3e50; margin-bottom: 10px; }
                        .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                        th { background-color: #2c3e50; color: white; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .stats { display: flex; gap: 20px; margin-bottom: 20px; }
                        .stat-item { padding: 10px; background: #f0f0f0; border-radius: 5px; }
                        .stat-label { font-size: 12px; color: #666; }
                        .stat-value { font-size: 18px; font-weight: bold; }
                        .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; }
                    </style>
                </head>
                <body>
                    <h1>📖 REKAP HAFALAN SANTRI</h1>
                    <p class="subtitle">PTQA Batuan - Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <div class="stats">
                        <div class="stat-item"><span class="stat-label">Total Data</span><br/><span class="stat-value">${rekapData.length}</span></div>
                        <div class="stat-item"><span class="stat-label">Lancar</span><br/><span class="stat-value">${rekapStats.lancar}</span></div>
                        <div class="stat-item"><span class="stat-label">Sedang</span><br/><span class="stat-value">${rekapStats.sedang}</span></div>
                        <div class="stat-item"><span class="stat-label">Lemah</span><br/><span class="stat-value">${rekapStats.lemah}</span></div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Tanggal</th>
                                <th>Nama Santri</th>
                                <th>Halaqoh</th>
                                <th>Jenis</th>
                                <th>Hafalan</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rekapData.map((h, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${h.tanggal}</td>
                                    <td>${h.santri_nama}</td>
                                    <td>${h.halaqoh_nama || '-'}</td>
                                    <td>${h.jenis}</td>
                                    <td>${h.surah_mulai || h.surah || '-'} (${h.ayat_mulai}-${h.ayat_selesai})</td>
                                    <td>${h.status}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p class="footer">Dokumen ini digenerate secara otomatis dari Sistem Akademik PTQA Batuan</p>
                </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => printWindow.print(), 250)
    }

    // Fungsi Download PDF (generate HTML file untuk download)
    const handleDownloadPDF = () => {
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rekap Hafalan - PTQA Batuan</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; color: #2c3e50; margin-bottom: 10px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #2c3e50; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .stats { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
        .stat-item { padding: 10px 15px; background: #f0f0f0; border-radius: 5px; text-align: center; }
        .stat-label { font-size: 11px; color: #666; }
        .stat-value { font-size: 16px; font-weight: bold; color: #2c3e50; }
        .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <h1>📖 REKAP HAFALAN SANTRI</h1>
    <p class="subtitle">PTQA Batuan - Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <div class="stats">
        <div class="stat-item"><span class="stat-label">Total Data</span><br/><span class="stat-value">${rekapData.length}</span></div>
        <div class="stat-item"><span class="stat-label">Lancar</span><br/><span class="stat-value">${rekapStats.lancar || 0}</span></div>
        <div class="stat-item"><span class="stat-label">Sedang</span><br/><span class="stat-value">${rekapStats.sedang || 0}</span></div>
        <div class="stat-item"><span class="stat-label">Lemah</span><br/><span class="stat-value">${rekapStats.lemah || 0}</span></div>
    </div>
    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Nama Santri</th>
                <th>Halaqoh</th>
                <th>Jenis</th>
                <th>Hafalan</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${rekapData.map((h, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${h.tanggal}</td>
                    <td>${h.santri_nama}</td>
                    <td>${h.halaqoh_nama || '-'}</td>
                    <td>${h.jenis}</td>
                    <td>${h.surah_mulai || h.surah || '-'} (${h.ayat_mulai}-${h.ayat_selesai})</td>
                    <td>${h.status}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    <p class="footer">Dokumen ini digenerate dari Sistem Akademik PTQA Batuan</p>
</body>
</html>`

        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Rekap_Hafalan_${new Date().toISOString().split('T')[0]}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        alert('✅ File berhasil didownload!\n\n💡 Tips: Buka file tersebut di browser, lalu gunakan Ctrl+P dan pilih "Save as PDF" untuk menyimpan sebagai PDF.')
    }

    useEffect(() => {
        if (activeTab === 'rekap') {
            applyRekapFilter()
        }
    }, [activeTab, rekapFilters, hafalan])

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Lancar': return 'badge-success'
            case 'Sedang': return 'badge-info'
            case 'Lemah': return 'badge-warning'
            case 'Baca Nazhor': return 'badge-error'
            // Legacy support
            case 'Mutqin': return 'badge-success'
            case 'Perlu Perbaikan':
            case 'Proses': return 'badge-warning'
            default: return 'badge-secondary'
        }
    }

    const getJenisBadge = (jenis) => {
        switch (jenis) {
            case 'Setoran': return 'badge-info'
            case "Muroja'ah": return 'badge-warning'
            case 'Ziyadah Ulang': return 'badge-success'
            default: return 'badge-secondary'
        }
    }

    return (
        <div className="hafalan-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Hafalan Tahfizh</h1>
                    <p className="page-subtitle">Kelola setoran dan muroja'ah hafalan santri</p>
                </div>
            </div>

            {/* Top Tabs */}
            <div className="hafalan-tabs">
                <button
                    className={`hafalan-tab ${activeTab === 'list' ? 'active' : ''}`}
                    onClick={() => setActiveTab('list')}
                >
                    <FileText size={16} /> Input Hafalan
                </button>
                <button
                    className={`hafalan-tab ${activeTab === 'rekap' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rekap')}
                >
                    <BarChart3 size={16} /> Rekap Hafalan
                </button>
                <button
                    className={`hafalan-tab ${activeTab === 'pencapaian' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pencapaian')}
                >
                    <Trophy size={16} /> Pencapaian
                </button>
            </div>

            {/* ==================== INPUT HAFALAN TAB ==================== */}
            {activeTab === 'list' && (
                <>
                    {/* Mini Dashboard Stats */}
                    <div className="hafalan-stats">
                        <div className="hafalan-stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Total</span>
                                <FileText size={18} className="stat-icon" />
                            </div>
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-bar stat-bar-total"></div>
                        </div>
                        <div className="hafalan-stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Lancar</span>
                                <CheckCircle size={18} className="stat-icon text-success" />
                            </div>
                            <div className="stat-value text-success">{stats.lancar}</div>
                            <div className="stat-bar stat-bar-lancar" style={{ width: stats.total ? `${(stats.lancar / stats.total) * 100}%` : '0%' }}></div>
                        </div>
                        <div className="hafalan-stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Sedang</span>
                                <Clock size={18} className="stat-icon text-info" />
                            </div>
                            <div className="stat-value text-info">{stats.sedang}</div>
                            <div className="stat-bar stat-bar-sedang" style={{ width: stats.total ? `${(stats.sedang / stats.total) * 100}%` : '0%' }}></div>
                        </div>
                        <div className="hafalan-stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Lemah</span>
                                <AlertCircle size={18} className="stat-icon text-warning" />
                            </div>
                            <div className="stat-value text-warning">{stats.lemah}</div>
                            <div className="stat-bar stat-bar-lemah" style={{ width: stats.total ? `${(stats.lemah / stats.total) * 100}%` : '0%' }}></div>
                        </div>
                        <div className="hafalan-stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Baca Nazhor</span>
                                <FileText size={18} className="stat-icon text-purple" />
                            </div>
                            <div className="stat-value text-purple">{stats.bacaNazhor}</div>
                            <div className="stat-bar stat-bar-nazhor" style={{ width: stats.total ? `${(stats.bacaNazhor / stats.total) * 100}%` : '0%' }}></div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="hafalan-filter-tabs">
                        <button className={`filter-tab ${activeFilter === 'Semua' ? 'active' : ''}`} onClick={() => setActiveFilter('Semua')}>Semua</button>
                        <button className={`filter-tab ${activeFilter === 'Setoran' ? 'active' : ''}`} onClick={() => setActiveFilter('Setoran')}>Setoran</button>
                        <button className={`filter-tab ${activeFilter === "Muroja'ah" ? 'active' : ''}`} onClick={() => setActiveFilter("Muroja'ah")}>Muroja'ah</button>
                        <button className={`filter-tab ${activeFilter === 'Ziyadah Ulang' ? 'active' : ''}`} onClick={() => setActiveFilter('Ziyadah Ulang')}>Ziyadah Ulang</button>
                    </div>

                    {/* Date Filter */}
                    <div className="date-filter-row">
                        <div className="date-filter-group">
                            <label><Calendar size={14} /> Dari Tanggal</label>
                            <input
                                type="date"
                                className="form-control"
                                value={dateFilter.dari}
                                onChange={(e) => setDateFilter({ ...dateFilter, dari: e.target.value })}
                            />
                        </div>
                        <div className="date-filter-group">
                            <label><Calendar size={14} /> Sampai Tanggal</label>
                            <input
                                type="date"
                                className="form-control"
                                value={dateFilter.sampai}
                                onChange={(e) => setDateFilter({ ...dateFilter, sampai: e.target.value })}
                            />
                        </div>
                        {(dateFilter.dari || dateFilter.sampai) && (
                            <button className="btn btn-secondary btn-sm" onClick={() => setDateFilter({ dari: '', sampai: '' })}>
                                <RefreshCw size={14} /> Reset
                            </button>
                        )}
                    </div>

                    {/* Halaqoh Filter */}
                    <div className="halaqoh-filter-row">
                        <div className="filter-group">
                            <label><Filter size={14} /> Filter Halaqoh</label>
                            <select
                                className="form-control"
                                value={filterHalaqoh}
                                onChange={(e) => setFilterHalaqoh(e.target.value)}
                            >
                                <option value="">Semua Halaqoh</option>
                                {halaqohList.map(h => <option key={h.id} value={h.id}>{h.nama}</option>)}
                            </select>
                        </div>
                        {filterHalaqoh && (
                            <button className="btn btn-secondary btn-sm" onClick={() => setFilterHalaqoh('')}>
                                <RefreshCw size={14} /> Reset
                            </button>
                        )}
                    </div>

                    {/* Search and Add Buttons */}
                    <div className="hafalan-toolbar">
                        <div className="table-search">
                            <Search size={18} className="search-icon" />
                            <input type="text" placeholder="Cari nama santri..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                        </div>
                        <div className="toolbar-buttons">
                            <Link to="/hafalan/create?jenis=Setoran" className="btn btn-primary btn-hafalan">
                                <Plus size={16} /> <span>Setoran</span>
                            </Link>
                            <Link to="/hafalan/create?jenis=Muroja'ah" className="btn btn-info btn-hafalan">
                                <Plus size={16} /> <span>Muroja'ah</span>
                            </Link>
                            <Link to="/hafalan/create?jenis=Ziyadah Ulang" className="btn btn-warning btn-hafalan">
                                <Plus size={16} /> <span>Ziyadah</span>
                            </Link>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-container">
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Nama Santri</th>
                                        <th>Kelas</th>
                                        <th>Hafalan</th>
                                        <th>Jenis</th>
                                        <th>Status</th>
                                        <th>Penguji</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="8" className="text-center"><RefreshCw size={20} className="spin" /> Loading...</td></tr>
                                    ) : filteredHafalan.length === 0 ? (
                                        <tr><td colSpan="8" className="text-center">Tidak ada data hafalan</td></tr>
                                    ) : (
                                        filteredHafalan.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.tanggal}</td>
                                                <td className="name-cell">{item.santri_nama}</td>
                                                <td>{item.kelas_nama}</td>
                                                <td>
                                                    <div className="hafalan-info">
                                                        <strong>Juz {item.juz} - {item.surah}</strong>
                                                        <span className="text-muted">Ayat {item.ayat_mulai}-{item.ayat_selesai}</span>
                                                    </div>
                                                </td>
                                                <td><span className={`badge ${getJenisBadge(item.jenis)}`}>{item.jenis || 'Setoran'}</span></td>
                                                <td><span className={`badge ${getStatusBadge(item.status)}`}>{item.status}</span></td>
                                                <td>{item.penguji_nama}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button className="btn-icon btn-icon-success" title="Kirim WhatsApp" onClick={() => sendWhatsApp(item)}><MessageCircle size={16} /></button>
                                                        <Link to={`/hafalan/${item.id}/edit`} className="btn-icon" title="Edit"><Edit size={16} /></Link>
                                                        <button className="btn-icon btn-icon-danger" title="Hapus" onClick={() => { setSelectedHafalan(item); setShowDeleteModal(true) }}><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ==================== REKAP HAFALAN TAB ==================== */}
            {activeTab === 'rekap' && (
                <>
                    {/* Rekap Filters */}
                    <div className="rekap-filters">
                        <div className="filter-group">
                            <label className="filter-label"><Calendar size={14} /> Dari Tanggal</label>
                            <input
                                type="date"
                                className="form-control"
                                value={rekapFilters.tanggalMulai}
                                onChange={(e) => setRekapFilters({ ...rekapFilters, tanggalMulai: e.target.value })}
                            />
                        </div>
                        <div className="filter-group">
                            <label className="filter-label"><Calendar size={14} /> Sampai Tanggal</label>
                            <input
                                type="date"
                                className="form-control"
                                value={rekapFilters.tanggalSelesai}
                                onChange={(e) => setRekapFilters({ ...rekapFilters, tanggalSelesai: e.target.value })}
                            />
                        </div>
                        <div className="filter-group">
                            <label className="filter-label"><Filter size={14} /> Halaqoh</label>
                            <select
                                className="form-control"
                                value={rekapFilters.halaqoh_id}
                                onChange={(e) => setRekapFilters({ ...rekapFilters, halaqoh_id: e.target.value })}
                            >
                                <option value="">Semua Halaqoh</option>
                                {halaqohList.map(h => <option key={h.id} value={h.id}>{h.nama}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label className="filter-label"><Search size={14} /> Nama Santri</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Cari nama..."
                                value={rekapFilters.santri_nama}
                                onChange={(e) => setRekapFilters({ ...rekapFilters, santri_nama: e.target.value })}
                            />
                        </div>
                        <div className="filter-group filter-actions">
                            <button className="btn btn-secondary" onClick={() => setRekapFilters({ tanggalMulai: '', tanggalSelesai: '', halaqoh_id: '', santri_nama: '' })}>
                                <RefreshCw size={14} /> Reset
                            </button>
                            <button className="btn btn-primary" onClick={handlePrint}>
                                <Printer size={14} /> Print
                            </button>
                            <button className="btn btn-success" onClick={handleDownloadPDF}>
                                <Download size={14} /> PDF
                            </button>
                        </div>
                    </div>

                    {/* Rekap Mini Dashboard */}
                    <div className="hafalan-stats">
                        <div className="hafalan-stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Total Data</span>
                                <FileText size={18} className="stat-icon text-primary" />
                            </div>
                            <div className="stat-value">{rekapStats.totalData || rekapData.length}</div>
                            <div className="stat-bar stat-bar-total"></div>
                        </div>
                        <div className="hafalan-stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Lancar</span>
                                <CheckCircle size={18} className="stat-icon text-success" />
                            </div>
                            <div className="stat-value text-success">{rekapStats.lancar}</div>
                            <div className="stat-bar stat-bar-lancar" style={{ width: rekapData.length ? `${(rekapStats.lancar / rekapData.length) * 100}%` : '0%' }}></div>
                        </div>
                        <div className="hafalan-stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Sedang</span>
                                <Clock size={18} className="stat-icon text-info" />
                            </div>
                            <div className="stat-value text-info">{rekapStats.sedang}</div>
                            <div className="stat-bar stat-bar-sedang" style={{ width: rekapData.length ? `${(rekapStats.sedang / rekapData.length) * 100}%` : '0%' }}></div>
                        </div>
                        <div className="hafalan-stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Lemah</span>
                                <AlertCircle size={18} className="stat-icon text-warning" />
                            </div>
                            <div className="stat-value text-warning">{rekapStats.lemah}</div>
                            <div className="stat-bar stat-bar-lemah" style={{ width: rekapData.length ? `${(rekapStats.lemah / rekapData.length) * 100}%` : '0%' }}></div>
                        </div>
                        <div className="hafalan-stat-card">
                            <div className="stat-header">
                                <span className="stat-label">Baca Nazhor</span>
                                <FileText size={18} className="stat-icon text-purple" />
                            </div>
                            <div className="stat-value text-purple">{rekapStats.bacaNazhor}</div>
                            <div className="stat-bar stat-bar-nazhor" style={{ width: rekapData.length ? `${(rekapStats.bacaNazhor / rekapData.length) * 100}%` : '0%' }}></div>
                        </div>
                    </div>

                    {/* Rekap Table */}
                    <div className="table-container" id="rekap-print-area">
                        <div className="table-header">
                            <h3 className="table-title">Data Rekap ({rekapData.length} record)</h3>
                        </div>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Tanggal</th>
                                        <th>Nama Santri</th>
                                        <th>Halaqoh</th>
                                        <th>Hafalan</th>
                                        <th>Jenis</th>
                                        <th>Status</th>
                                        <th>Penguji</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="8" className="text-center"><RefreshCw size={20} className="spin" /> Loading...</td></tr>
                                    ) : rekapData.length === 0 ? (
                                        <tr><td colSpan="8" className="text-center">Tidak ada data. Sesuaikan filter.</td></tr>
                                    ) : (
                                        rekapData.map((item, idx) => (
                                            <tr key={item.id}>
                                                <td>{idx + 1}</td>
                                                <td>{item.tanggal}</td>
                                                <td className="name-cell">{item.santri_nama}</td>
                                                <td>{item.halaqoh_nama}</td>
                                                <td>
                                                    <div className="hafalan-info">
                                                        <strong>Juz {item.juz} - {item.surah}</strong>
                                                        <span className="text-muted">Ayat {item.ayat_mulai}-{item.ayat_selesai}</span>
                                                    </div>
                                                </td>
                                                <td><span className={`badge ${getJenisBadge(item.jenis)}`}>{item.jenis || 'Setoran'}</span></td>
                                                <td><span className={`badge ${getStatusBadge(item.status)}`}>{item.status}</span></td>
                                                <td>{item.penguji_nama}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ==================== PENCAPAIAN TAB ==================== */}
            {activeTab === 'pencapaian' && (
                <>
                    {/* Filter Bar */}
                    <div className="filter-bar mb-4">
                        <div className="filter-group">
                            <label>Semester</label>
                            <select
                                value={pencapaianSemester}
                                onChange={(e) => setPencapaianSemester(e.target.value)}
                                className="form-select"
                            >
                                <option value="">-- Pilih Semester --</option>
                                {semesterList.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.nama} - {s.tahun_ajaran} {s.is_active ? '(Aktif)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Cari Santri</label>
                            <input
                                type="text"
                                placeholder="Ketik nama santri..."
                                value={pencapaianSearch}
                                onChange={(e) => setPencapaianSearch(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <div className="filter-group filter-action">
                            <button className="btn btn-primary btn-save" onClick={savePencapaian} disabled={savingPencapaian || !pencapaianSemester}>
                                {savingPencapaian ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                                <span>{savingPencapaian ? 'Menyimpan...' : 'Simpan'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Pencapaian Table */}
                    <div className="table-container">
                        <div className="table-header">
                            <h3 className="table-title"><Trophy size={20} /> Pencapaian Hafalan Semester ({santriList.filter(s => s.nama.toLowerCase().includes(pencapaianSearch.toLowerCase())).length} santri)</h3>
                        </div>

                        <div className="table-wrapper">
                            <table className="table pencapaian-table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Nama Santri</th>
                                        <th>Kelas</th>
                                        <th>Jumlah Hafalan (Semester)</th>
                                        <th>Predikat</th>
                                        <th>Total Hafalan (Keseluruhan)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!pencapaianSemester ? (
                                        <tr><td colSpan="6" className="text-center">Pilih semester terlebih dahulu</td></tr>
                                    ) : santriList.filter(s => s.nama.toLowerCase().includes(pencapaianSearch.toLowerCase())).length === 0 ? (
                                        <tr><td colSpan="6" className="text-center">Tidak ada data santri</td></tr>
                                    ) : (
                                        santriList
                                            .filter(s => s.nama.toLowerCase().includes(pencapaianSearch.toLowerCase()))
                                            .map((santri, index) => (
                                                <tr key={santri.id}>
                                                    <td>{index + 1}</td>
                                                    <td className="name-cell">{santri.nama}</td>
                                                    <td>{santri.kelas}</td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            placeholder="Contoh: 3 Juz"
                                                            value={pencapaianData[santri.id]?.jumlah_hafalan || ''}
                                                            onChange={(e) => handlePencapaianChange(santri.id, 'jumlah_hafalan', e.target.value)}
                                                            className="form-input-sm"
                                                        />
                                                    </td>
                                                    <td>
                                                        <select
                                                            value={pencapaianData[santri.id]?.predikat || 'Baik'}
                                                            onChange={(e) => handlePencapaianChange(santri.id, 'predikat', e.target.value)}
                                                            className="form-select-sm"
                                                        >
                                                            <option value="Sangat Baik">Sangat Baik</option>
                                                            <option value="Baik">Baik</option>
                                                            <option value="Cukup">Cukup</option>
                                                            <option value="Kurang">Kurang</option>
                                                            <option value="Buruk">Buruk</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            placeholder="Contoh: 10 Juz"
                                                            value={pencapaianData[santri.id]?.total_hafalan || ''}
                                                            onChange={(e) => handlePencapaianChange(santri.id, 'total_hafalan', e.target.value)}
                                                            className="form-input-sm"
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="modal-overlay active">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">Konfirmasi Hapus</h3>
                            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Apakah Anda yakin ingin menghapus data hafalan ini?</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Batal</button>
                            <button className="btn btn-danger" onClick={handleDelete}>Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HafalanList
