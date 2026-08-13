export type NotionPageId = string; // Notion page ID
export type NotionDataSourceId = string; // Notion data source ID

/**
 * Notion MCP의 페이지 property에서 사용할 수 있는 기본 값 타입
 * 예:
 * {
 *   "이름": "SpecTrum",
 *   "인원": 30,
 *   "태그": ["행사", "GDGoC"],
 *   "담당자": null
 * }
 */
export type NotionPropertyValue =
    | string
    | number
    | string[]
    | null;

// 새로운 페이지를 생성할 부모 위치
export type CreatePageParent =
    | {
    type: "page"; // 페이지 아래에 생성하는 경우
    pageId: NotionPageId;
}
    | {
    type: "dataSource"; // Data Source 아래에 생성하는 경우
    dataSourceId: NotionDataSourceId;
};

// Create에 필요한 입력 타입
export interface CreatePageInput {
    parent: CreatePageParent; // 새 페이지 생성될 부모 위치
    properties: Record<string, NotionPropertyValue>; // 생성할 페이지의 properties
    markdown?: string; // 본문
    templateId?: string; // Template ID
    icon?: string; // 페이지 아이콘
    cover?: string; // 커버 이미지
}

// Read에 필요한 입력 타입
export interface ReadPageInput {
    pageIdOrUrl: string;
}

// Update에 필요한 입력 타입
export type UpdatePageInput =
    | {
    type: "properties"; // 페이지 property 수정
    pageId: NotionPageId;
    properties: Record<string, NotionPropertyValue>;
}
    | {
    type: "replaceText"; // 본문에서 특정 문자열을 다른 문자열로 변경
    pageId: NotionPageId;
    replacements: Array<{
        oldText: string;
        newText: string;
        replaceAll?: boolean; // 동일한 oldText가 여러 번 존재할 경우 -> 전부 변경할지
    }>;
}
    | {
    type: "insert"; // 페이지 본문에 새로운 내용 추가
    pageId: NotionPageId;
    markdown: string;
    position?: "start" | "end";
};

// core layer에서 사용하는 공통 Notion 페이지 반환 타입
export interface NotionPage {
    id: NotionPageId;
    url: string;
    title?: string;
    properties: Record<string, unknown>;
    markdown: string;
}
