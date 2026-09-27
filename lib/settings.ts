import { supabaseAdmin, assertDbOk } from './supabase'
import { DEFAULT_CONFIG, mergeConfig, SiteConfig } from './site-config'

// 순수 설정(타입/상수/헬퍼)은 client 에서도 쓸 수 있도록 re-export
export * from './site-config'

// 서버 전용: DB 에서 사이트 설정을 읽어온다
export async function getSiteConfig(): Promise<SiteConfig> {
  // maybeSingle 이라 "행이 아직 없음"은 오류가 아니다.
  // 진짜 DB 장애만 assertDbOk 가 예외로 올려, 캐시된 페이지가 기본값으로
  // 덮어써지는 것을 막는다.
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', 'site_config')
    .maybeSingle()

  assertDbOk(error, '사이트 설정')

  if (data?.value) {
    try {
      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
      return mergeConfig(parsed)
    } catch {
      // 저장된 값이 깨졌으면 기본값으로 버틴다
    }
  }
  return DEFAULT_CONFIG
}
