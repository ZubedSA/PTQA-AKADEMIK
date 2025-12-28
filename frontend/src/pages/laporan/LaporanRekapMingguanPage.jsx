import { useState, useEffect } from 'react'
import { Calendar, RefreshCw, Download, Printer, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import './Laporan.css'

const bulanOptions = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
]

const LaporanRekapMingguanPage = () => {
    const [loading, setLoading] = useState(false)
    const [halaqoh, setHalaqoh] = useState([])
    const [data, setData] = useState([])
    const [filters, setFilters] = useState({
        halaqoh_id: '',
        minggu: Math.ceil(new Date().getDate() / 7),
        bulan: new Date().getMonth() + 1,
        tahun: new Date().getFullYear()
    })

    useEffect(() => {
        fetchHalaqoh()
    }, [])

    const fetchHalaqoh = async () => {
        const { data } = await supabase.from('halaqoh').select('id, nama').order('nama')
        if (data) setHalaqoh(data)
    }

    // Calculate week date range
    const getWeekRange = () => {
        const startDay = (filters.minggu - 1) * 7 + 1
        const endDay = Math.min(filters.minggu * 7, new Date(filters.tahun, filters.bulan, 0).getDate())
        const startDate = new Date(filters.tahun, filters.bulan - 1, startDay)
        const endDate = new Date(filters.tahun, filters.bulan - 1, endDay)
        return {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
        }
    }

    const fetchData = async () => {
        if (!filters.halaqoh_id) return
        setLoading(true)

        try {
            // Get santri in this halaqoh
            const { data: santriData } = await supabase
                .from('santri')
                .select('id, nama, nis')
                .eq('halaqoh_id', filters.halaqoh_id)
                .eq('status', 'Aktif')
                .order('nama')

            if (!santriData || santriData.length === 0) {
                setData([])
                setLoading(false)
                return
            }

            const santriIds = santriData.map(s => s.id)
            const { start, end } = getWeekRange()
            console.log('📅 Date range:', start, 'to', end)

            // Get hafalan data for the week
            const { data: hafalanData, error: hafalanError } = await supabase
                .from('hafalan')
                .select('santri_id, jenis, ayat_mulai, ayat_selesai, status, tanggal')
                .in('santri_id', santriIds)
                .gte('tanggal', start)
                .lte('tanggal', end)

            if (hafalanError) {
                console.error('❌ Hafalan query error:', hafalanError)
            }

            console.log('📖 Hafalan data count:', hafalanData?.length)
            console.log('📋 RAW Hafalan data:', hafalanData)

            // Debug: Log all unique jenis values
            const uniqueJenis = [...new Set(hafalanData?.map(h => h.jenis) || [])]
            console.log('🏷️ Unique jenis values in data:', uniqueJenis)

            // Get presensi data for the week
            const { data: presensiData } = await supabase
                .from('presensi')
                .select('santri_id, status')
                .in('santri_id', santriIds)
                .gte('tanggal', start)
                .lte('tanggal', end)


            // Aggregate data per santri
            const aggregatedData = santriData.map(santri => {
                const hafalans = hafalanData?.filter(h => h.santri_id === santri.id) || []
                const presensis = presensiData?.filter(p => p.santri_id === santri.id) || []

                // Fungsi match jenis yang lebih robust menggunakan includes()
                const matchJenis = (jenis, target) => {
                    const normalized = (jenis || '').toLowerCase().trim()
                    let result = false
                    switch (target) {
                        case 'setoran':
                            result = normalized === 'setoran' || !jenis
                            break
                        case 'murajaah':
                            result = normalized.includes('muroja') || normalized.includes('muraja')
                            break
                        case 'ziyadah':
                            result = normalized.includes('ziyadah')
                            break
                        default:
                            result = false
                    }
                    return result
                }

                const setoran = hafalans.filter(h => matchJenis(h.jenis, 'setoran'))
                const murajaah = hafalans.filter(h => matchJenis(h.jenis, 'murajaah'))
                const ziyadahUlang = hafalans.filter(h => matchJenis(h.jenis, 'ziyadah'))

                // Debug per santri
                if (hafalans.length > 0) {
                    console.log(`👤 ${santri.nama}: total=${hafalans.length}, setoran=${setoran.length}, murajaah=${murajaah.length}, ziyadah=${ziyadahUlang.length}`)
                    console.log(`   Jenis values:`, hafalans.map(h => h.jenis))
                }

                const totalAyatSetoran = setoran.reduce((sum, h) => sum + Math.max(0, (h.ayat_selesai || 0) - (h.ayat_mulai || 0) + 1), 0)
                const totalAyatMurajaah = murajaah.reduce((sum, h) => sum + Math.max(0, (h.ayat_selesai || 0) - (h.ayat_mulai || 0) + 1), 0)
                const totalAyatZiyadah = ziyadahUlang.reduce((sum, h) => sum + Math.max(0, (h.ayat_selesai || 0) - (h.ayat_mulai || 0) + 1), 0)

                const hadir = presensis.filter(p => p.status === 'hadir').length
                const totalHari = presensis.length

                // Determine status based on performance
                let status = 'Belum Ada Data'
                if (hafalans.length > 0) {
                    const lancar = hafalans.filter(h => h.status === 'Lancar').length
                    const total = hafalans.length
                    const ratio = lancar / total
                    if (ratio >= 0.8) status = 'Sangat Baik'
                    else if (ratio >= 0.6) status = 'Baik'
                    else if (ratio >= 0.4) status = 'Cukup'
                    else status = 'Perlu Perhatian'
                }

                return {
                    ...santri,
                    setoran_count: setoran.length,
                    setoran_ayat: totalAyatSetoran,
                    murajaah_count: murajaah.length,
                    murajaah_ayat: totalAyatMurajaah,
                    ziyadah_count: ziyadahUlang.length,
                    ziyadah_ayat: totalAyatZiyadah,
                    total_ayat: totalAyatSetoran + totalAyatMurajaah + totalAyatZiyadah,
                    kehadiran: totalHari > 0 ? `${hadir}/${totalHari}` : '-',
                    status
                }
            })

            setData(aggregatedData)
        } catch (err) {
            console.error('Error fetching data:', err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (filters.halaqoh_id) fetchData()
    }, [filters.halaqoh_id, filters.minggu, filters.bulan, filters.tahun])

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Sangat Baik': return 'badge-success'
            case 'Baik': return 'badge-info'
            case 'Cukup': return 'badge-warning'
            case 'Perlu Perhatian': return 'badge-danger'
            default: return ''
        }
    }

    const generatePDF = () => {
        if (data.length === 0) return

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const selectedHalaqoh = halaqoh.find(h => h.id === filters.halaqoh_id)
        const { start, end } = getWeekRange()
        const bulanNama = new Date(filters.tahun, filters.bulan - 1).toLocaleDateString('id-ID', { month: 'long' })

        // Header
        doc.setFillColor(5, 150, 105)
        doc.rect(0, 0, pageWidth, 25, 'F')
        doc.setTextColor(255)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('LAPORAN REKAP MINGGUAN', pageWidth / 2, 12, { align: 'center' })
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('PTQA Batuan - Si-Taqua', pageWidth / 2, 19, { align: 'center' })

        // Info
        doc.setTextColor(0)
        doc.setFontSize(10)
        doc.text(`Halaqoh: ${selectedHalaqoh?.nama || '-'}`, 14, 35)
        doc.text(`Periode: Minggu ${filters.minggu} - ${bulanNama} ${filters.tahun}`, 14, 42)
        doc.text(`Tanggal: ${new Date(start).toLocaleDateString('id-ID')} s/d ${new Date(end).toLocaleDateString('id-ID')}`, 14, 49)

        // Table
        autoTable(doc, {
            startY: 57,
            head: [['No', 'NIS', 'Nama', 'Setoran', 'Murajaah', 'Total Ayat', 'Kehadiran', 'Status']],
            body: data.map((s, i) => [
                i + 1,
                s.nis,
                s.nama,
                `${s.setoran_count}x (${s.setoran_ayat})`,
                `${s.murajaah_count}x (${s.murajaah_ayat})`,
                s.total_ayat,
                s.kehadiran,
                s.status
            ]),
            theme: 'grid',
            headStyles: { fillColor: [5, 150, 105] },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 20 },
                5: { halign: 'center' },
                6: { halign: 'center' }
            },
            margin: { left: 14, right: 14 }
        })

        // Footer
        const finalY = doc.previousAutoTable.finalY + 15
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.text(`Total: ${data.length} santri`, 14, finalY)
        doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')} - Si-Taqua PTQA Batuan`, pageWidth / 2, finalY + 8, { align: 'center' })

        doc.save(`Rekap_Mingguan_${filters.tahun}_${filters.bulan}_Minggu${filters.minggu}.pdf`)
    }

    return (
        <div className="laporan-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <Calendar className="title-icon blue" /> Laporan Rekap Mingguan
                    </h1>
                    <p className="page-subtitle">Rekap hafalan per minggu</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" disabled={data.length === 0} onClick={generatePDF}>
                        <Download size={18} /> Download PDF
                    </button>
                    <button className="btn btn-outline" disabled={data.length === 0} onClick={() => window.print()}>
                        <Printer size={18} /> Print
                    </button>
                </div>
            </div>

            <div className="filter-section">
                <div className="form-group">
                    <label className="form-label">Halaqoh *</label>
                    <select
                        className="form-control"
                        value={filters.halaqoh_id}
                        onChange={e => setFilters({ ...filters, halaqoh_id: e.target.value })}
                    >
                        <option value="">Pilih Halaqoh</option>
                        {halaqoh.map(h => (
                            <option key={h.id} value={h.id}>{h.nama}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Minggu</label>
                    <select
                        className="form-control"
                        value={filters.minggu}
                        onChange={e => setFilters({ ...filters, minggu: parseInt(e.target.value) })}
                    >
                        <option value={1}>Minggu 1 (1-7)</option>
                        <option value={2}>Minggu 2 (8-14)</option>
                        <option value={3}>Minggu 3 (15-21)</option>
                        <option value={4}>Minggu 4 (22-28)</option>
                        <option value={5}>Minggu 5 (29+)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Bulan</label>
                    <select
                        className="form-control"
                        value={filters.bulan}
                        onChange={e => setFilters({ ...filters, bulan: parseInt(e.target.value) })}
                    >
                        {bulanOptions.map(b => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Tahun</label>
                    <input
                        type="number"
                        className="form-control"
                        value={filters.tahun}
                        onChange={e => setFilters({ ...filters, tahun: parseInt(e.target.value) })}
                    />
                </div>
            </div>

            {/* Info periode yang dipilih */}
            {filters.halaqoh_id && (
                <div style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} style={{ color: '#059669' }} />
                        <strong>Periode:</strong> Minggu {filters.minggu} - {bulanOptions.find(b => b.value === filters.bulan)?.label} {filters.tahun}
                    </div>
                    <div style={{ color: '#166534' }}>
                        📅 {(() => {
                            const { start, end } = getWeekRange()
                            return `${new Date(start).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })} s/d ${new Date(end).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`
                        })()}
                    </div>
                </div>
            )}

            <div className="card">
                {loading ? (
                    <div className="loading-state">
                        <RefreshCw className="spin" size={24} />
                        <span>Memuat data...</span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="empty-state">
                        <Users size={48} />
                        <p>Pilih halaqoh untuk melihat laporan</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>NIS</th>
                                    <th>Nama Santri</th>
                                    <th style={{ textAlign: 'center' }}>Setoran</th>
                                    <th style={{ textAlign: 'center' }}>Murajaah</th>
                                    <th style={{ textAlign: 'center' }}>Ziyadah Ulang</th>
                                    <th style={{ textAlign: 'center' }}>Total Ayat</th>
                                    <th style={{ textAlign: 'center' }}>Kehadiran</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((s, i) => (
                                    <tr key={s.id}>
                                        <td>{i + 1}</td>
                                        <td>{s.nis}</td>
                                        <td>{s.nama}</td>
                                        <td style={{ textAlign: 'center' }}>{s.setoran_count}x ({s.setoran_ayat} ayat)</td>
                                        <td style={{ textAlign: 'center' }}>{s.murajaah_count}x ({s.murajaah_ayat} ayat)</td>
                                        <td style={{ textAlign: 'center' }}>{s.ziyadah_count || 0}x ({s.ziyadah_ayat || 0} ayat)</td>
                                        <td style={{ textAlign: 'center', fontWeight: '600' }}>{s.total_ayat}</td>
                                        <td style={{ textAlign: 'center' }}>{s.kehadiran}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`badge ${getStatusBadgeClass(s.status)}`}>{s.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot style={{ backgroundColor: '#f8f9fa', fontWeight: '600' }}>
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'right', paddingRight: '12px' }}>
                                        <strong>TOTAL ({data.length} santri)</strong>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {data.reduce((sum, s) => sum + s.setoran_count, 0)}x ({data.reduce((sum, s) => sum + s.setoran_ayat, 0)} ayat)
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {data.reduce((sum, s) => sum + s.murajaah_count, 0)}x ({data.reduce((sum, s) => sum + s.murajaah_ayat, 0)} ayat)
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {data.reduce((sum, s) => sum + (s.ziyadah_count || 0), 0)}x ({data.reduce((sum, s) => sum + (s.ziyadah_ayat || 0), 0)} ayat)
                                    </td>
                                    <td style={{ textAlign: 'center', color: '#059669' }}>
                                        {data.reduce((sum, s) => sum + s.total_ayat, 0)}
                                    </td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LaporanRekapMingguanPage
