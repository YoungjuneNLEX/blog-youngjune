# Vercel로 블로그 옮기기 (폰으로 따라 하기)

이 블로그를 **Vercel 무료(Hobby)** 에 올리는 방법입니다. 데스크톱 없이 폰만으로 됩니다.

## 1. Vercel에서 저장소 가져오기 (Import)

1. 폰 브라우저로 [vercel.com](https://vercel.com) 접속 → **GitHub 계정으로 로그인**
2. **Add New… → Project** 누르기
3. 목록에서 `blog-youngjune` 저장소 선택 → **Import**
4. Framework는 자동으로 **Astro** 로 잡힙니다. (그대로 두면 됨)
5. **Deploy** 누르기 → 1~2분 뒤 블로그 주소가 생깁니다.

> 빌드 명령(`npm run build`)과 출력 폴더(`dist`)는 Vercel이 알아서 설정합니다.

## 2. 글쓰기(/admin) 기능용 환경변수 2개 등록

`/admin` 글쓰기·이미지 업로드가 작동하려면 비밀값 2개가 필요합니다.

Vercel 프로젝트 → **Settings → Environment Variables** 에서 추가:

| 이름 | 값 | 설명 |
|------|----|------|
| `ADMIN_PASSWORD` | (원하는 비밀번호) | `/admin` 로그인 비밀번호 |
| `GITHUB_TOKEN` | (GitHub 토큰) | 글을 저장소에 커밋할 때 사용 |

- 기존 Netlify에 넣어뒀던 값과 **똑같이** 넣으면 됩니다.
- 환경변수를 추가/수정한 뒤에는 **Deployments → 최신 배포 → Redeploy** 한 번 눌러줘야 적용됩니다.

### GITHUB_TOKEN 다시 만들어야 할 경우
GitHub → Settings → Developer settings → **Personal access tokens** → 토큰 생성
- 이 저장소의 **Contents: Read and write** 권한이 있어야 합니다.

## 3. 끝! 이제 작업 흐름

- **글쓰기**: `https://(내-Vercel주소)/admin` 접속 → 비밀번호 로그인 → 글 작성/수정
- 저장하면 GitHub에 커밋되고, Vercel이 자동으로 다시 배포 → 1~2분 뒤 반영
- **모양 수정**: 코드를 GitHub에 푸시할 때마다 Vercel이 미리보기 주소를 만들어줍니다. 폰으로 확인하세요.

## (참고) 데스크톱에서 미리보기
집 컴퓨터에서 작업할 땐 배포 없이 즉시 미리보기 가능:
```
npm install
npm run dev      # → http://localhost:4321 에서 실시간 확인
```
마음에 들면 그때 푸시 → 배포 1회. (한도 절약)

---
## 기존 Netlify는?
Netlify 설정은 더 이상 필요 없습니다. Vercel이 잘 뜨는 걸 확인한 뒤,
Netlify 대시보드에서 이 사이트를 삭제하거나 그냥 두셔도 됩니다.
