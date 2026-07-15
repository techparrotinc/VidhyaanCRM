export const ErrorCode = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MODULE_LOCKED: 'MODULE_LOCKED',
  FEATURE_READ_ONLY: 'FEATURE_READ_ONLY',
  RATE_LIMITED: 'RATE_LIMITED',
  BUSINESS_RULE: 'BUSINESS_RULE',
  CONFLICT: 'CONFLICT',
  SERVER_ERROR: 'SERVER_ERROR'
} as const

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode]

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const Errors = {
  unauthenticated: () =>
    new AppError(
      ErrorCode.UNAUTHENTICATED,
      'Authentication required',
      401
    ),
  forbidden: (msg?: string) =>
    new AppError(
      ErrorCode.FORBIDDEN,
      msg ?? 'Access denied',
      403
    ),
  notFound: (resource?: string) =>
    new AppError(
      ErrorCode.NOT_FOUND,
      resource ? resource + ' not found' : 'Resource not found',
      404
    ),
  moduleLocked: (slug: string) =>
    new AppError(
      ErrorCode.MODULE_LOCKED,
      'Upgrade your plan to access ' + slug.replace(/_/g, ' '),
      403
    ),
  featureReadOnly: () =>
    new AppError(
      ErrorCode.FEATURE_READ_ONLY,
      'Your account is in read-only mode',
      403
    ),
  rateLimited: () =>
    new AppError(
      ErrorCode.RATE_LIMITED,
      'Too many requests',
      429
    ),
  businessRule: (msg: string) =>
    new AppError(
      ErrorCode.BUSINESS_RULE,
      msg,
      422
    ),
  conflict: (msg: string, details?: unknown) =>
    new AppError(
      ErrorCode.CONFLICT,
      msg,
      409,
      details
    ),
  validation: (details: unknown) =>
    new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      422,
      details
    ),
  server: () =>
    new AppError(
      ErrorCode.SERVER_ERROR,
      'Internal server error',
      500
    )
}
