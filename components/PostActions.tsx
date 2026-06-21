'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PostActions({ postId, title, canManage }: {
  postId: string
  title: string
  canManage: boolean
}) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    // 모바일 등 네이티브 공유 지원 시 공유 시트 사용
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // 사용자가 취소한 경우 등 — 클립보드 복사로 폴백하지 않고 종료
        return
      }
    }
    // 데스크톱: 링크 복사
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('아래 링크를 복사하세요', url)
    }
  }

  async function handleDelete() {
    if (!confirm('이 글을 삭제할까요? 되돌릴 수 없습니다.')) return
    setDeleting(true)
    const res = await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId }),
    })
    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setDeleting(false)
      alert('삭제에 실패했습니다.')
    }
  }

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '0.8rem', fontWeight: 600, padding: '7px 14px', borderRadius: '999px',
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text-sub)', cursor: 'pointer', textDecoration: 'none',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <button onClick={handleShare} style={btnStyle} className="hover:opacity-75 transition">
        {copied ? '✓ 링크 복사됨' : '🔗 공유'}
      </button>

      {canManage && (
        <>
          <Link href={`/write/${postId}`} style={btnStyle} className="hover:opacity-75 transition">
            ✏️ 수정
          </Link>
          <button onClick={handleDelete} disabled={deleting}
            style={{ ...btnStyle, color: '#c0392b', borderColor: '#e8c9c4',
              opacity: deleting ? 0.5 : 1 }}
            className="hover:opacity-75 transition">
            {deleting ? '삭제 중...' : '🗑 삭제'}
          </button>
        </>
      )}
    </div>
  )
}
