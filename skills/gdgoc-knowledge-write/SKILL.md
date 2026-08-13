---
name: gdgoc-knowledge-write
description: Conservatively create or update Notion pages through the authenticated official Notion MCP. Use only when the user explicitly requests a live Notion page creation or update; do not use for read-only Q&A, archive/delete, moves, database schema changes, comments, or permission changes.
---

# GDGoC Knowledge Write

## Preconditions

<!--
Safety intent:
1. MCP가 연결되어 있다는 이유만으로 바로 write를 수행하지 않는다.
   실제 작업에 필요한 Notion MCP tool이 제공되는지 먼저 확인한다.

2. 사용자가 실제 Notion 데이터를 생성하거나 수정해 달라고 명시적으로 요청한 경우에만 write를 허용한다. 
   검토, 요약, 수정안 작성 등의 요청을 write 요청으로 추측하지 않는다.
-->

Before performing any write operation, verify all of the following:
1. The authenticated official Notion MCP is connected and available.
2. The required tools are available:
    - `notion_fetch`
    - `notion_create_pages` for Create requests
    - `notion_update_page` for Update requests
3. The current Notion MCP session is authenticated for the workspace that contains the target page or data source.
4. The user has explicitly requested a live Notion Create or Update operation.
5. The request identifies enough information to determine the exact target and intended change.
6. Do not perform archive, delete, move, database schema changes, comments, permission changes, or other write operations outside this Skill's scope.

If the MCP connection or authentication is unavailable, stop and return:
`temporarily_unavailable`

If the user request does not identify the target or intended change clearly enough, do not guess. Return:
`needs_clarification`

## Write Safety Rules

## Create Workflow

## Update Workflow

## Confirmation Rules

## Response Contract