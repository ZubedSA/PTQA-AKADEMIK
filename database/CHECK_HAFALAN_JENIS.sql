-- Script untuk mengecek data jenis hafalan yang tersimpan di database
-- Jalankan query ini di Supabase SQL Editor untuk melihat nilai jenis yang ada

-- Lihat semua jenis unik yang ada di tabel hafalan
SELECT DISTINCT jenis, COUNT(*) as jumlah 
FROM hafalan 
GROUP BY jenis 
ORDER BY jumlah DESC;

-- Lihat data hafalan terbaru dengan jenis-nya
SELECT 
    h.id,
    s.nama as santri_nama,
    h.jenis,
    h.tanggal,
    h.surah_mulai,
    h.ayat_mulai,
    h.ayat_selesai,
    h.created_at
FROM hafalan h
LEFT JOIN santri s ON h.santri_id = s.id
ORDER BY h.created_at DESC
LIMIT 20;

-- Cek apakah ada data dengan jenis 'Ziyadah Ulang'
SELECT COUNT(*) as total_ziyadah_ulang 
FROM hafalan 
WHERE jenis = 'Ziyadah Ulang';

-- Cek apakah ada data dengan jenis yang mirip (case insensitive)
SELECT DISTINCT jenis, COUNT(*) as jumlah 
FROM hafalan 
WHERE LOWER(jenis) LIKE '%ziyadah%'
GROUP BY jenis;
