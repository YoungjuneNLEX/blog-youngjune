'use client'

import { useCallback, useEffect, useState } from 'react'
import { Topic } from '@/lib/site-config'

/**
 * 글쓰기·고치기 화면이 쓰는 서재·시리즈 목록과 편수.
 * - 편수는 관리자만 받는다(공개하지 않은 글도 센다). 못 받아도 편수만 0 으로 보일 뿐이다.
 * - 글쓰기에서 시리즈를 새로 만들면 created 로 목록에 바로 넣는다.
 */
export function useWriteTopics(initial: Topic[], isAdmin: boolean) {
  const [topics, setTopics] = useState<Topic[]>(initial)
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!isAdmin) return
    let alive = true
    fetch('/api/topics')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && d?.usage) setCounts(d.usage) })
      .catch(() => { /* 편수 없이 보여 준다 */ })
    return () => { alive = false }
  }, [isAdmin])

  const created = useCallback((t: Topic) => {
    setTopics(prev => (prev.some(x => x.id === t.id) ? prev : [...prev, t]))
    setCounts(c => ({ ...c, [t.name]: 0 }))
  }, [])

  return { topics, setTopics, counts, created }
}
