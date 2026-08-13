import { describe, expect, it, vi } from "vitest";

import { NotionValidationError } from "../src/notion/notion.errors";
import type { NotionMcpClient } from "../src/notion/notion-mcp.client";
import { NotionService } from "../src/notion/notion.service";
import type { NotionPage } from "../src/notion/notion.types";

// Create 기능 단위 테스트
describe("NotionService.createPage", () => {
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

    // 정상적 Create 요청
    it("유효한 Create 요청을 MCP client에 그대로 전달한다", async () => {
        const createdPage: NotionPage = {
            id: "page-1",
            url: "https://notion.so/page-1",
            title: "Test Page",
            properties: {
                title: "Test Page",
            },
            markdown: "",
        };

        const client = createMockClient();

        vi.mocked(client.createPage).mockResolvedValue(createdPage);

        const service = new NotionService(client);

        const input = {
            parent: {
                type: "page" as const,
                pageId: "parent-page-id",
            },
            properties: {
                title: "Test Page",
            },
        };

        const result = await service.createPage(input);

        expect(client.createPage).toHaveBeenCalledOnce(); // 실제 MCP 호출 역할을 하는 createPage가 한 번만 호출되었는지 확인
        expect(client.createPage).toHaveBeenCalledWith(input); // service가 요청받은 input에 다른 property를 추가하거나 기존 값을 변경하지 않고 그대로 전달했는지 확인
        expect(result).toEqual(createdPage); // MCP client가 반환한 결과를 service가 정상적으로 반환했는지 확인
    });

    // parent pageId가 빈 문자열인 경우
    it("parent pageId가 비어 있으면 Create 요청을 거부한다", async () => {
        const client = createMockClient();
        const service = new NotionService(client);

        const input = {
            parent: {
                type: "page" as const,
                pageId: "   ",
            },
            properties: {
                title: "Test Page",
            },
        };

        await expect(service.createPage(input)).rejects.toThrow(
            NotionValidationError,
        );

        expect(client.createPage).not.toHaveBeenCalled(); // 잘못된 요청이 실제 MCP까지 전달되지 않았는지 확인
    });

    // dataSourceId가 빈 문자열인 경우
    it("parent dataSourceId가 비어 있으면 Create 요청을 거부한다", async () => {
        const client = createMockClient();
        const service = new NotionService(client);

        const input = {
            parent: {
                type: "dataSource" as const,
                dataSourceId: "",
            },
            properties: {
                title: "Test Page",
            },
        };

        await expect(service.createPage(input)).rejects.toThrow(
            NotionValidationError,
        );

        expect(client.createPage).not.toHaveBeenCalled();
    });

    // markdown이 공백만 있는 경우
    it("markdown이 공백뿐이면 Create 요청을 거부한다", async () => {
        const client = createMockClient();
        const service = new NotionService(client);

        const input = {
            parent: {
                type: "page" as const,
                pageId: "parent-page-id",
            },
            properties: {
                title: "Test Page",
            },
            markdown: "   ",
        };

        await expect(service.createPage(input)).rejects.toThrow(
            NotionValidationError,
        );

        expect(client.createPage).not.toHaveBeenCalled();
    });

    // templateId가 공백만 있는 경우
    it("templateId가 공백뿐이면 Create 요청을 거부한다", async () => {
        const client = createMockClient();
        const service = new NotionService(client);

        const input = {
            parent: {
                type: "page" as const,
                pageId: "parent-page-id",
            },
            properties: {
                title: "Test Page",
            },
            templateId: "   ",
        };

        await expect(service.createPage(input)).rejects.toThrow(
            NotionValidationError,
        );

        expect(client.createPage).not.toHaveBeenCalled();
    });

    // templateId와 markdown을 동시에 전달하는 경우
    it("templateId와 markdown을 동시에 사용하면 Create 요청을 거부한다", async () => {
        const client = createMockClient();
        const service = new NotionService(client);

        const input = {
            parent: {
                type: "page" as const,
                pageId: "parent-page-id",
            },
            properties: {
                title: "Test Page",
            },
            templateId: "template-id",
            markdown: "# Test Content",
        };

        await expect(service.createPage(input)).rejects.toThrow(
            NotionValidationError,
        );

        expect(client.createPage).not.toHaveBeenCalled();
    });
});
