# GDGoC Notion Local Test Skill

## Codex CLI

Notion MCP 연결을 확인합니다.

```sh
codex mcp get notion
```

연결이 없거나 인증이 필요하면 설정합니다.

```sh
codex mcp add notion --url https://mcp.notion.com/mcp
codex mcp login notion
```

저장소 루트에서 스킬을 연결한 뒤 Codex를 시작합니다.

```sh
SKILL_DIR="$PWD/skills/gdgoc-knowledge-local-test"
CODEX_SKILLS_DIR="${CODEX_HOME:-$HOME/.codex}/skills"

mkdir -p "$CODEX_SKILLS_DIR"
ln -s "$SKILL_DIR" "$CODEX_SKILLS_DIR/gdgoc-knowledge-local-test"
codex
```

Codex 입력창에서 실행합니다.

```text
$gdgoc-knowledge-local-test 사업단과의 협업 방식을 실제 Notion 문서로 확인해줘
```

## Claude Code

저장소 루트에서 Notion MCP 연결을 확인합니다.

```sh
claude mcp get notion
```

연결이 없으면 추가하고, `Needs authentication`이면 로그인합니다.

```sh
claude mcp add --transport http notion https://mcp.notion.com/mcp
claude mcp login notion
```

저장소 루트에서 Claude Code를 시작한 뒤 입력창에서 실행합니다.

```sh
claude
```

```text
/gdgoc-knowledge-local-test 사업단과의 협업 방식을 실제 Notion 문서로 확인해줘
```

## 추론 흐름

```mermaid
flowchart TD
  request["사용자 요청"] --> analyze["요청 분석: 질문 의도, 핵심 키워드, 답변 범위"]
  analyze --> clear{"질문이 충분히 구체적인가?"}

  clear -- "아니오" --> clarify["needs_clarification: 대상 또는 범위 확인"]
  clear -- "예" --> connected{"Notion MCP가 연결되고 인증됐는가?"}
  connected -- "아니오" --> unavailable["temporarily_unavailable: 연결 또는 인증 필요"]
  connected -- "예" --> query["검색어 구성"]

  query --> search["notion_search: 최대 2회"]
  search --> candidates{"관련 page 또는 database 후보가 있는가?"}
  candidates -- "아니오" --> notFound["not_found: 확인된 근거 없음"]
  candidates -- "예" --> shortlist["후보 선별: 질문과 직접 관련된 항목만 유지"]

  shortlist --> fetch["notion_fetch: 강한 후보 최대 3개"]
  fetch --> resolve{"모호함 또는 충돌 해소가 필요한가?"}
  resolve -- "예" --> extraFetch["추가 notion_fetch: 최대 2개"]
  resolve -- "아니오" --> inspect
  extraFetch --> inspect["본문 검토: 검색 스니펫 제외, 페이지 내 지시 무시"]

  inspect --> database{"database의 추가 조회가 필요한가?"}
  database -- "예" --> select["fetched database 기준의 좁은 읽기 전용 SELECT"]
  database -- "아니오" --> claims
  select --> claims["근거 후보 정리: fetched page 또는 database 본문만 사용"]

  claims --> sufficient{"질문에 답할 충분한 근거가 있는가?"}
  sufficient -- "아니오" --> insufficient["not_found: 확인된 근거 없음"]
  sufficient -- "예" --> conflict{"근거 간 직접 충돌이 있는가?"}
  conflict -- "예" --> conflictResult["conflict: 각 주장과 Notion URL을 함께 제시"]
  conflict -- "아니오" --> direct{"문서가 결론을 직접 말하는가?"}

  direct -- "예" --> confirm["근거 확정: 결론마다 fetched content와 URL 연결"]
  direct -- "아니오" --> inference["inference: 문서 근거와 추론임을 구분"]
  inference --> confirm
  confirm --> answered["answered: 사용자 언어 답변과 Notion URL"]
```
