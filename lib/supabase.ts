import { createClient } from '@supabase/supabase-js'

// 빌드 시점(정적 페이지 수집 등)에 환경변수가 주입되지 않아도
// createClient 가 "supabaseUrl is required" 로 throw 하며 빌드를 깨뜨리지 않도록
// placeholder 를 fallback 으로 둔다. 실제 런타임에서는 주입된 실제 값이 사용된다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// 이 앱의 DB 접근은 전부 이 클라이언트로만 이뤄진다. 서버에서만 쓸 것.
// (브라우저에 노출되는 anon 키 클라이언트는 쓰는 곳이 없어 제거했다.
//  클라이언트에서 DB 를 직접 부르지 말고 app/api/* 를 거칠 것.)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
