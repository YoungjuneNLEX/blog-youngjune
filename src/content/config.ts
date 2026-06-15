import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(),          // 서가 (에세이 / 소설 / 인문교양)
    tags: z.array(z.string()).min(1), // 첫 번째 태그 = 책 제목 (필수 1개 이상)
    thumbnail: z.string().optional(), // 책 표지 이미지 경로 (예: /image/cover.png)
    bookCover: z.boolean().optional().default(false), // 켜면 이 글의 thumbnail이 책 대표 표지가 됨
    description: z.string().optional().default(''),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { posts };
