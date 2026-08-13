import type {
    CreatePageInput,
    NotionPage,
    ReadPageInput,
    UpdatePageInput,
} from "./notion.types";

// Notion MCP와 통신하는 low-level client의 interface
// -> business/service 계층이 MCP SDK, transport, OAuth 구현 방식에 직접 의존하지 않도록 분리
export interface NotionMcpClient {
    connect(): Promise<void>; // Notion MCP 연결 초기화
    close(): Promise<void>; // Notion MCP 연결 종료
    createPage(input: CreatePageInput): Promise<NotionPage>; // 새로운 Notion 페이지 생성
    readPage(input: ReadPageInput): Promise<NotionPage>; // Notion 페이지 조회
    updatePage(input: UpdatePageInput): Promise<NotionPage>; // Notion 페이지 수정
}
