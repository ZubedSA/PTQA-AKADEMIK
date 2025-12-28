-- Cek data hafalan untuk halaqoh "Imam 'Ashim Al-Kufi" dengan tanggal
SELECT 
    s.nama as santri_nama,
    h.jenis,
    h.tanggal,
    h.ayat_mulai,
    h.ayat_selesai
FROM hafalan h
JOIN santri s ON h.santri_id = s.id
JOIN halaqoh hal ON s.halaqoh_id = hal.id
WHERE hal.nama LIKE '%Ashim%'
ORDER BY h.tanggal DESC;
