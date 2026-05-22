# DESIGN.md

## AI Agent Context
당신은 LoL 듀오 매칭 서비스 UI를 만드는 AI입니다.

반드시 아래 디자인 시스템만 사용하세요.
Tailwind CSS 기반으로만 구현하며 임의의 색상, spacing, shadow를 만들지 마세요.

---

# 1. Brand Identity

## Mood
- 따뜻한 베이지 감성
- 부드러운 게임 커뮤니티 느낌
- 과하지 않은 네온 포인트
- 아늑한 게이밍 룸 분위기
- 감성적인 모바일 앱 스타일

## Keywords
- Cozy
- Warm
- Friendly
- Soft Gaming
- Modern
- Clean

---

# 2. Color System

## Background
- Main Background:
  - `bg-stone-100`

- Secondary Surface:
  - `bg-white/70`

- Card Background:
  - `bg-white/75`

- Glass Effect:
  - `backdrop-blur-xl`

---

## Primary Colors
- Main:
  - `bg-violet-500`
  - `text-violet-500`

- Hover:
  - `hover:bg-violet-600`

---

## Accent Colors

### Rating
- `text-yellow-400`

### Match
- `text-pink-500`

### Boost
- `text-violet-500`

---

## Text Colors

### Title
- `text-stone-900`

### Body
- `text-stone-700`

### Secondary
- `text-stone-500`

### Disabled
- `text-stone-400`

---

## Border
- Default:
  - `border-stone-200`

- Soft:
  - `border-white/30`

---

# 3. Typography

## Font
- `font-sans`
- Pretendard 스타일 기반

---

## Headings
- `font-extrabold`
- `tracking-tight`

---

## Sizes

### Hero Nickname
```html
text-4xl md:text-5xl
```

### Section Title
```html
text-2xl
```

### Body
```html
text-base
```

### Small Label
```html
text-sm
```

---

# 4. Shape System

## Radius

### Main Card
```html
rounded-3xl
```

### Secondary Card
```html
rounded-2xl
```

### Buttons
```html
rounded-xl
```

### Chips
```html
rounded-full
```

---

# 5. Shadows

## Default
```html
shadow-md
```

## Hover
```html
hover:shadow-xl
```

---

# 6. Motion

모든 인터랙션 요소에는 반드시 아래 transition을 추가하세요.

```html
transition-all duration-300
```

가능한 애니메이션:
- scale
- opacity
- translate
- rotate

과한 bounce 애니메이션은 금지합니다.

Framer Motion 사용 가능.

---

# 7. Layout

## Container
```html
max-w-6xl mx-auto px-4
```

---

## Mobile First
모바일 UI를 기준으로 먼저 구현하세요.

---

## Preferred Layout
리스트 UI는 flex보다 grid를 우선 사용하세요.

예시:
```html
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

---

# 8. Profile Card Rules

## Core Interaction
프로필 카드는 Tinder 스타일의 좌/우 스와이프 기반으로 동작해야 합니다.

---

## Swipe Actions

### Right Swipe
- 좋아요(Like)

### Left Swipe
- 넘기기(Pass)

드래그 중 카드 회전 효과를 추가하세요.

예시:
- 오른쪽 드래그 → 카드가 시계 방향 회전
- 왼쪽 드래그 → 반시계 방향 회전

---

## Swipe Feedback

### Right Swipe
- 보라/핑크 glow
- LIKE 텍스트 가능

### Left Swipe
- 회색 계열 glow
- PASS 텍스트 가능

opacity 기반으로 자연스럽게 표시하세요.

---

# 9. Profile Card Required Elements

프로필 카드에는 반드시 아래 정보가 포함되어야 합니다.

## Required
- 프로필 이미지
- 닉네임
- 티어
- LP
- 나이
- 서버(KR 등)
- 한줄소개
- 별점 리뷰
- 받은 평가 수
- 선호 포지션(optional)

---

# 10. Removed Elements

프로필 카드 내부에서는 아래 요소를 제거합니다.

## Do Not Include
- 온라인 상태
- 카드 내부 좋아요 버튼
- 복잡한 배지 UI

좋아요는 스와이프 액션으로만 처리합니다.

---

# 11. Rating System

## Rating UI
카드 내부에 유저 평가 영역을 표시하세요.

포함 요소:
- 평균 별점
- 별 아이콘
- 평가 인원 수

예시:
- 4.8 / 5.0
- ★★★★★
- (248명 평가)

---

## Rating Style
```html
bg-white/60
backdrop-blur-xl
rounded-2xl
border border-white/30
```

---

## Star Color
```html
text-yellow-400
```

---

# 12. Profile Card Layout

## Structure

### Main
- 프로필 이미지가 카드 대부분을 차지해야 함

### Bottom Overlay
포함:
- 닉네임
- 티어
- 소개
- 별점

이미지 중심 감성 UI 스타일로 구성하세요.

---

## Recommended Ratio
```html
aspect-[9/16]
```

---

## Card Style
```html
rounded-3xl
overflow-hidden
bg-white/70
backdrop-blur-xl
shadow-md
border border-white/30
```

---

## Hover
```html
hover:shadow-xl
```

---

# 13. Action Buttons

카드 하단에는 원형 액션 버튼을 배치하세요.

## Buttons
- 넘기기
- 슈퍼라이크
- 부스트

---

## Style
```html
rounded-full
shadow-md
transition-all duration-300
```

---

# 14. Bottom Navigation

하단 네비게이션은 최소 기능만 유지합니다.

## Navigation Items
- 채팅
- 마이페이지

---

## Style
```html
fixed bottom-0
bg-white/80
backdrop-blur-xl
border-t border-stone-200
```

---

## Active Tab
```html
text-violet-500
```

---

## Inactive Tab
```html
text-stone-400
```

---

# 15. UI Direction Rules

반드시:
- 여백 넉넉하게 사용
- 카드 중심 레이아웃
- beige + white + violet 조합 유지
- 모바일 퍼스트 기반
- 감성적인 soft UI 유지

---

## Do Not
- 순수 검정 배경
- 과한 네온
- 지나친 gradient
- 너무 작은 버튼
- 복잡한 정보 과다 배치

---

# 16. Recommended UI Style

참고 감성:
- Tinder
- Discord Nitro
- Zenly
- Riot Client
- Cozy Gaming Setup

---

# 17. MVP First

초기 MVP에서는 아래 기능만 우선 구현하세요.

## MVP Features
- 로그인
- 프로필 카드 조회
- 스와이프 매칭
- 채팅
- 프로필 수정
- 유저 평가 시스템

---

## Excluded Features
- 음성채팅
- AI 추천
- 결제 시스템
- 실시간 게임 API 연동
- 랭킹 시스템
- 길드 기능

---

# 18. Tech Rules

## Frontend
- React
- Tailwind CSS
- Framer Motion 가능

---

## State
- Zustand 또는 Context API

---

## API
- REST API 우선

---

## Icons
- Lucide React 사용 권장

---

# 19. Accessibility

반드시:
- hover 상태 제공
- 충분한 대비 유지
- 모바일 최소 터치 영역 44px 확보
- 텍스트 가독성 유지

---

# 20. Final Goal

최종 목표는:
“편안하고 감성적인 듀오 매칭 앱”

느낌:
- 부담스럽지 않음
- 따뜻함
- 깔끔함
- 게임 유저 친화적
- 모바일 앱 같은 완성도