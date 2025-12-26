-- =====================================================
-- MIGRATION: Fix get_user_role for Multi-Role RLS
-- Updates RLS helper to respect 'active_role'
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    v_active_role TEXT;
    v_legacy_role TEXT;
BEGIN
    -- Try to get active_role first
    SELECT active_role, role 
    INTO v_active_role, v_legacy_role
    FROM user_profiles
    WHERE user_id = auth.uid();
    
    -- Return active_role if set, otherwise fallback to legacy role, then guest
    RETURN COALESCE(v_active_role, v_legacy_role, 'guest');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant just in case
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;

DO $$
BEGIN
    RAISE NOTICE 'Updated get_user_role() to use active_role.';
END $$;
