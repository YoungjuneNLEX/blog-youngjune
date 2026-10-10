'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import ShortWriter from '@/components/ShortWriter'
import LongWriter, { LongInitial } from '@/components/LongWriter'
import WriteBar from '@/components/WriteBar'
import { useWriteTopics } from '@/components/useWriteTopics'

interface Loaded {
  kind: 'note' | 'article'
  published: boolean
  title: string
  content: string
  topic: string
  initial: LongInitial
}

/**
 * 글 고치기. 그 글의 종류(짧은 글/긴 글)로 열린다.
 * 종류는 여기서 바꾸지 않는다.
 */
export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Loaded | null>(null)
  const [failed, setFailed] = useState(false)
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'
  const { topics, setTopics, counts, created } = useWriteTopics([], isAdmin)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [topic, setTopic] = useState('')

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .then(p => {
        setTitle(p.title || '')
        setContent(p.content || '')
        setTopic(p.topic || '')
        setPost({
          kind: p.kind === 'note' ? 'note' : 'article',
          published: !!p.published,
          title: p.title || '', content: p.content || '', topic: p.topic || '',
          initial: {
            category: p.category || undefined,
            tags: p.tags || [],
            excerpt: p.excerpt || '',
            visibility: p.visibility || 'public',
            summary: p.summary || '',
            thumbnailUrl: p.thumbnail_url || '',
          },
        })
      })
      .catch(() => setFailed(true))
    fetch('/api/settings').then(r => r.json())
      .then(d => setTopics(d.topics || []))
      .catch(() => {})
  }, [id, setTopics])

  if (failed) return (
    <div className="write-page">
      <WriteBar back={{ href: '/notes', label: '글관리' }} />
      <p className="empty">글을 불러오지 못했습니다.</p>
    </div>
  )
  if (!post) return (
    <div className="write-page">
      <WriteBar back={{ href: '/notes', label: '글관리' }} />
      <p className="empty">글을 불러오는 중…</p>
    </div>
  )

  const isNote = post.kind === 'note'
  return (
    <div className="write-page">
      <WriteBar back={{ href: isNote ? '/notes' : '/notes?tab=long', label: '글관리' }}>
        <span style={{ fontSize: '15px', fontWeight: 700 }}>
          {isNote ? '짧은 글 고치기' : '긴 글 고치기'}
        </span>
      </WriteBar>

      {isNote ? (
        <ShortWriter topics={topics} text={content} onText={setContent}
          topic={topic} onTopic={setTopic}
          counts={counts} onTopicCreated={created}
          edit={{ postId: id, published: post.published }} />
      ) : (
        <LongWriter postId={id} topics={topics} initial={post.initial}
          title={title} onTitle={setTitle} content={content} onContent={setContent}
          topic={topic} onTopic={setTopic}
          counts={counts} onTopicCreated={created} canCreate={isAdmin} />
      )}
    </div>
  )
}
