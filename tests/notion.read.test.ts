import { describe, expect, it, vi } from "vitest";

import { NotionValidationError } from "../src/notion/notion.errors";
import type { NotionMcpClient } from "../src/notion/notion-mcp.client";
import { NotionService } from "../src/notion/notion.service";
import type { NotionPage } from "../src/notion/notion.types";

// Read 기능 단위 테스트
describe("NotionService.readPage", () => {
    // 공통 Mock MCP client 생성
    function createMockClient(): NotionMcpClient {
        return {
            connect: vi.fn(),
            close: vi.fn(),
            createPage: vi.fn(),
            readPage: vi.fn(),
            updatePage: vi.fn(),
        };
    }

    // 정상적인 page ID 조회 테스트
    it("유효한 page ID를 MCP client에 그대로 전달한다", async () => {
        const page: NotionPage = {
            id: "page-1",
            url: "https://notion.so/page-1",
            title: "Test Page",
            properties: {
                title: "Test Page",
            },
            markdown: "# Test Page",
        };

        const client = createMockClient();

        vi.mocked(client.readPage).mockResolvedValue(page);

        const service = new NotionService(client);

        const input = {
            pageIdOrUrl: "page-1",
        };

        const result = await service.readPage(input);

        expect(client.readPage).toHaveBeenCalledOnce(); // readPage()가 정확히 한 번 호출됐는지 확인
        expect(client.readPage).toHaveBeenCalledWith(input); // Service가 조회 대상을 임의로 변경하지 않고 전달받은 input을 그대로 MCP client에 전달했는지 확인
        expect(result).toEqual(page); // MCP client가 반환한 페이지를 service가 정상적으로 반환했는지 확인
    });

    // Notion URL을 이용한 조회 테스트
    it("유효한 Notion URL을 MCP client에 그대로 전달한다", async () => {
        const page: NotionPage = {
            id: "page-1",
            url: "https://notion.so/page-1",
            title: "Test Page",
            properties: {},
            markdown: "# Test Page",
        };

        const client = createMockClient();

        vi.mocked(client.readPage).mockResolvedValue(page);

        const service = new NotionService(client);

        const input = {
            pageIdOrUrl: "https://notion.so/page-1",
        };

        const result = await service.readPage(input);

        expect(client.readPage).toHaveBeenCalledOnce();
        expect(client.readPage).toHaveBeenCalledWith(input);
        expect(result).toEqual(page);
    });

    // pageIdOrUrl이 빈 문자열인 경우
    it("pageIdOrUrl이 빈 문자열이면 Read 요청을 거부한다", async () => {
        const client = createMockClient();
        const service = new NotionService(client);

        const input = {
            pageIdOrUrl: "",
        };

        await expect(service.readPage(input)).rejects.toThrow(
            NotionValidationError,
        );

        expect(client.readPage).not.toHaveBeenCalled();
    });

    // pageIdOrUrl이 공백만 포함하는 경우
    it("pageIdOrUrl이 공백뿐이면 Read 요청을 거부한다", async () => {
        const client = createMockClient();
        const service = new NotionService(client);

        const input = {
            pageIdOrUrl: "   ",
        };

        await expect(service.readPage(input)).rejects.toThrow(
            NotionValidationError,
        );

        expect(client.readPage).not.toHaveBeenCalled();
    });
});
