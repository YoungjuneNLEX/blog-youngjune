import { revalidatePath } from 'next/cache'

/**
 * 공개 페이지(홈·글·소개) 캐시를 즉시 새로 만든다.
 *
 * 공개 페이지는 5분 주기로도 다시 만들어지지만, 글을 쓰거나 설정을 바꾼 뒤
 * 5분을 기다리지 않도록 변경 API 에서 직접 부른다.
 * 루트 레이아웃 기준으로 비우므로 사이트 이름·테마 변경도 함께 반영된다.
 */
export function revalidatePublicPages() {
  revalidatePath('/', 'layout')
}
