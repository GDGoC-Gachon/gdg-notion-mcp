# GDGoC 운영진 - 원본 Database 스키마 요약

- 원본 응답: `schema/new.json` (notion-new MCP `notion-fetch` on each data source)
- 조회 시점: 2026-08-20
- 대상: GDGoC 운영진 페이지 아래 **원본 데이터베이스 6개** (linked view 제외)
- 표의 "상세" 열은 선택형 옵션 이름 전체 · relation 타깃 · formula/rollup 요점을 표기합니다. 옵션 색상, 옵션 내부 URL, formulaCode URL 등 원본 필드는 `new.json`에 그대로 보존되어 있습니다.

---

## 1. 동아리원 개인 정보

- **id (data source):** `3742463a-9512-8058-b342-000b5ab6590c`
- **URL:** https://app.notion.com/p/3742463a95128007a608c317ac168e7f
- **속성 수:** 11

| 속성명 | 타입 | 상세 |
|---|---|---|
| Notion User | person | — |
| 관련 작업 항목 | relation | → `collection://3a07f559-7b0a-4af9-962c-cbedc45984b6` |
| 관련 캘린더 항목 | relation | → `collection://3742463a-9512-80a7-945d-000bfc271048` |
| 담당 업무 | relation | → `collection://3742463a-9512-816b-b14a-000b288ef9f2` (업무) |
| 담당 프로젝트 | relation | → `collection://3742463a-9512-8070-8fce-000bc0b0cbfb` (프로젝트) |
| 소속 부서 | multi_select | 옵션: `개발 지원`, `기획 & 운영`, `리더진`, `디자인 & 마케팅` |
| 이름 | title | — |
| 이메일 | email | — |
| 참가 미팅 | relation | → `collection://3742463a-9512-811c-8514-000b0cc169ba` (업무 캘린더) |
| 참여 기수 | relation | → `collection://3932463a-9512-8047-8d74-000b6f87da00` (기수 구분) |
| 참여 프로젝트 | relation | → `collection://3742463a-9512-8070-8fce-000bc0b0cbfb` (프로젝트) |

---

## 2. 프로젝트

- **id (data source):** `3742463a-9512-8070-8fce-000bc0b0cbfb`
- **URL:** https://app.notion.com/p/3742463a95128034b6fcf2ed8d41660a
- **기본 페이지 템플릿:** `https://app.notion.com/p/39d2463a951280ae9d43ffc1a9e10981`
- **속성 수:** 16

| 속성명 | 타입 | 상세 |
|---|---|---|
| ALL | rollup | relation=`SPBD`(업무), target=업무.title, aggregation=`count` |
| CHECK | rollup | relation=`SPBD`(업무), target=업무.`완료 여부`(formula), aggregation=`sum` |
| 건들지마!!!!!! | text | — |
| 기수 구분 | relation | → `collection://3932463a-9512-8047-8d74-000b6f87da00` (기수 구분), limit=1 |
| 목적 | text | — |
| 미팅 | relation | → `collection://3742463a-9512-811c-8514-000b0cc169ba` (업무 캘린더) |
| 상태 | status | to_do: `시작 전` / in_progress: `진행 중` / complete: `완료` (current, future는 비어있음) |
| 생성 일시 | created_time | — |
| 시작일 | date | — |
| 업무 | relation | → `collection://3742463a-9512-816b-b14a-000b288ef9f2` (업무) |
| 이름 | title | — |
| 일자 메시지 | formula | codeUrl=`formulaCode://3742463a-9512-8070-8fce-000bc0b0cbfb/UXRLfQ` |
| 종료일 | date | — |
| 팀원 | relation | → `collection://3742463a-9512-8058-b342-000b5ab6590c` (동아리원 개인 정보) |
| 팀장 | relation | → `collection://3742463a-9512-8058-b342-000b5ab6590c` (동아리원 개인 정보), limit=1 |
| 프로젝트 진행률 | formula | codeUrl=`formulaCode://3742463a-9512-8070-8fce-000bc0b0cbfb/YEJqWQ` |

---

## 3. 업무

- **id (data source):** `3742463a-9512-816b-b14a-000b288ef9f2`
- **URL:** https://app.notion.com/p/3742463a951280f293efd9f54ce85efb
- **속성 수:** 14

| 속성명 | 타입 | 상세 |
|---|---|---|
| D-Day | formula | codeUrl=`formulaCode://3742463a-9512-816b-b14a-000b288ef9f2/VmJAdw` |
| Output | url | — |
| score | formula | codeUrl=`formulaCode://3742463a-9512-816b-b14a-000b288ef9f2/PFV1TA` |
| 구분 | select | 옵션: `정리`, `운영`, `조사`, `기획`, `진행` |
| 내용 | title | — |
| 담당자 | person | — |
| 마감일 | date | — |
| 상태 | status | to_do: `시작 전` / in_progress: `진행 중` / complete: `완료` (current, future는 비어있음) |
| 생성 미팅 | relation | → `collection://3742463a-9512-811c-8514-000b0cc169ba` (업무 캘린더) |
| 생성 일시 | created_time | — |
| 완료 여부 | formula | codeUrl=`formulaCode://3742463a-9512-816b-b14a-000b288ef9f2/T0tLQA` |
| 점검 미팅 | relation | → `collection://3742463a-9512-811c-8514-000b0cc169ba` (업무 캘린더) |
| 프로젝트 | relation | → `collection://3742463a-9512-8070-8fce-000bc0b0cbfb` (프로젝트) |
| 프로젝트 상태 | rollup | relation=`SnRxYw`(프로젝트), target=프로젝트.상태(status) |

---

## 4. 업무 캘린더

- **id (data source):** `3742463a-9512-811c-8514-000b0cc169ba`
- **URL:** https://app.notion.com/p/3742463a951280a2826fd2cc6b361b2e
- **페이지 템플릿:** `[00]0차 정기 회의`, `새 페이지`
- **속성 수:** 13

| 속성명 | 타입 | 상세 |
|---|---|---|
| D-Day | formula | codeUrl=`formulaCode://3742463a-9512-811c-8514-000b0cc169ba/cnJWQg` |
| 관련 프로젝트 | relation | → `collection://3742463a-9512-8070-8fce-000bc0b0cbfb` (프로젝트) |
| 기수 구분 | relation | → `collection://3932463a-9512-8047-8d74-000b6f87da00` (기수 구분), limit=1 |
| 날짜 | date | — |
| 미완료 Task | formula | codeUrl=`formulaCode://3742463a-9512-811c-8514-000b0cc169ba/dX5hWg` |
| 미팅 요약 | text | — |
| 생성된 업무 | relation | → `collection://3742463a-9512-816b-b14a-000b288ef9f2` (업무) |
| 완료 | checkbox | — |
| 유형 | select | 옵션: `업무 일정`, `행사 일정`, `회의` |
| 이름 | title | — |
| 장소 | text | — |
| 점검 Task | relation | → `collection://3742463a-9512-816b-b14a-000b288ef9f2` (업무) |
| 참가자 | relation | → `collection://3742463a-9512-8058-b342-000b5ab6590c` (동아리원 개인 정보) |

---

## 5. 기수 구분

- **id (data source):** `3932463a-9512-8047-8d74-000b6f87da00`
- **URL:** https://app.notion.com/p/3932463a951280e1b5fecfd2b88a6eaf
- **속성 수:** 15

| 속성명 | 타입 | 상세 |
|---|---|---|
| 기수 종료까지 | formula | codeUrl=`formulaCode://3932463a-9512-8047-8d74-000b6f87da00/Y1RVVQ` |
| 동아리원 | relation | → `collection://3742463a-9512-8058-b342-000b5ab6590c` (동아리원 개인 정보) |
| 동아리원 수 | rollup | relation=`PUNKbA`(동아리원), target=동아리원 개인 정보.title, aggregation=`count` |
| 오거나이저 | relation | → `collection://3742463a-9512-8058-b342-000b5ab6590c` (동아리원 개인 정보) |
| 완료된 프로젝트 | formula | codeUrl=`formulaCode://3932463a-9512-8047-8d74-000b6f87da00/Yj14Qw` |
| 이름 | title | — |
| 종료일 문구 | formula | codeUrl=`formulaCode://3932463a-9512-8047-8d74-000b6f87da00/b3RyXA` |
| 진행중인 프로젝트 | formula | codeUrl=`formulaCode://3932463a-9512-8047-8d74-000b6f87da00/XUtBcw` |
| 프로젝트 | relation | → `collection://3742463a-9512-8070-8fce-000bc0b0cbfb` (프로젝트) |
| 행사 생성 | button | — |
| 현재 기수 여부 | formula | codeUrl=`formulaCode://3932463a-9512-8047-8d74-000b6f87da00/UFl5Pw` |
| 활동 시작 | date | — |
| 활동 종료 | date | — |
| 회의 등록 | button | — |
| 회의록 | relation | → `collection://3742463a-9512-811c-8514-000b0cc169ba` (업무 캘린더) |

---

## 6. 커뮤니티 지식 아카이브

- **id (data source):** `1a02463a-9512-82cb-8bc9-871eb46327a6`
- **URL:** https://app.notion.com/p/1c42463a951283fd942f8128e1a4b37d
- **속성 수:** 17

| 속성명 | 타입 | 상세 |
|---|---|---|
| 검증 상태 | select | 옵션: `실사용 검증됨`, `후보`, `사용 불가` |
| 관련 행사 | multi_select | 옵션: `Retrofest`, `Final Stride DemoDay`, `연합해커톤`, `와글와글 해커톤`, `SpecTrum`, `마일스콘`, `상시`, `남궁성의 취업 세미나`, `Connect Session`, `LLM Insight Session`, `iOS App Sprint Challenge` |
| 담당자 | text | — |
| 로고 삽입 여부 | checkbox | — |
| 링크 | url | — |
| 성격 | select | 옵션: `레퍼런스`, `진행기록` (설명: 레퍼런스=다음에 재사용할 지식 / 진행기록=지난 시즌 트래커) |
| 업무 영역 | multi_select | 옵션: `후원사`, `장소`, `케이터링`, `웰컴기프트`, `발주처`, `예산안`, `기획안`, `홍보`, `퍼블리싱`, `이벤트페이지`, `만족도조사`, `메일`, `발표제안`, `해외챕터`, `디자인`, `브랜드` |
| 연락처 | text | — |
| 요구사항 | text | 설명: 후원사가 요청한 반대급부 |
| 이름 | title | — |
| 이메일 | email | — |
| 작성자 | person | — |
| 최종 확인일 | date | — |
| 품목·조건 | text | — |
| 한 줄 요약 | text | 설명: 열어보지 않고 판단할 수 있게 한 줄로 |
| 형식 | select | 옵션: `업체·장소`, `템플릿`, `산출물`, `참고링크`, `노하우`, `첨부문서` |
| 후원 품목 | text | 설명: 후원사 정보 원본에서 이관 |

---

## 전체 타입 분포 (6개 DB 합산, 총 86개 속성)

| 타입 | 개수 |
|---|---:|
| relation | 24 |
| formula | 12 |
| text | 10 |
| date | 7 |
| title | 6 |
| select | 5 |
| rollup | 4 |
| person | 3 |
| multi_select | 3 |
| status | 2 |
| email | 2 |
| url | 2 |
| checkbox | 2 |
| created_time | 2 |
| button | 2 |
| **합계** | **86** |

### DB별 속성 수

| DB | 속성 수 |
|---|---:|
| 동아리원 개인 정보 | 11 |
| 프로젝트 | 16 |
| 업무 | 14 |
| 업무 캘린더 | 13 |
| 기수 구분 | 15 |
| 커뮤니티 지식 아카이브 | 17 |
| **합계** | **86** |
