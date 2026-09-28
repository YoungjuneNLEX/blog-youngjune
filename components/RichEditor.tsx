'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useRef, useEffect } from 'react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { Color, FontFamily, FontSize, LineHeight } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { TextAlign } from '@tiptap/extension-text-align'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import { Link } from '@tiptap/extension-link'
import { HorizontalRule } from '@tiptap/extension-horizontal-rule'
import { Image } from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extension-placeholder'

const FONTS = ['기본', '바탕', '나눔명조', '맑은 고딕', '나눔고딕', '굴림']
const FONT_SIZES = ['10', '11', '12', '13', '14', '16', '18', '20', '24', '28', '32', '36']
const LINE_HEIGHTS = [{ label: '1.5배', value: '1.5' }, { label: '2.0배 (기본)', value: '2.0' }, { label: '2.5배', value: '2.5' }, { label: '3.0배', value: '3.0' }]

interface Props {
  content: string
  onChange: (html: string) => void
  highlightWord?: string
}

async function uploadImageFile(file: File): Promise<string | null> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) return null
  const { url } = await res.json()
  return url
}

export default function RichEditor({ content, onChange, highlightWord }: Props) {
  const imgInputRef = useRef<HTMLInputElement>(null)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ horizontalRule: false }),
      Underline,
      Color,
      FontFamily,
      FontSize,
      LineHeight,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({ openOnClick: false }),
      HorizontalRule,
      Image,
      Placeholder.configure({ placeholder: '본문을 입력하세요...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: 'font-size:12pt; line-height:2.0; outline:none; min-height:500px; padding: 2rem;',
      },
    },
  })

  useEffect(() => {
    if (!editor || !highlightWord) return
    const doc = editor.state.doc
    const search = highlightWord.trim()
    let found = false
    doc.descendants((node, pos) => {
      if (found || !node.isText) return
      const idx = node.text?.indexOf(search) ?? -1
      if (idx === -1) return
      found = true
      const from = pos + idx
      const to = from + search.length
      editor.chain().focus().setTextSelection({ from, to }).run()
      // 선택된 위치로 스크롤
      const domNode = editor.view.domAtPos(from).node as HTMLElement
      domNode?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [highlightWord, editor])

  if (!editor) return null

  const btn = (active: boolean, onClick: () => void, label: string, title?: string) => (
    <button
      type="button"
      title={title || label}
      onClick={onClick}
      style={{
        padding: '4px 8px', borderRadius: '5px', fontSize: '0.78rem', fontWeight: 600,
        border: active ? '1.5px solid var(--accent)' : '1px solid var(--border)',
        background: active ? 'var(--border-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-sub)',
        cursor: 'pointer', lineHeight: 1,
      }}
    >{label}</button>
  )

  const divider = () => <span style={{ width: '1px', height: '18px', background: 'var(--border)', display: 'inline-block', margin: '0 4px' }} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-card)' }}>
      {/* 툴바 */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)', padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
        {/* 폰트 */}
        <select
          style={{ fontSize: '0.78rem', border: '1px solid var(--border)', borderRadius: '5px', padding: '3px 6px', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}
          onChange={e => {
            const v = e.target.value
            if (v === '기본') editor.chain().focus().unsetFontFamily().run()
            else editor.chain().focus().setFontFamily(v).run()
          }}
        >
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {/* 폰트 크기 */}
        <select
          style={{ fontSize: '0.78rem', border: '1px solid var(--border)', borderRadius: '5px', padding: '3px 6px', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', width: '60px' }}
          defaultValue="12"
          onChange={e => editor.chain().focus().setMark('textStyle', { fontSize: `${e.target.value}pt` }).run()}
        >
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {divider()}

        {/* 서식 */}
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B', '굵게')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I', '기울임')}
        {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'U', '밑줄')}
        {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'S', '취소선')}

        {divider()}

        {/* 색상 */}
        <label title="글자 색상" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.78rem', color: 'var(--text-sub)' }}>
          A<input type="color" style={{ width: '18px', height: '18px', border: 'none', cursor: 'pointer', padding: 0 }}
            onChange={e => editor.chain().focus().setColor(e.target.value).run()} />
        </label>
        <label title="형광펜" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.78rem', color: 'var(--text-sub)' }}>
          🖍<input type="color" defaultValue="#fde68a" style={{ width: '18px', height: '18px', border: 'none', cursor: 'pointer', padding: 0 }}
            onChange={e => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} />
        </label>

        {divider()}

        {/* 정렬 */}
        {btn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), '≡', '왼쪽')}
        {btn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), '≡', '가운데')}
        {btn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), '≡', '오른쪽')}
        {btn(editor.isActive({ textAlign: 'justify' }), () => editor.chain().focus().setTextAlign('justify').run(), '≡', '양쪽')}

        {divider()}

        {/* 목록 */}
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '•목록')}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1.목록')}

        {divider()}

        {/* 줄간격 */}
        <select
          style={{ fontSize: '0.78rem', border: '1px solid var(--border)', borderRadius: '5px', padding: '3px 6px', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}
          defaultValue="2.0"
          onChange={e => (editor.chain().focus() as any).setLineHeight(e.target.value).run() }
        >
          {LINE_HEIGHTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>

        {divider()}

        {/* 구분선 */}
        {btn(false, () => editor.chain().focus().setHorizontalRule().run(), '─', '구분선')}

        {/* 표 */}
        {btn(false, () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), '표', '표 삽입')}

        {/* 링크 */}
        {btn(editor.isActive('link'), () => {
          const url = prompt('링크 URL을 입력하세요')
          if (url) editor.chain().focus().setLink({ href: url }).run()
          else editor.chain().focus().unsetLink().run()
        }, '🔗', '링크')}

        {/* 이미지 */}
        <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={async e => {
            const file = e.target.files?.[0]
            if (!file) return
            const url = await uploadImageFile(file)
            if (url) editor.chain().focus().setImage({ src: url }).run()
            e.target.value = ''
          }} />
        {btn(false, () => imgInputRef.current?.click(), '🖼', '이미지 삽입')}

        {/* 제목 */}
        {divider()}
        {([1, 2, 3] as const).map(n => (
          <span key={n}>{btn(
            editor.isActive('heading', { level: n }),
            () => editor.chain().focus().toggleHeading({ level: n }).run(),
            `H${n}`
          )}</span>
        ))}

        {/* 인용 */}
        {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), '❝', '인용')}

        {/* 코드블록 */}
        {btn(editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), '<>', '코드')}
      </div>

      {/* 편집 영역 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <style>{`
          .tiptap p { margin: 0 0 0.5em; }
          .tiptap h1 { font-size: 1.8rem; font-weight: 800; margin: 1em 0 0.5em; }
          .tiptap h2 { font-size: 1.4rem; font-weight: 700; margin: 1em 0 0.5em; }
          .tiptap h3 { font-size: 1.1rem; font-weight: 700; margin: 1em 0 0.5em; }
          .tiptap ul, .tiptap ol { padding-left: 1.5em; }
          .tiptap blockquote { border-left: 3px solid var(--accent); padding-left: 1rem; color: var(--text-sub); margin: 1em 0; }
          .tiptap hr { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
          .tiptap a { color: var(--accent); text-decoration: underline; }
          .tiptap table { border-collapse: collapse; width: 100%; }
          .tiptap td, .tiptap th { border: 1px solid var(--border); padding: 0.5em 0.75em; }
          .tiptap th { background: var(--bg); font-weight: 700; }
          .tiptap img { max-width: 100%; border-radius: 8px; }
          .tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: var(--text-muted); pointer-events: none; float: left; height: 0; }
          .tiptap code { background: var(--bg); padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; }
          .tiptap pre { background: #1e1e1e; color: #d4d4d4; padding: 1em; border-radius: 8px; overflow-x: auto; }
        `}</style>
        <EditorContent editor={editor} className="tiptap" />
      </div>
    </div>
  )
}
