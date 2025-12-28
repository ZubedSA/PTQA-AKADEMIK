-- =====================================================
-- FIX: TAMBAHKAN BENDAHARA KE RLS POLICIES
-- Sistem Akademik PTQ Al-Usymuni Batuan
-- =====================================================
-- JALANKAN SQL INI DI SUPABASE SQL EDITOR
-- =====================================================

-- =====================================================
-- 1. UPDATE HELPER FUNCTION is_admin_or_guru
-- Tambahkan bendahara ke function ini
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin_or_guru()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'guru', 'bendahara');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. DROP & RECREATE SANTRI SELECT POLICY
-- =====================================================

DROP POLICY IF EXISTS "santri_select_policy" ON santri;

CREATE POLICY "santri_select_policy" ON santri
FOR SELECT USING (
    CASE get_user_role()
        WHEN 'admin' THEN true
        WHEN 'guru' THEN true
        WHEN 'bendahara' THEN true  -- ✅ ADDED
        WHEN 'wali' THEN id = ANY(get_wali_santri_ids())
        ELSE false
    END
);

-- =====================================================
-- 3. DROP & RECREATE HAFALAN SELECT POLICY
-- =====================================================

DROP POLICY IF EXISTS "hafalan_select_policy" ON hafalan;

CREATE POLICY "hafalan_select_policy" ON hafalan
FOR SELECT USING (
    CASE get_user_role()
        WHEN 'admin' THEN true
        WHEN 'guru' THEN true
        WHEN 'bendahara' THEN true  -- ✅ ADDED
        WHEN 'wali' THEN santri_id = ANY(get_wali_santri_ids())
        ELSE false
    END
);

-- =====================================================
-- 4. DROP & RECREATE PRESENSI SELECT POLICY
-- =====================================================

DROP POLICY IF EXISTS "presensi_select_policy" ON presensi;

CREATE POLICY "presensi_select_policy" ON presensi
FOR SELECT USING (
    CASE get_user_role()
        WHEN 'admin' THEN true
        WHEN 'guru' THEN true
        WHEN 'bendahara' THEN true  -- ✅ ADDED
        WHEN 'wali' THEN santri_id = ANY(get_wali_santri_ids())
        ELSE false
    END
);

-- =====================================================
-- 5. DROP & RECREATE NILAI SELECT POLICY
-- =====================================================

DROP POLICY IF EXISTS "nilai_select_policy" ON nilai;

CREATE POLICY "nilai_select_policy" ON nilai
FOR SELECT USING (
    CASE get_user_role()
        WHEN 'admin' THEN true
        WHEN 'guru' THEN true
        WHEN 'bendahara' THEN true  -- ✅ ADDED
        WHEN 'wali' THEN santri_id = ANY(get_wali_santri_ids())
        ELSE false
    END
);

-- =====================================================
-- 6. VERIFY CHANGES
-- =====================================================

-- Check policies
SELECT 
    tablename, 
    policyname, 
    cmd 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('santri', 'hafalan', 'presensi', 'nilai')
ORDER BY tablename, policyname;

-- =====================================================
-- DONE! Refresh browser setelah menjalankan SQL ini
-- =====================================================
