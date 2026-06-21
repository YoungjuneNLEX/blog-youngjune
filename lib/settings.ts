import { supabaseAdmin } from './supabase'
import { DEFAULT_CONFIG, mergeConfig, SiteConfig } from './site-config'

// 순수 설정(타입/상수/헬퍼)은 client 에서도 쓸 수 있도록 re-export
export * from './site-config'

// 서버 전용: DB 에서 사이트 설정을 읽어온다
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const { data } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'site_config')
      .single()

    if (data?.value) {
      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
      return mergeConfig(parsed)
    }
  } catch {
    // 테이블/행이 없거나 파싱 실패 시 기본값 사용
  }
  return DEFAULT_CONFIG
}
