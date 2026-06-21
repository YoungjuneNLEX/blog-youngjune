import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RoleSelector from '@/components/RoleSelector'

export default async function AdminPage() {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') redirect('/')

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '2.5rem 4rem' }}>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
        <Link href="/admin/settings"
          style={{ fontSize: '0.85rem', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '8px 16px', background: 'var(--bg-card)', color: 'var(--text-sub)' }}
          className="hover:opacity-80 transition">⚙️ 사이트 설정</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-gray-600 font-medium">이름</th>
              <th className="text-left px-5 py-3 text-gray-600 font-medium">이메일</th>
              <th className="text-left px-5 py-3 text-gray-600 font-medium">등급</th>
              <th className="text-left px-5 py-3 text-gray-600 font-medium">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {profiles?.map((profile: any) => (
              <tr key={profile.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{profile.name || '-'}</td>
                <td className="px-5 py-3 text-gray-500">{profile.email}</td>
                <td className="px-5 py-3">
                  <RoleSelector profileId={profile.id} currentRole={profile.role} />
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {new Date(profile.created_at).toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
