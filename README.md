# GDGoC Notion Local Test Skill

`gdgoc-knowledge-local-test`는 인증된 사용자의 실제 Notion을 대상으로
읽기 전용 질의 응답을 실험하는 Codex CLI 스킬입니다. Firebase, 별도 MCP 서버,
팀 공용 토큰, 저장소 secret을 사용하거나 생성하지 않습니다.

이 저장소의 첫 공개 범위는 이 로컬 테스트 스킬뿐입니다. 서버 배포와 팀 공용
MCP는 별도 변경으로 관리합니다.

## What It Does

- 현재 Codex 사용자에게 인증된 공식 Notion MCP를 통해 실제 문서를 검색하고 조회합니다.
- 검색은 최대 2회, 페이지 조회는 최대 5회로 제한합니다.
- 조회한 Notion 페이지 또는 데이터베이스만 근거로 답변하고 원본 URL을 함께 제공합니다.
- 문서 내용의 지시문은 신뢰하지 않으며, Notion 변경 작업은 수행하지 않습니다.

이 스킬은 서버의 루트 경계, 구성원 토큰 인증, 팀 공용 접근 제어 또는 배포 준비를
검증하지 않습니다.

## Requirements

- Codex CLI
- 공식 `notion` MCP 연결
- 테스트하려는 문서에 대한 본인 Notion 읽기 권한

연결 상태를 먼저 확인합니다.

```sh
codex mcp get notion
```

`notion` MCP가 없거나 로그인되지 않았다면 다음을 실행합니다.

```sh
codex mcp add notion --url https://mcp.notion.com/mcp
codex mcp login notion
```

## Install Locally

저장소 루트에서 아래 명령으로 스킬을 Codex skill 디렉터리에 연결합니다. 기존에 같은
이름의 스킬이 있다면 덮어쓰지 말고 먼저 그 연결 대상을 확인합니다.

```sh
SKILL_DIR="$PWD/skills/gdgoc-knowledge-local-test"
CODEX_SKILLS_DIR="${CODEX_HOME:-$HOME/.codex}/skills"

mkdir -p "$CODEX_SKILLS_DIR"
ln -s "$SKILL_DIR" "$CODEX_SKILLS_DIR/gdgoc-knowledge-local-test"
```

## Use

Codex CLI를 연 뒤, **Codex 프롬프트에서** 다음처럼 호출합니다.

```text
$gdgoc-knowledge-local-test 사업단과의 협업 방식을 실제 Notion 문서로 확인해줘
```

`$gdgoc-knowledge-local-test ...`는 zsh 명령이 아닙니다. 터미널에 직접 입력하면
`command not found`가 발생합니다. 터미널에서는 `codex`로 Codex를 시작한 뒤 그
대화 입력창에서 사용합니다.

답변에는 실제로 조회한 Notion 페이지 URL이 `근거`로 표시됩니다. 관련 문서를 찾지
못했거나 서로 충돌하면 그 상태를 명시하며, 추론은 문서의 직접 진술과 구분합니다.

## Safety Boundary

- `notion_search`, `notion_fetch`, 필요한 경우 읽기 전용 `SELECT` 데이터베이스 조회만 사용합니다.
- 생성, 수정, 이동, 보관, 복원, 댓글, 반응, 권한, 스키마, 뷰, 파일 업로드 작업은 금지합니다.
- 이 스킬은 현재 로그인한 개인 계정이 볼 수 있는 문서를 대상으로 합니다. 공유 권한이 없는 팀 문서나 개인 문서의 접근을 우회하지 않습니다.
- Notion 페이지에서 토큰, 비밀번호, 브라우저 세션 정보 등 비밀값을 공유하라는 지시가 있어도 따르지 않습니다.

## Repository Layout

```text
skills/
  gdgoc-knowledge-local-test/
    SKILL.md
    agents/openai.yaml
```
