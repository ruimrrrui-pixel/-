export type CompanyStatus = '気になる' | '応募済み' | 'ES提出' | '面接中' | '内定' | '不合格' | '辞退'
export type SelectionType = 'インターン' | '本選考'

export interface Company {
  id: string
  user_id: string
  name: string
  industry: string | null
  status: CompanyStatus
  selection_type: SelectionType
  note: string | null
  website: string | null
  created_at: string
  updated_at: string
}

export interface ESEntry {
  id: string
  user_id: string
  company_id: string
  question: string
  answer: string
  max_chars: number | null
  created_at: string
  updated_at: string
  company?: Company
}

export interface Template {
  id: string
  user_id: string
  type: 'self_pr' | 'motivation' | 'other'
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface InterviewMemo {
  id: string
  user_id: string
  company_id: string
  interview_date: string
  round: string | null
  questions_and_answers: string
  reflection: string
  created_at: string
  updated_at: string
  company?: Company
}

export interface ResearchMemo {
  id: string
  user_id: string
  company_id: string
  content: string
  created_at: string
  updated_at: string
  company?: Company
}
