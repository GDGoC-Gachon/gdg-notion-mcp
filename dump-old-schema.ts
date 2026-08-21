/**
 * 구 Notion 스키마 + 데이터 실측 덤프 (범위 한정판)
 *
 * GDG on Campus Gachon 페이지 하위만 재귀 탐색한다.
 * 워크스페이스 전체를 긁지 않으므로 개인 자료는 파일에 남지 않는다.
 *
 * 사용법:
 *   NOTION_TOKEN=ntn_xxx npx tsx dump-old-schema.ts
 *
 * 출력:
 *   old-schema/schema.json   — DB별 raw 속성 스키마 + 실측
 *   old-schema/report.md     — 사람이 읽는 요약
 *   old-schema/tree.md       — 페이지 트리 구조
 */

import { mkdirSync, writeFileSync } from "node:fs";

const NOTION_VERSION = "2022-06-28";

/** 멀티 데이터소스 DB 는 구버전 API 로 못 읽어서 이 버전으로 재시도한다 */
const NOTION_VERSION_NEW = "2025-09-03";

/** 루트로 삼을 페이지 제목 (search 로 자동 탐색) */
const ROOT_PAGE_TITLE = "GDG on Campus Gachon";

/** 자동 탐색 실패 시 사용할 ID (URL 에서 추출한 값) */
const FALLBACK_ROOT_ID = "200234145522802f9d7ae6be52bbe8b8";

/** 탐색 깊이 제한 — 너무 깊이 들어가면 무관한 문서까지 닿는다 */
const MAX_DEPTH = 4;

type PropSchema = {
  id: string;
  type: string;
  options?: string[];
  relationTo?: string | null;
  raw?: unknown;
};

type DbSchema = {
  id: string;
  title: string;
  url: string;
  path: string;
  depth: number;
  properties: Record<string, PropSchema>;
  rowCount: number;
  emptyCount: Record<string, number>;
  observedValues: Record<string, string[]>;
  titles: string[];
};

let apiCalls = 0;

async function notion(
  token: string,
  path: string,
  body?: unknown,
  version: string = NOTION_VERSION,
): Promise<any> {
  for (let attempt = 0; attempt < 5; attempt++) {
    apiCalls++;
    const res = await fetch(`https://api.notion.com/v1${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": version,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // 레이트 리밋이면 잠시 쉬었다 재시도
    if (res.status === 429) {
      const wait = Number(res.headers.get("retry-after") ?? 1) * 1000;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${path} :: ${await res.text()}`);
    return res.json();
  }
  throw new Error(`재시도 초과: ${path}`);
}

/** 블록 자식 전부 (페이지네이션) */
async function children(token: string, blockId: string): Promise<any[]> {
  const out: any[] = [];
  let cursor: string | undefined;
  do {
    const page = await notion(
      token,
      `/blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`,
    );
    out.push(...page.results);
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return out;
}

async function queryAllRows(token: string, dbId: string): Promise<any[]> {
  const out: any[] = [];
  let cursor: string | undefined;
  do {
    const page = await notion(token, `/databases/${dbId}/query`, {
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    out.push(...page.results);
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return out;
}

function richText(arr: any[]): string {
  return (arr ?? []).map((t: any) => t.plain_text).join("");
}

function normalizeProps(db: any): Record<string, PropSchema> {
  const out: Record<string, PropSchema> = {};
  for (const [name, p] of Object.entries<any>(db.properties ?? {})) {
    const schema: PropSchema = { id: p.id, type: p.type };
    switch (p.type) {
      case "select":
      case "multi_select":
      case "status":
        schema.options = (p[p.type]?.options ?? []).map((o: any) => o.name);
        break;
      case "relation":
        schema.relationTo = p.relation?.database_id ?? null;
        break;
      case "formula":
      case "rollup":
        schema.raw = p[p.type];
        break;
    }
    out[name] = schema;
  }
  return out;
}

function isEmpty(v: any): boolean {
  if (!v) return true;
  switch (v.type) {
    case "title":
    case "rich_text":
      return (v[v.type] ?? []).length === 0;
    case "date":
      return v.date === null;
    case "select":
    case "status":
      return v[v.type] === null;
    case "multi_select":
      return (v.multi_select ?? []).length === 0;
    case "people":
      return (v.people ?? []).length === 0;
    case "relation":
      return (v.relation ?? []).length === 0;
    case "email":
    case "phone_number":
    case "url":
      return v[v.type] === null;
    default:
      return false;
  }
}

function readableValues(v: any): string[] {
  if (!v) return [];
  switch (v.type) {
    case "select":
    case "status":
      return v[v.type] ? [v[v.type].name] : [];
    case "multi_select":
      return (v.multi_select ?? []).map((o: any) => o.name);
    case "people":
      return (v.people ?? []).map((p: any) => p.name ?? "(이름없음)");
    case "title":
    case "rich_text":
      return [richText(v[v.type])].filter(Boolean);
    default:
      return [];
  }
}

const foundDbs: DbSchema[] = [];
const treeLines: string[] = [];
const visited = new Set<string>();

/** 조회에 실패한 DB 기록 */
const failedDbs: { id: string; reason: string }[] = [];

/** 신버전 API 로 data source 를 거쳐 스키마·행을 가져온다 */
async function collectViaDataSource(token: string, dbId: string) {
  const db = await notion(token, `/databases/${dbId}`, undefined, NOTION_VERSION_NEW);
  const sources = db.data_sources ?? [];
  if (!sources.length) throw new Error("data source 없음");

  // 첫 data source 기준 (대부분 1개)
  const ds = await notion(
    token,
    `/data_sources/${sources[0].id}`,
    undefined,
    NOTION_VERSION_NEW,
  );

  const rows: any[] = [];
  let cursor: string | undefined;
  do {
    const page = await notion(
      token,
      `/data_sources/${sources[0].id}/query`,
      { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) },
      NOTION_VERSION_NEW,
    );
    rows.push(...page.results);
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);

  return { title: richText(db.title), url: db.url, properties: ds.properties, rows };
}

async function collectDb(token: string, dbId: string, path: string, depth: number) {
  if (visited.has(dbId)) return;
  visited.add(dbId);

  let title = "(제목없음)";
  let url = "";
  let rawProps: any = {};
  let rows: any[] = [];

  try {
    const db = await notion(token, `/databases/${dbId}`);
    title = richText(db.title) || title;
    url = db.url ?? "";
    rawProps = db.properties ?? {};
    try {
      rows = await queryAllRows(token, dbId);
    } catch {
      /* 행 조회 실패해도 스키마는 남긴다 */
    }
  } catch (e) {
    // 구버전으로 안 되면 신버전 data source 경로로 재시도
    try {
      const r = await collectViaDataSource(token, dbId);
      title = r.title || title;
      url = r.url;
      rawProps = r.properties;
      rows = r.rows;
      console.log(`${"  ".repeat(depth)}  (신버전 API 로 조회)`);
    } catch (e2) {
      const reason = String(e2).slice(0, 100);
      console.warn(`${"  ".repeat(depth)}[DB] (조회 실패) ${dbId} — ${reason}`);
      failedDbs.push({ id: dbId, reason });
      return;
    }
  }

  const props = normalizeProps({ properties: rawProps });

  const emptyCount: Record<string, number> = {};
  const observed: Record<string, Set<string>> = {};
  const titles: string[] = [];
  for (const name of Object.keys(props)) {
    emptyCount[name] = 0;
    observed[name] = new Set();
  }

  for (const row of rows) {
    for (const [name, v] of Object.entries<any>(row.properties ?? {})) {
      if (!(name in emptyCount)) continue;
      if (isEmpty(v)) emptyCount[name]++;
      const type = props[name]?.type;
      if (["select", "multi_select", "status", "people"].includes(type)) {
        for (const sv of readableValues(v)) observed[name].add(sv);
      }
      if (type === "title") {
        const t = readableValues(v)[0];
        if (t) titles.push(t);
      }
    }
  }

  foundDbs.push({
    id: dbId,
    title,
    url,
    path,
    depth,
    properties: props,
    rowCount: rows.length,
    emptyCount,
    observedValues: Object.fromEntries(
      Object.entries(observed).map(([k, v]) => [k, [...v]]),
    ),
    titles,
  });

  console.log(`${"  ".repeat(depth)}[DB] ${title} (${rows.length}행)`);
  treeLines.push(`${"  ".repeat(depth)}- **[DB]** ${title} — ${rows.length}행`);
}

/** 자식을 품을 수 있는 컨테이너 블록 — 안으로 들어가되 깊이는 늘리지 않는다 */
const CONTAINER_TYPES = new Set([
  "column_list",
  "column",
  "toggle",
  "callout",
  "quote",
  "bulleted_list_item",
  "numbered_list_item",
  "to_do",
  "synced_block",
  "template",
  "paragraph",
  "heading_1",
  "heading_2",
  "heading_3",
]);

async function walk(token: string, blockId: string, path: string, depth: number) {
  if (depth > MAX_DEPTH) return;
  if (visited.has(blockId)) return;
  visited.add(blockId);

  let blocks: any[] = [];
  try {
    blocks = await children(token, blockId);
  } catch (e) {
    console.warn(`${"  ".repeat(depth)}(읽기 실패: ${String(e).slice(0, 120)})`);
    return;
  }

  for (const b of blocks) {
    // 1. 이 페이지에 직접 박힌 DB
    if (b.type === "child_database") {
      await collectDb(token, b.id, path, depth);
      continue;
    }

    // 2. 이 페이지의 하위 페이지
    if (b.type === "child_page") {
      const title = b.child_page?.title ?? "(제목없음)";
      console.log(`${"  ".repeat(depth)}[페이지] ${title}`);
      treeLines.push(`${"  ".repeat(depth)}- ${title}`);
      await walk(token, b.id, `${path} / ${title}`, depth + 1);
      continue;
    }

    // 3. 다른 곳에 있는 페이지/DB 를 가리키는 링크 — 따라간다
    if (b.type === "link_to_page") {
      const target = b.link_to_page ?? {};
      if (target.type === "database_id" && target.database_id) {
        await collectDb(token, target.database_id, path, depth);
      } else if (target.type === "page_id" && target.page_id) {
        let title = "(링크된 페이지)";
        try {
          const pg = await notion(token, `/pages/${target.page_id}`);
          const tp = Object.values<any>(pg.properties ?? {}).find(
            (p: any) => p.type === "title",
          );
          title = richText(tp?.title ?? []) || title;
        } catch {
          /* 제목 못 읽어도 계속 */
        }
        console.log(`${"  ".repeat(depth)}[링크] ${title}`);
        treeLines.push(`${"  ".repeat(depth)}- ${title} (링크)`);
        await walk(token, target.page_id, `${path} / ${title}`, depth + 1);
      }
      continue;
    }

    // 4. 컬럼·토글 등 컨테이너는 깊이를 늘리지 않고 안으로 들어간다
    if (b.has_children && CONTAINER_TYPES.has(b.type)) {
      await walkContainer(token, b.id, path, depth);
    }
  }
}

/** 컨테이너 내부 — visited 를 공유하되 깊이는 유지 */
async function walkContainer(
  token: string,
  blockId: string,
  path: string,
  depth: number,
) {
  if (visited.has(blockId)) return;
  visited.add(blockId);

  let blocks: any[] = [];
  try {
    blocks = await children(token, blockId);
  } catch {
    return;
  }

  for (const b of blocks) {
    if (b.type === "child_database") {
      await collectDb(token, b.id, path, depth);
    } else if (b.type === "child_page") {
      const title = b.child_page?.title ?? "(제목없음)";
      console.log(`${"  ".repeat(depth)}[페이지] ${title}`);
      treeLines.push(`${"  ".repeat(depth)}- ${title}`);
      await walk(token, b.id, `${path} / ${title}`, depth + 1);
    } else if (b.type === "link_to_page") {
      const target = b.link_to_page ?? {};
      if (target.type === "database_id" && target.database_id) {
        await collectDb(token, target.database_id, path, depth);
      } else if (target.type === "page_id" && target.page_id) {
        let title = "(링크된 페이지)";
        try {
          const pg = await notion(token, `/pages/${target.page_id}`);
          const tp = Object.values<any>(pg.properties ?? {}).find(
            (p: any) => p.type === "title",
          );
          title = richText(tp?.title ?? []) || title;
        } catch {
          /* 제목 못 읽어도 계속 */
        }
        console.log(`${"  ".repeat(depth)}[링크] ${title}`);
        treeLines.push(`${"  ".repeat(depth)}- ${title} (링크)`);
        await walk(token, target.page_id, `${path} / ${title}`, depth + 1);
      }
    } else if (b.has_children && CONTAINER_TYPES.has(b.type)) {
      await walkContainer(token, b.id, path, depth);
    }
  }
}

/** 제목으로 루트 페이지를 찾는다 */
async function findRootPage(token: string): Promise<string | null> {
  const res = await notion(token, "/search", {
    query: ROOT_PAGE_TITLE,
    filter: { property: "object", value: "page" },
    page_size: 20,
  });

  for (const r of res.results ?? []) {
    const titleProp = Object.values<any>(r.properties ?? {}).find(
      (p: any) => p.type === "title",
    );
    const t = richText(titleProp?.title ?? []);
    if (t.includes(ROOT_PAGE_TITLE)) {
      console.log(`루트 페이지 발견: "${t}"`);
      console.log(`  id: ${r.id}`);
      console.log(`  url: ${r.url}\n`);
      return r.id;
    }
  }
  return null;
}

async function main() {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error("NOTION_TOKEN 환경변수가 필요합니다.");
    process.exit(1);
  }

  mkdirSync("old-schema", { recursive: true });

  let rootId = await findRootPage(token);
  if (!rootId) {
    console.log(`제목으로 못 찾음 — fallback ID 사용: ${FALLBACK_ROOT_ID}\n`);
    rootId = FALLBACK_ROOT_ID;
  }

  console.log(`탐색 깊이 제한: ${MAX_DEPTH}\n`);

  await walk(token, rootId, ROOT_PAGE_TITLE, 0);

  console.log(`\nDB ${foundDbs.length}개 수집, ${failedDbs.length}개 실패 (API 호출 ${apiCalls}회)`);

  if (foundDbs.length === 0) {
    console.log("\n하위에서 DB를 찾지 못했습니다.");
    console.log("위에 표시된 읽기 실패 메시지를 확인하세요.");
    return;
  }

  writeFileSync("old-schema/schema.json", JSON.stringify(foundDbs, null, 2));
  writeFileSync(
    "old-schema/tree.md",
    ["# GDG on Campus Gachon 페이지 트리", "", ...treeLines, ""].join("\n"),
  );

  const lines: string[] = [
    "# 구 Notion 스키마 · 데이터 실측",
    "",
    `조회 시점: ${new Date().toISOString().slice(0, 10)}`,
    `범위: GDG on Campus Gachon 하위 (깊이 ${MAX_DEPTH}까지)`,
    `DB 개수: ${foundDbs.length}`,
    "",
    "## 요약",
    "",
    "| DB | 행 수 | 속성 수 | 경로 |",
    "| --- | ---: | ---: | --- |",
  ];
  for (const db of [...foundDbs].sort((a, b) => b.rowCount - a.rowCount)) {
    lines.push(
      `| ${db.title} | ${db.rowCount} | ${Object.keys(db.properties).length} | ${db.path} |`,
    );
  }
  lines.push("", "---", "");

  for (const db of foundDbs) {
    if (db.rowCount === 0) continue; // 빈 DB는 상세 생략
    lines.push(`## ${db.title}`, "");
    lines.push(`- 경로: ${db.path}`);
    lines.push(`- id: \`${db.id}\``);
    lines.push(`- 행 수: **${db.rowCount}**`, "");
    lines.push("| 속성 | 타입 | 빈 값 | 상세 |", "| --- | --- | ---: | --- |");
    for (const [name, p] of Object.entries(db.properties)) {
      const detail = p.options
        ? `옵션: ${p.options.join(" / ")}`
        : p.relationTo
          ? `→ \`${p.relationTo}\``
          : "";
      lines.push(`| ${name} | ${p.type} | ${db.emptyCount[name] ?? 0} | ${detail} |`);
    }
    lines.push("");

    const observedEntries = Object.entries(db.observedValues).filter(([, v]) => v.length);
    if (observedEntries.length) {
      lines.push("**실제 등장 값**", "");
      for (const [name, vals] of observedEntries) {
        lines.push(`- \`${name}\`: ${vals.join(" / ")}`);
      }
      lines.push("");
    }

    if (db.titles.length) {
      lines.push("**항목 제목 전체**", "");
      for (const t of db.titles) lines.push(`- ${t}`);
      lines.push("");
    }
  }

  if (failedDbs.length) {
    lines.push("## 조회 실패한 DB", "");
    for (const f of failedDbs) lines.push(`- \`${f.id}\` — ${f.reason}`);
    lines.push("");
  }

  writeFileSync("old-schema/report.md", lines.join("\n"));
  console.log("저장: old-schema/schema.json, report.md, tree.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
