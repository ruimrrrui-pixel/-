-- ① OB訪問テーブルを作成
CREATE TABLE IF NOT EXISTS ob_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  visit_date date,
  visitor_name text,
  visitor_department text,
  questions_and_answers text NOT NULL DEFAULT '',
  impression text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ob_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ob_visits"
  ON ob_visits FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER update_ob_visits_updated_at
  BEFORE UPDATE ON ob_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ② 既存データの「内定」→「内定（合格）」マイグレーション
UPDATE companies SET status = '内定（合格）' WHERE status = '内定';

-- ③ 管理者統計関数を更新（OB・面接・企業研究のカウントを追加）
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  caller_email TEXT;
BEGIN
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  IF caller_email != 'rui.mrr.rui@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_companies', (SELECT COUNT(*) FROM companies),
    'total_es', (SELECT COUNT(*) FROM es_entries),
    'total_ob', (SELECT COUNT(*) FROM ob_visits),
    'users', (
      SELECT json_agg(u ORDER BY u.created_at DESC)
      FROM (
        SELECT
          au.id as user_id,
          au.email,
          au.created_at,
          au.last_sign_in_at,
          (SELECT COUNT(*) FROM companies c WHERE c.user_id = au.id) as company_count,
          (SELECT COUNT(*) FROM es_entries e WHERE e.user_id = au.id) as es_count,
          (SELECT COUNT(*) FROM templates t WHERE t.user_id = au.id) as template_count,
          (SELECT COUNT(*) FROM interview_memos im WHERE im.user_id = au.id) as interview_count,
          (SELECT COUNT(*) FROM research_memos rm WHERE rm.user_id = au.id) as research_count,
          (SELECT COUNT(*) FROM ob_visits ob WHERE ob.user_id = au.id) as ob_count
        FROM auth.users au
      ) u
    )
  ) INTO result;

  RETURN result;
END;
$$;
