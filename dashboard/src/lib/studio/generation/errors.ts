export type StudioFieldError = {
  field: string;
  reason: string;
};

export class StudioApiError extends Error {
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
