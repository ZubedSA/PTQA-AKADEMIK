/**
 * PDF Utility Functions
 * Untuk generate PDF laporan keuangan
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Generate PDF laporan standar
 * @param {object} options - Opsi generate PDF
 */
export const generateLaporanPDF = (options) => {
    const {
        title = 'Laporan',
        subtitle = '',
        columns = [],
        data = [],
        filename = 'laporan',
        orientation = 'portrait',
        showTotal = true,
        totalLabel = 'Total',
        totalValue = null,
        additionalInfo = []
    } = options

    const doc = new jsPDF(orientation)
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 15

    // Header - Kop Surat
    doc.setFillColor(5, 150, 105)
    doc.rect(14, y, pageWidth - 28, 25, 'F')

    doc.setTextColor(255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('YAYASAN ABDULLAH DEWI HASANAH', pageWidth / 2, y + 8, { align: 'center' })
    doc.setFontSize(12)
    doc.text('PONDOK PESANTREN TAHFIZH QUR\'AN AL-USYMUNI BATUAN', pageWidth / 2, y + 15, { align: 'center' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Jl. Raya Lenteng Ds. Batuan Barat RT 002 RW 004, Kec. Batuan, Kab. Sumenep', pageWidth / 2, y + 21, { align: 'center' })

    y += 30
    doc.setTextColor(0)

    // Title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(title.toUpperCase(), pageWidth / 2, y, { align: 'center' })
    y += 6

    if (subtitle) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(subtitle, pageWidth / 2, y, { align: 'center' })
        y += 6
    }

    // Additional Info
    if (additionalInfo.length > 0) {
        y += 4
        doc.setFontSize(10)
        additionalInfo.forEach(info => {
            doc.text(`${info.label}: ${info.value}`, 14, y)
            y += 5
        })
    }

    y += 4

    // Table
    const tableBody = data.map((row, index) => {
        if (Array.isArray(row)) {
            return [index + 1, ...row]
        }
        return [index + 1, ...Object.values(row)]
    })

    const tableColumns = ['No', ...columns]

    autoTable(doc, {
        startY: y,
        head: [tableColumns],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [5, 150, 105],
            textColor: 255,
            halign: 'center',
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
    })

    // Total
    const finalY = (doc.previousAutoTable?.finalY || y + 50) + 10

    if (showTotal && totalValue !== null) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`${totalLabel}: Rp ${Number(totalValue).toLocaleString('id-ID')}`, pageWidth - 14, finalY, { align: 'right' })
    }

    // Footer
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, finalY + 15)
    doc.text('Sistem Akademik PTQA Batuan', pageWidth / 2, finalY + 25, { align: 'center' })

    // Save
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
}

/**
 * Generate PDF kwitansi pembayaran
 * @param {object} data - Data pembayaran
 */
export const generateKwitansiPDF = (data) => {
    const {
        nomorKwitansi,
        tanggal,
        namaSantri,
        kelas,
        kategori,
        jumlah,
        metode,
        kasir
    } = data

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 20

    // Header
    doc.setFillColor(5, 150, 105)
    doc.rect(14, y, pageWidth - 28, 20, 'F')

    doc.setTextColor(255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('KWITANSI PEMBAYARAN', pageWidth / 2, y + 13, { align: 'center' })

    y += 30
    doc.setTextColor(0)

    // Nomor Kwitansi
    doc.setFontSize(10)
    doc.text(`No: ${nomorKwitansi}`, 14, y)
    doc.text(`Tanggal: ${new Date(tanggal).toLocaleDateString('id-ID')}`, pageWidth - 14, y, { align: 'right' })

    y += 15

    // Content
    doc.setDrawColor(200)
    doc.rect(14, y, pageWidth - 28, 60)

    y += 10
    const labelX = 20
    const valueX = 60

    doc.text('Diterima dari', labelX, y)
    doc.text(`: ${namaSantri}`, valueX, y)

    y += 8
    doc.text('Kelas', labelX, y)
    doc.text(`: ${kelas || '-'}`, valueX, y)

    y += 8
    doc.text('Untuk Pembayaran', labelX, y)
    doc.text(`: ${kategori}`, valueX, y)

    y += 8
    doc.text('Jumlah', labelX, y)
    doc.setFont('helvetica', 'bold')
    doc.text(`: Rp ${Number(jumlah).toLocaleString('id-ID')}`, valueX, y)
    doc.setFont('helvetica', 'normal')

    y += 8
    doc.text('Metode Bayar', labelX, y)
    doc.text(`: ${metode}`, valueX, y)

    y += 25

    // Tanda Tangan
    doc.text('Hormat Kami,', pageWidth - 50, y, { align: 'center' })
    y += 20
    doc.line(pageWidth - 80, y, pageWidth - 20, y)
    y += 5
    doc.text(kasir || 'Bendahara', pageWidth - 50, y, { align: 'center' })

    // Footer
    y += 20
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text('PTQA Batuan - Pondok Pesantren Tahfizh Qur\'an Al-Usymuni Batuan', pageWidth / 2, y, { align: 'center' })

    // Save
    doc.save(`Kwitansi_${nomorKwitansi}_${namaSantri.replace(/\s/g, '_')}.pdf`)
}

export default {
    generateLaporanPDF,
    generateKwitansiPDF
}
