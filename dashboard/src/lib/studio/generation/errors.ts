export type StudioFieldError = {
  field: string;
  reason: string;
};

export class StudioApiError extends Error {
  readonly kind = "StudioApiError";
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;
  readonly fieldErrors: StudioFieldError[];
  readonly details: Record<string, unknown>;

  constructor(input: {
    status: number;
    code: string;
    message: string;
    retryable?: boolean;
    fieldErrors?: StudioFieldError[];
    details?: Record<string, unknown>;
  }) {
    super(input.message);
    this.name = "StudioApiError";
    this.status = input.status;
    this.code = input.code;
    this.retryable = input.retryable ?? false;
    this.fieldErrors = input.fieldErrors ?? [];
    this.details = input.details ?? {};
  }
}

export function isStudioApiError(error: unknown): error is StudioApiError {
  if (error === null || typeof error !== "object") return false;
  const candidate = error as Partial<StudioApiError>;
  return candidate.kind === "StudioApiError"
    && typeof candidate.status === "number"
    && typeof candidate.code === "string"
    && typeof candidate.message === "string"
    && typeof candidate.retryable === "boolean"
    && Array.isArray(candidate.fieldErrors)
    && candidate.details !== null
    && typeof candidate.details === "object";
}
