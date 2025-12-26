-- =====================================================
-- MIGRATION: ROBUST USER CLEANUP
-- Logic: Simplifies the return type to TEXT to avoid 
-- 406 Not Acceptable errors (MIME type mismatch)
-- =====================================================

CREATE OR REPLACE FUNCTION admin_cleanup_user_by_email(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_operator_role TEXT;
BEGIN
    -- 1. Security: Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND (role = 'admin' OR 'admin' = ANY(roles))
    ) THEN
        RETURN 'Error: Unauthorized';
    END IF;

    -- 2. Find target user
    SELECT id INTO v_uid FROM auth.users WHERE email = target_email;

    -- 3. Delete logic
    IF v_uid IS NOT NULL THEN
        -- Delete from auth (cascades to identities, etc)
        DELETE FROM auth.users WHERE id = v_uid;
        -- Force delete from profile just in case cascade fails
        DELETE FROM user_profiles WHERE user_id = v_uid;
        RETURN 'Success: User deleted from Auth system';
    ELSE
        -- Maybe zombie profile existence?
        DELETE FROM user_profiles WHERE email = target_email;
        RETURN 'Success: User not found in Auth, but Profile cleaned';
    END IF;

    RETURN 'Success: Clean';

EXCEPTION WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_cleanup_user_by_email(TEXT) TO authenticated;

DO $$
BEGIN
    RAISE NOTICE 'Function admin_cleanup_user_by_email ready.';
END $$;
