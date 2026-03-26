/**
 * Request validation middleware using Zod schemas.
 *
 * Provides type-safe validation for request bodies, params, and query strings.
 */

import type { Request, Response, NextFunction } from 'express';
import { z, type ZodSchema } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Middleware factory for validating request bodies.
 *
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * const createSessionSchema = z.object({
 *   joints: z.array(z.string()).min(1),
 *   patientId: z.string().optional()
 * });
 *
 * router.post('/sessions', validateBody(createSessionSchema), handler);
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    // Replace req.body with parsed & validated data
    req.body = result.data;
    next();
  };
}

/**
 * Middleware factory for validating request params.
 *
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * const paramsSchema = z.object({
 *   sessionId: z.string().uuid()
 * });
 *
 * router.get('/sessions/:sessionId', validateParams(paramsSchema), handler);
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      res.status(400).json({
        error: 'Invalid request parameters',
        details: errors,
      });
      return;
    }

    req.params = result.data;
    next();
  };
}

/**
 * Middleware factory for validating query strings.
 *
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * const querySchema = z.object({
 *   limit: z.string().transform(Number).pipe(z.number().positive().optional()),
 *   offset: z.string().transform(Number).pipe(z.number().nonnegative().optional())
 * });
 *
 * router.get('/sessions', validateQuery(querySchema), handler);
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      res.status(400).json({
        error: 'Invalid query parameters',
        details: errors,
      });
      return;
    }

    req.query = result.data;
    next();
  };
}

/**
 * Common validation schemas for reuse across routes.
 */
export const commonSchemas = {
  /** UUID string validation */
  uuid: z.string().uuid({ message: 'Must be a valid UUID' }),

  /** Non-empty string validation */
  nonEmptyString: z.string().min(1, { message: 'Cannot be empty' }),

  /** Positive number validation */
  positiveNumber: z.number().positive({ message: 'Must be a positive number' }),

  /** Confidence score (0-1) validation */
  confidenceScore: z.number().min(0).max(1, { message: 'Must be between 0 and 1' }),

  /** ROM degrees validation (0-360) */
  romDegrees: z.number().min(0).max(200, { message: 'Must be between 0 and 200' }),

  /** Side validation */
  side: z.enum(['left', 'right'], { message: 'Must be "left" or "right"' }),

  /** Session status validation */
  sessionStatus: z.enum(['created', 'in_progress', 'completed', 'cancelled'], {
    message: 'Invalid session status',
  }),
};

/**
 * Sanitize string input by trimming whitespace and limiting length.
 *
 * @param maxLength Maximum allowed length (default: 1000)
 * @returns Zod string transformer
 *
 * @example
 * const schema = z.object({
 *   name: sanitizeString(100)
 * });
 */
export function sanitizeString(maxLength: number = 1000) {
  return z
    .string()
    .trim()
    .max(maxLength, { message: `Cannot exceed ${maxLength} characters` });
}

/**
 * Validate array with min/max constraints.
 *
 * @param itemSchema Schema for array items
 * @param min Minimum array length (default: 0)
 * @param max Maximum array length (default: 100)
 * @returns Zod array schema
 *
 * @example
 * const schema = z.object({
 *   joints: validateArray(z.string(), 1, 10)
 * });
 */
export function validateArray<T extends ZodSchema>(
  itemSchema: T,
  min: number = 0,
  max: number = 100,
) {
  return z.array(itemSchema).min(min).max(max);
}
