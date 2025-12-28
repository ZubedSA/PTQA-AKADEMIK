-- =========================================
-- DIAGNOSTIC: Cek nilai jenis hafalan di database
-- Jalankan di Supabase SQL Editor
-- =========================================

-- 1. Lihat SEMUA nilai jenis yang ada (case sensitive)
SELECT 
    jenis,
    COUNT(*) as jumlah,
    MIN(tanggal) as tanggal_awal,
    MAX(tanggal) as tanggal_akhir
FROM hafalan 
GROUP BY jenis 
ORDER BY jumlah DESC;

-- 2. Lihat data Ziyadah Ulang (cek exact value)
SELECT id, santri_id, jenis, tanggal, ayat_mulai, ayat_selesai
FROM hafalan 
WHERE LOWER(jenis) LIKE '%ziyadah%'
ORDER BY tanggal DESC
LIMIT 10;

-- 3. Lihat data Murajaah (cek exact value)
SELECT id, santri_id, jenis, tanggal, ayat_mulai, ayat_selesai
FROM hafalan 
WHERE LOWER(jenis) LIKE '%muraja%' OR LOWER(jenis) LIKE '%muroja%'
ORDER BY tanggal DESC
LIMIT 10;

-- 4. Lihat data minggu ini (Desember 2024, Minggu ke-4: 22-28)
SELECT 
    s.nama as santri_nama,
    h.jenis,
    h.tanggal,
    h.ayat_mulai,
    h.ayat_selesai,
    (h.ayat_selesai - h.ayat_mulai + 1) as total_ayat
FROM hafalan h
JOIN santri s ON h.santri_id = s.id
WHERE h.tanggal >= '2024-12-22' AND h.tanggal <= '2024-12-28'
ORDER BY h.tanggal DESC, s.nama;

-- 5. Cek apakah ada mismatch halaqoh_id
SELECT 
    s.nama,
    s.halaqoh_id,
    hal.nama as halaqoh_nama,
    COUNT(h.id) as total_hafalan
FROM santri s
LEFT JOIN halaqoh hal ON s.halaqoh_id = hal.id
LEFT JOIN hafalan h ON h.santri_id = s.id AND h.tanggal >= '2024-12-22'
GROUP BY s.id, s.nama, s.halaqoh_id, hal.nama
HAVING COUNT(h.id) > 0
ORDER BY s.nama;
