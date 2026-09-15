import { randomUUID } from "node:crypto";

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly expected: boolean;

  constructor(message: string, options: { code?: string; status?: number; expected?: boolean } = {}) {
    super(message);
    this.name = "AppError";
    this.code = options.code ?? "APPLICATION_ERROR";
    this.status = options.status ?? 400;
    this.expected = options.expected ?? true;
  }
}

export function requestId(request?: Request) {
  return request?.headers.get("x-request-id")?.trim() || randomUUID();
}

function safeMessage(error: unknown) {
  if (error instanceof AppError) return error.message;
  return "An unexpected server error occurred.";
}

export function errorDetails(error: unknown) {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message, status: error.status, expected: error.expected };
  }
  return { code: "INTERNAL_SERVER_ERROR", message: safeMessage(error), status: 500, expected: false };
}

export function logServerError(error: unknown, context: { requestId: string; route: string }) {
  const details = errorDetails(error);
  const entry = {
    level: details.expected ? "warn" : "error",
    event: "request_error",
    requestId: context.requestId,
    route: context.route,
    code: details.code,
    message: details.message,
  };
  if (details.expected) console.warn(JSON.stringify(entry));
  else console.error(JSON.stringify(entry));
}
