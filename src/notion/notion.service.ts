import type { NotionMcpClient } from "./notion-mcp.client";
import type {
    CreatePageInput,
    NotionPage,
    ReadPageInput,
    UpdatePageInput,
} from "./notion.types";

// Notion CRU 기능을 외부에 제공하는 service 계층
export class NotionService {
    constructor(private readonly client: NotionMcpClient) {} // 실제 Notion MCP 호출 담당 client를 외부에서 주입받음

    async createPage(input: CreatePageInput): Promise<NotionPage> { // 새로운 Notion 페이지 생성
        return this.client.createPage(input);
    }

    async readPage(input: ReadPageInput): Promise<NotionPage> { // Notion 페이지 조회
        return this.client.readPage(input);
    }

    async updatePage(input: UpdatePageInput): Promise<NotionPage> { // Notion 페이지 수정
        return this.client.updatePage(input);
    }
}