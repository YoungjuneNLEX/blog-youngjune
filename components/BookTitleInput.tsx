'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (val: string) => void
}

export default function BookTitleInput({ value, onChange }: Props) {
  const [books, setBooks] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/books/list')
      .then(r => r.json())
      .then(data => setBooks(data.titles || []))
  }, [])

  useEffect(() => { setSearch(value) }, [value])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const filtered = books.filter(b => b.includes(search) && b !== search)
  const isNew = search.trim() && !books.includes(search.trim())

  function select(title: string) {
    onChange(title)
    setSearch(title)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: '180px' }}>
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="예: 커피일기"
        style={{ border: '1px solid var(--border)', borderRadius: '7px', padding: '6px 10px',
          fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--bg-card)',
          outline: 'none', width: '100%' }}
      />
      {open && (filtered.length > 0 || isNew) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(44,26,14,0.12)', marginTop: '4px', overflow: 'hidden' }}>

          {filtered.length > 0 && (
            <>
              <div style={{ padding: '6px 12px 4px', fontSize: '0.68rem', color: 'var(--text-muted)',
                fontWeight: 600, letterSpacing: '0.05em', borderBottom: '1px solid var(--border-soft)' }}>
                기존 책
              </div>
              {filtered.map(b => (
                <button key={b} onClick={() => select(b)}
                  style={{ display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text-main)',
                    background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f6f6f4')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  📚 {b}
                </button>
              ))}
            </>
          )}

          {isNew && (
            <button onClick={() => select(search.trim())}
              style={{ display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', fontSize: '0.85rem', color: 'var(--accent)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderTop: filtered.length > 0 ? '1px solid var(--border-soft)' : 'none',
                fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f6f6f4')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              + 새 책 "{search.trim()}" 만들기
            </button>
          )}
        </div>
      )}
    </div>
  )
}
