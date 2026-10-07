'use client'

import { useState } from 'react'
import ShortWriter, { MemoRow } from '@/components/ShortWriter'
import LongWriter from '@/components/LongWriter'
import WriteBar from '@/components/WriteBar'
import { Topic } from '@/lib/site-config'
import { hasRichFormat, htmlToText, textToHtml } from '@/lib/write-convert'

type Mode = 'short' | 'long'

/**
 * 글쓰기 — 짧은 글과 긴 글을 한 화면에서.
 * 열자마자 짧은 글 입력칸에 커서가 있다. 맨 위 [짧은 글 | 긴 글] 로 바꾸면
 * 긴 글 칸(제목·템플릿·표지·요약·공개 설정)이 펼쳐지고, 쓰던 본문은 그대로 따라간다.
 * 짧은 글은 관리자만 쓴다. (관리자가 아닌 글쓴이는 긴 글만 보인다)
 */
export default function WriteScreen({
  isAdmin, today, topics,
}: { isAdmin: boolean; today: MemoRow[]; topics: Topic[] }) {
  const [mode, setMode] = useState<Mode>(isAdmin ? 'short' : 'long')
  // 오늘 쓴 짧은 글. 새로 쓰면 여기에 쌓여서, 긴 글에 다녀와도 목록이 남는다.
  const [recent, setRecent] = useState<MemoRow[]>(today)
  // 두 모드가 같은 본문을 나눠 쓴다. 짧은 글은 평문, 긴 글은 HTML.
  const [text, setText] = useState('')
  const [html, setHtml] = useState('')
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  // 긴 글 에디터는 바뀐 본문으로 새로 만들어야 하므로 전환할 때마다 열쇠를 바꾼다
  const [round, setRound] = useState(0)

  function change(next: Mode) {
    if (next === mode) return
    if (next === 'long') {
      setHtml(textToHtml(text))
    } else {
      // 긴 글 → 짧은 글: 서식·이미지·제목은 사라지므로 한 번 묻는다
      const lost = hasRichFormat(html) || title.trim()
      if (lost && !confirm(
        '짧은 글에는 제목과 서식(이미지·소제목·목록 등)이 없습니다.\n본문만 글자로 옮깁니다. 바꿀까요?')) return
      setText(htmlToText(html))
    }
    setMode(next)
    setRound(r => r + 1)
  }

  return (
    <div className="write-page">
      <WriteBar back={isAdmin ? { href: '/notes', label: '글관리' } : { href: '/', label: '홈' }}>
        {isAdmin ? (
          <div className="seg" role="tablist" aria-label="글 종류">
            <button role="tab" aria-selected={mode === 'short'}
              className={mode === 'short' ? 'on' : ''} onClick={() => change('short')}>짧은 글</button>
            <button role="tab" aria-selected={mode === 'long'}
              className={mode === 'long' ? 'on' : ''} onClick={() => change('long')}>긴 글</button>
          </div>
        ) : (
          <span style={{ fontSize: '15px', fontWeight: 700 }}>긴 글 쓰기</span>
        )}
      </WriteBar>

      {mode === 'short' ? (
        <ShortWriter key={`s${round}`} topics={topics} today={recent}
          onSaved={row => setRecent(prev => [row, ...prev])}
          text={text} onText={setText} topic={topic} onTopic={setTopic} />
      ) : (
        <LongWriter key={`l${round}`} topics={topics}
          title={title} onTitle={setTitle} content={html} onContent={setHtml}
          topic={topic} onTopic={setTopic} />
      )}
    </div>
  )
}
