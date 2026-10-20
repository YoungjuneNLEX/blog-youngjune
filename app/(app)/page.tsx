/** 콘티 목록 — 홈 화면 아이콘(PWA)으로 열면 이 화면이 바로 뜬다. (목록은 3단계에서 채운다) */
export default function ContiListPage() {
  return (
    <>
      <h1 className="page-title">콘티</h1>
      <div className="empty">
        <p className="empty-title">아직 콘티가 없습니다</p>
        <p className="empty-sub">아래 가운데 + 버튼으로 첫 콘티를 만들 수 있게 됩니다.</p>
      </div>
    </>
  )
}
