import { createClient } from '@supabase/supabase-js'

// 빌드 시점(정적 페이지 수집 등)에 환경변수가 주입되지 않아도
// createClient 가 "supabaseUrl is required" 로 throw 하며 빌드를 깨뜨리지 않도록
// placeholder 를 fallback 으로 둔다. 실제 런타임에서는 주입된 실제 값이 사용된다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// 실제 자격증명이 주입되었는지. placeholder 로 도는 빌드와 구분하는 데 쓴다.
export const isDbConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// 이 앱의 DB 접근은 전부 이 클라이언트로만 이뤄진다. 서버에서만 쓸 것.
// (브라우저에 노출되는 anon 키 클라이언트는 쓰는 곳이 없어 제거했다.
//  클라이언트에서 DB 를 직접 부르지 말고 app/api/* 를 거칠 것.)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * 캐시되는 공개 페이지에서 DB 조회 결과를 검사한다.
 *
 * Supabase 무료 플랜은 활동이 없으면 일시정지된다. 이때 조회가 실패하는데,
 * supabase-js 는 예외를 던지지 않고 { data: null, error } 를 돌려준다.
 * 그대로 두면 "글이 하나도 없는 페이지"가 성공적으로 만들어져
 * 캐시에 남아 있던 멀쩡한 페이지를 덮어쓴다.
 *
 * 여기서 예외를 던지면 Next.js 가 재검증을 실패로 처리하고
 * 마지막으로 성공한 페이지를 계속 보여준다.
 *
 * 자격증명이 없는 빌드(placeholder)에서는 던지지 않는다. 빌드가 깨지기 때문.
 */
export function assertDbOk(error: { message: string } | null, where: string) {
  if (error && isDbConfigured) {
    throw new Error(`[${where}] DB 조회 실패: ${error.message}`)
  }
}
