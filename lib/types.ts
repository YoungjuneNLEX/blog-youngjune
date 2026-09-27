export type Role = 'admin' | 'writer' | 'reader'

export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  role: Role
  created_at: string
}

// 글의 종류 — 메모는 제목·표지가 없고, 긴 글은 표지와 AI 요약을 가진다
export type PostKind = 'note' | 'article'

export interface Post {
  id: string
  title: string
  content: string | null
  kind: PostKind
  topic: string | null
  summary: string | null        // 발행 시 생성해 저장하는 세 줄 요약
  source_note_ids: string[]     // 이 글이 나온 메모들 (5단계)
  category: string | null       // 옛 분류. topic 으로 옮기는 중이라 아직 남겨 둔다
  tags: string[] | null
  visibility: 'public' | 'members'
  published: boolean
  thumbnail_url: string | null
  excerpt: string | null
  author_id: string
  author?: Profile
  created_at: string
  updated_at: string
}
