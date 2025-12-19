-- =====================================================
-- HARD RESET RLS POLICIES (FORCE STRICT SECURITY)
-- =====================================================
-- WARNING: Script ini akan MENGHAPUS SEMUA policies pada tabel terkait
-- dan membuat ulang dengan kebijakan KETAT.
-- =====================================================

-- 1. Helper function untuk drop semua policy di tabel tertentu
CREATE OR REPLACE FUNCTION drop_all_policies(table_name text) RETURNS void AS $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = table_name 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, table_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Pastikan Fungsi Helper Security Benar
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM user_profiles
    WHERE user_id = auth.uid();
    
    RETURN COALESCE(user_role, 'guest');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RESET SANTRI (CRITICAL)
SELECT drop_all_policies('santri'); -- Hapus semua policy lama yang mungkin bocor
ALTER TABLE santri ENABLE ROW LEVEL SECURITY; -- Pastikan aktif

-- Policy: Admin/Guru FULL, Wali STRICT
CREATE POLICY "santri_select_strict" ON santri
FOR SELECT USING (
    CASE get_current_user_role()
        WHEN 'admin' THEN true
        WHEN 'guru' THEN true
        WHEN 'wali' THEN wali_id = auth.uid() -- KUNCI KEAMANAN
        ELSE false
    END
);

CREATE POLICY "santri_modify_admin" ON santri
FOR ALL USING (get_current_user_role() = 'admin');

CREATE POLICY "santri_update_guru" ON santri
FOR UPDATE USING (get_current_user_role() = 'guru');

-- 4. RESET HAFALAN
SELECT drop_all_policies('hafalan');
ALTER TABLE hafalan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hafalan_select_strict" ON hafalan
FOR SELECT USING (
    CASE get_current_user_role()
        WHEN 'admin' THEN true
        WHEN 'guru' THEN true
        WHEN 'wali' THEN santri_id IN (SELECT id FROM santri WHERE wali_id = auth.uid())
        ELSE false
    END
);

CREATE POLICY "hafalan_modify_staff" ON hafalan
FOR ALL USING (get_current_user_role() IN ('admin', 'guru'));

-- 5. RESET NILAI
SELECT drop_all_policies('nilai');
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nilai_select_strict" ON nilai
FOR SELECT USING (
    CASE get_current_user_role()
        WHEN 'admin' THEN true
        WHEN 'guru' THEN true
        WHEN 'wali' THEN santri_id IN (SELECT id FROM santri WHERE wali_id = auth.uid())
        ELSE false
    END
);

CREATE POLICY "nilai_modify_staff" ON nilai
FOR ALL USING (get_current_user_role() IN ('admin', 'guru'));

-- 6. RESET PRESENSI
SELECT drop_all_policies('presensi');
ALTER TABLE presensi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presensi_select_strict" ON presensi
FOR SELECT USING (
    CASE get_current_user_role()
        WHEN 'admin' THEN true
        WHEN 'guru' THEN true
        WHEN 'wali' THEN santri_id IN (SELECT id FROM santri WHERE wali_id = auth.uid())
        ELSE false
    END
);

CREATE POLICY "presensi_modify_staff" ON presensi
FOR ALL USING (get_current_user_role() IN ('admin', 'guru'));

-- 7. RESET USER_PROFILES
SELECT drop_all_policies('user_profiles');
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Semua user login bisa baca profile dirinya sendiri ATAU admin bisa baca semua
CREATE POLICY "user_profiles_select" ON user_profiles
FOR SELECT USING (
    auth.uid() = user_id OR get_current_user_role() = 'admin'
);

-- Hanya bisa update diri sendiri
CREATE POLICY "user_profiles_update" ON user_profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Admin bisa insert/delete
CREATE POLICY "user_profiles_admin" ON user_profiles
FOR ALL USING (get_current_user_role() = 'admin');


-- 8. VERIFIKASI
-- Cek apakah masih ada policy yang mencurigakan di tabel santri
SELECT tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'santri';

-- Cleanup helper
DROP FUNCTION drop_all_policies(text);
