import { createClient } from '@supabase/supabase-js'

// 빌드 시점(정적 페이지 수집 등)에 환경변수가 주입되지 않아도
// createClient 가 "supabaseUrl is required" 로 throw 하며 빌드를 깨뜨리지 않도록
// placeholder 를 fallback 으로 둔다. 실제 런타임에서는 주입된 실제 값이 사용된다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버에서만 사용 (권한 우회 가능)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
