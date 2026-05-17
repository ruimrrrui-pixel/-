-- インターン/本選考フィールド追加
ALTER TABLE companies ADD COLUMN IF NOT EXISTS selection_type text NOT NULL DEFAULT '本選考';

-- 管理者統計取得関数
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  caller_email TEXT;
BEGIN
  SELECT email INTO caller_email
  FROM auth.users
  WHERE id = auth.uid();

  IF caller_email != 'rui.mrr.rui@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_companies', (SELECT COUNT(*) FROM companies),
    'total_es', (SELECT COUNT(*) FROM es_entries),
    'users', (
      SELECT json_agg(row_to_json(t) ORDER BY t.created_at DESC)
      FROM (
        SELECT
          u.id as user_id,
          u.email,
          u.created_at,
          u.last_sign_in_at,
          (SELECT COUNT(*) FROM companies c WHERE c.user_id = u.id) as company_count,
          (SELECT COUNT(*) FROM es_entries e WHERE e.user_id = u.id) as es_count,
          (SELECT COUNT(*) FROM templates tp WHERE tp.user_id = u.id) as template_count
        FROM auth.users u
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;
