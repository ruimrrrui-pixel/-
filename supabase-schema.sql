-- 企業テーブル
create table companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  industry text,
  status text not null default '気になる',
  note text,
  website text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ESテーブル
create table es_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade not null,
  question text not null,
  answer text not null default '',
  max_chars integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- テンプレートテーブル
create table templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null default 'other',
  title text not null,
  content text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 面接振り返りメモテーブル
create table interview_memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade not null,
  interview_date date not null,
  round text,
  questions_and_answers text not null default '',
  reflection text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 企業研究メモテーブル
create table research_memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade not null,
  content text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS（行レベルセキュリティ）有効化
alter table companies enable row level security;
alter table es_entries enable row level security;
alter table templates enable row level security;
alter table interview_memos enable row level security;
alter table research_memos enable row level security;

-- RLSポリシー（自分のデータのみ操作可能）
create policy "companies_policy" on companies for all using (auth.uid() = user_id);
create policy "es_entries_policy" on es_entries for all using (auth.uid() = user_id);
create policy "templates_policy" on templates for all using (auth.uid() = user_id);
create policy "interview_memos_policy" on interview_memos for all using (auth.uid() = user_id);
create policy "research_memos_policy" on research_memos for all using (auth.uid() = user_id);

-- updated_at自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger companies_updated_at before update on companies for each row execute function update_updated_at();
create trigger es_entries_updated_at before update on es_entries for each row execute function update_updated_at();
create trigger templates_updated_at before update on templates for each row execute function update_updated_at();
create trigger interview_memos_updated_at before update on interview_memos for each row execute function update_updated_at();
create trigger research_memos_updated_at before update on research_memos for each row execute function update_updated_at();
