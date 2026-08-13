// Notion CRU core layer에서 사용하는 공통 에러 기본 클래스
export class NotionCoreError extends Error {
    constructor(message: string) {
        super(message);

        this.name = "NotionCoreError";
    }
}

// 입력값 오류
export class NotionValidationError extends NotionCoreError {
    constructor(message: string) {
        super(message);

        this.name = "NotionValidationError";
    }
}

// 요청한 Notion 페이지 찾지 못함
export class NotionNotFoundError extends NotionCoreError {
    constructor(message = "Notion page not found") {
        super(message);

        this.name = "NotionNotFoundError";
    }
}

// 현재 연결된 Notion MCP가 특정 기능을 지원하지 않음
export class NotionUnsupportedOperationError extends NotionCoreError {
    constructor(message: string) {
        super(message);

        this.name = "NotionUnsupportedOperationError";
    }
}

// Notion MCP 호출 실패
export class NotionMcpError extends NotionCoreError {
    constructor(message: string, options?: { cause?: unknown }) { // 원래 발생한 에러를 보존할 수 있도록 cause 선택적으로 받음
        super(message);

        this.name = "NotionMcpError";

        if (options?.cause !== undefined) {
            this.cause = options.cause;
        }
    }
}