import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

// 글이 지금 화면에 보여야 하는지 판단.
// - draft(초안)면 숨김
// - publishAt(예약 시각)이 아직 안 됐으면 숨김 (예약 발행)
export function isPublished(post: Post): boolean {
  if (post.data.draft) return false;
  if (post.data.publishAt && post.data.publishAt.getTime() > Date.now()) return false;
  return true;
}

// 공개된 글만 모아서 반환
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts');
  return posts.filter(isPublished);
}
