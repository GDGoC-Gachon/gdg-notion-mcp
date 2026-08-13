import { describe, expect, it, vi } from "vitest";

import { NotionValidationError } from "../src/notion/notion.errors";
import type { NotionMcpClient } from "../src/notion/notion-mcp.client";
import { NotionService } from "../src/notion/notion.service";
import type {
    NotionPage,
    UpdatePageInput,
} from "../src/notion/notion.types";

// Update 기능 단위 테스트
describe("NotionService.updatePage", () => {
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

    // 공통으로 사용할 Update 결과 페이지
    const updatedPage: NotionPage = {
        id: "page-1",
        url: "https://notion.so/page-1",
        title: "Test Page",
        properties: {
            status: "완료",
        },
        markdown: "# Test Page",
    };

    // 정상적인 property 수정 요청
    it("유효한 properties Update 요청을 MCP client에 그대로 전달한다", async () => {
        const client = createMockClient();

        vi.mocked(client.updatePage).mockResolvedValue(updatedPage);

        const service = new NotionService(client);

        const input: UpdatePageInput = {
            type: "properties",
            pageId: "page-1",
            properties: {
                status: "완료",
            },
        };

        const result = await service.updatePage(input);

        expect(client.updatePage).toHaveBeenCalledOnce();
        expect(client.updatePage).toHaveBeenCalledWith(input);
        expect(result).toEqual(updatedPage);
    });

    // 일부 property만 수정 요청한 경우
    // -> 사용자가 명시한 property 외에 service가 다른 property를 임의로 추가하지 않았는지 확인
    it("요청하지 않은 property를 임의로 추가하지 않는다", async () => {
        const client = createMockClient();

        vi.mocked(client.updatePage).mockResolvedValue(updatedPage);

        const service = new NotionService(client);

        const input: UpdatePageInput = {
            type: "properties",
            pageId: "page-1",
            properties: {
                status: "완료",
            },
        };

        await service.updatePage(input);

        const calledInput = vi.mocked(client.updatePage).mock.calls[0]?.[0]; // 실제 client 호출에 사용된 첫 번째 argument 가져옴

        expect(calledInput).toEqual(input);

        // 전달한 properties가 status 하나뿐인지 확인
        if (calledInput?.type === "properties") {
            expect(Object.keys(calledInput.properties)).toEqual(["status"]);
        }
    });

    // prooperties가 비어 있는 경우
    it("properties가 비어 있으면 Update 요청을 거부한다", async () => {
        const client = createMockClient();
        const service = new NotionService(client);

        const input: UpdatePageInput = {
            type: "properties",
            pageId: "page-1",
            properties: {},
        };

        await expect(service.updatePage(input)).rejects.toThrow(
            NotionValidationError,
        );

        expect(client.updatePage).not.toHaveBeenCalled();
    });

    // pageId가 비어 있는 경우
    it("pageId가 비어 있으면 Update 요청을 거부한다", async () => {
        const client = createMockClient();
        const service = new NotionService(client);

        const input: UpdatePageInput = {
            type: "properties",
            pageId: "   ",
            properties: {
                status: "완료",
            },
        };

        await expect(service.updatePage(input)).rejects.toThrow(
            NotionValidationError,
        );

        expect(client.updatePage).not.toHaveBeenCalled();
    });

    // replaceText의 replacements가 비어 있는 경우
    it("replaceText의 replacements가 비어 있으면 Update 요청을 거부한다", async () => {
        const client = createMockClient();
        const service = new NotionService(client);

        const input: UpdatePageInput = {
            type: "replaceText",
            pageId: "page-1",
            replacements: [],
        };

        await expect(service.updatePage(input)).rejects.toThrow(
            NotionValidationError,
        );

        expect(client.updatePage).not.toHaveBeenCalled();
    });

    // replaceText의 oldText가 비어 있는 경우
    it("replaceText의 oldText가 비어 있으면 Update 요청을 거부한다", async () => {
        const client = createMockClient();
        const service = new NotionService(client);

        const input: UpdatePageInput = {
            type: "replaceText",
            pageId: "page-1",
            replacements: [
                {
                    oldText: "   ",
                    newText: "새로운 내용",
                },
            ],
        };

        await expect(service.updatePage(input)).rejects.toThrow(
            NotionValidationError,
        );

        expect(client.updatePage).not.toHaveBeenCalled();
    });

    // replaceText의 newText가 비어 있는 경우
    it("replaceText의 newText가 비어 있으면 Update 요청을 거부한다", async () => {
        const client = createMockClient();
        const service = new NotionService(client);

        const input: UpdatePageInput = {
            type: "replaceText",
            pageId: "page-1",
            replacements: [
                {
                    oldText: "기존 내용",
                    newText: "   ",
                },
            ],
        };

        await expect(service.updatePage(input)).rejects.toThrow(
            NotionValidationError,
        );

        expect(client.updatePage).not.toHaveBeenCalled();
    });

    // insert의 markdown이 비어 있는 경우
    it("insert markdown이 비어 있으면 Update 요청을 거부한다", async () => {
        const client = createMockClient();
        const service = new NotionService(client);

        const input: UpdatePageInput = {
            type: "insert",
            pageId: "page-1",
            markdown: "   ",
        };

        await expect(service.updatePage(input)).rejects.toThrow(
            NotionValidationError,
        );

        expect(client.updatePage).not.toHaveBeenCalled();
    });

    // 유효한 replaceText 요청인 경우
    it("유효한 replaceText 요청을 MCP client에 그대로 전달한다", async () => {
        const client = createMockClient();

        vi.mocked(client.updatePage).mockResolvedValue(updatedPage);

        const service = new NotionService(client);

        const input: UpdatePageInput = {
            type: "replaceText",
            pageId: "page-1",
            replacements: [
                {
                    oldText: "진행중",
                    newText: "완료",
                },
            ],
        };

        await service.updatePage(input);

        expect(client.updatePage).toHaveBeenCalledOnce();
        expect(client.updatePage).toHaveBeenCalledWith(input);
    });

    // 유효한 insert 요청인 경우
    it("유효한 insert 요청을 MCP client에 그대로 전달한다", async () => {
        const client = createMockClient();

        vi.mocked(client.updatePage).mockResolvedValue(updatedPage);

        const service = new NotionService(client);

        const input: UpdatePageInput = {
            type: "insert",
            pageId: "page-1",
            markdown: "## 새로운 내용",
            position: "end",
        };

        await service.updatePage(input);

        expect(client.updatePage).toHaveBeenCalledOnce();
        expect(client.updatePage).toHaveBeenCalledWith(input);
    });
});
