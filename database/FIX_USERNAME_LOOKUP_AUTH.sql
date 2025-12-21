-- =================================================
-- FIX: Update RPC untuk lookup email dari auth.users
-- =================================================
-- Masalah: Jika user ubah email tapi belum konfirmasi,
-- user_profiles punya email baru, tapi auth.users masih email lama
-- Solusi: Lookup email dari auth.users langsung (yang aktif di Supabase Auth)
-- =================================================

-- Drop function lama
DROP FUNCTION IF EXISTS get_email_by_username(TEXT);

-- Buat function baru yang lookup dari auth.users
CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
BEGIN
    -- Step 1: Cari user_id dari user_profiles berdasarkan username
    SELECT user_id INTO v_user_id
    FROM user_profiles
    WHERE LOWER(username) = LOWER(p_username)
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Step 2: Ambil email dari auth.users (ini email yang aktif di Supabase Auth)
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = v_user_id;
    
    RETURN v_email;
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION get_email_by_username(TEXT) TO anon, authenticated, service_role;

-- Verifikasi
SELECT 'RPC get_email_by_username sudah diupdate untuk lookup dari auth.users!' as status;
