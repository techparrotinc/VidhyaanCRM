import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError } from './errors'

export function ok<T>(
  data: T,
  message?: string,
  status = 200
) {
  return NextResponse.json(
    { success: true, data, message },
    { status }
  )
}

export function created<T>(data: T) {
  return ok(data, undefined, 201)
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit)
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  })
}

export function errorResponse(
  error: unknown
) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.flatten().fieldErrors
      },
      { status: 422 }
    )
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      },
      { status: error.status }
    )
  }

  console.error('Unhandled error:', error)
  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    },
    { status: 500 }
  )
}
