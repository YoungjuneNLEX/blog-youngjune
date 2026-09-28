'use client'

import { NEUTRAL_TOPIC, Topic } from '@/lib/site-config'

/** 주제 고르기 — 모바일은 아래에서 올라오는 시트, PC 는 가운데 작은 창 */
export default function TopicPicker({
  topics, current, onPick, onClose,
}: {
  topics: Topic[]
  current: string | null
  onPick: (topic: string | null) => void
  onClose: () => void
}) {
  return (
    <div className="scrim" role="dialog" aria-label="주제 고르기" onClick={onClose}>
      <div className="pick-sheet" onClick={e => e.stopPropagation()}>
        <button className={`pick-item${current === null ? ' on' : ''}`} onClick={() => onPick(null)}>
          <span className="dot" style={{ background: NEUTRAL_TOPIC.color }} />
          전체 주제
        </button>
        {topics.map(t => (
          <button key={t.id} className={`pick-item${current === t.name ? ' on' : ''}`}
            onClick={() => onPick(t.name)}>
            <span className="dot" style={{ background: t.color }} />
            {t.name}
          </button>
        ))}
      </div>
    </div>
  )
}
