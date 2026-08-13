import {
    type CreatePageInput,
    type ReadPageInput,
    type UpdatePageInput,
} from "./notion.types";
import { NotionValidationError } from "./notion.errors";

// 빈 문자열인지 확인
function isBlank(value: string): boolean {
    return value.trim().length === 0;
}

// Create 요청 검증
export function validateCreatePageInput(input: CreatePageInput): void {
    // parent 없는 요청 허용 X
    if (!input.parent) {
        throw new NotionValidationError(
            "Create request requires a parent.",
        );
    }

    // parent 종류별 ID 검증
    if (
        input.parent.type === "page" &&
        isBlank(input.parent.pageId)
    ) {
        throw new NotionValidationError(
            "Create request requires a valid pageId.",
        );
    }

    if (
        input.parent.type === "dataSource" &&
        isBlank(input.parent.dataSourceId)
    ) {
        throw new NotionValidationError(
            "Create request requires a valid dataSourceId.",
        );
    }

    // properties 객체인지 확인
    if (
        input.properties === null ||
        typeof input.properties !== "object" ||
        Array.isArray(input.properties)
    ) {
        throw new NotionValidationError(
            "Create request properties must be an object.",
        );
    }

    // templateID, markdown 동시에 사용하는 요청 차단
    if (
        input.templateId !== undefined &&
        input.markdown !== undefined
    ) {
        throw new NotionValidationError(
            "templateId and markdown cannot be used together.",
        );
    }

    // optional 문자열이 전달됐다면 -> 빈 문자열 허용 X
    if (
        input.templateId !== undefined &&
        isBlank(input.templateId)
    ) {
        throw new NotionValidationError(
            "templateId cannot be blank.",
        );
    }

    if (
        input.markdown !== undefined &&
        isBlank(input.markdown)
    ) {
        throw new NotionValidationError(
            "markdown cannot be blank when provided.",
        );
    }
}

// Update 요청 검증
export function validateUpdatePageInput(input: UpdatePageInput): void {
    // PageID 없는 요청 허용 X
    if (isBlank(input.pageId)) {
        throw new NotionValidationError(
            "Update request requires a valid pageId.",
        );
    }

    // property 수정
    if (input.type === "properties") {
        // 빈 properties 객체는 에러로 처리
        if (Object.keys(input.properties).length === 0) {
            throw new NotionValidationError(
                "Update properties cannot be empty.",
            );
        }
        return;
    }

    // 특정 문자열 교체
    if (input.type === "replaceText") {
        // replacements 없으면 차단
        if (input.replacements.length === 0) {
            throw new NotionValidationError(
                "replaceText requires at least one replacement.",
            );
        }

        for (const replacement of input.replacements) {
            // 기존 문자열(oldText) 비어 있으면 차단
            if (isBlank(replacement.oldText)) {
                throw new NotionValidationError(
                    "oldText cannot be blank.",
                );
            }

            // 새 문자열(newText) 비어 있으면 차단 -> (삭제성 수정 차단)
            if (isBlank(replacement.newText)) {
                throw new NotionValidationError(
                    "newText cannot be blank.",
                );
            }
        }
        return;
    }

    // 본문 삽입
    if (input.type === "insert") {
        // 빈 내용 삽입 요청 허용 X
        if (isBlank(input.markdown)) {
            throw new NotionValidationError(
                "Insert markdown cannot be blank.",
            );
        }
        return;
    }

    // 모든 Update 타입을 처리했는지 컴파일 타임에 확인 -> (새로운 type 추가했는데 guard에 해당 분기 처리 추가하지 않으면 컴파일 오류 발생)
    const exhaustiveCheck: never = input;

    throw new NotionValidationError(
        `Unsupported update type: ${String(exhaustiveCheck)}`,
    );
}

// Read 요청 검증
export function validateReadPageInput(input: ReadPageInput): void {
    // 빈 문자열이나 공백만 있는 값은 허용 X
    if (isBlank(input.pageIdOrUrl)) {
        throw new NotionValidationError(
            "Read request requires a valid pageId or URL.",
        );
    }
}
