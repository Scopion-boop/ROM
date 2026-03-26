/**
 * @physiolens/shared-types — Public API barrel export.
 *
 * All domain contracts re-exported from this single entry point.
 */

// Clinical domain (joints, movements, normative ranges, landmarks)
export * from './clinical';

// Session domain
export {
  ExamMode,
  SessionStatus,
  SessionSchema,
  CreateSessionSchema,
  type Session,
  type CreateSession,
} from './session';

// Measurement domain
export {
  BodySide,
  MeasurementPlane,
  QualityFlagSchema,
  MeasurementSchema,
  CreateMeasurementSchema,
  type QualityFlag,
  type Measurement,
  type CreateMeasurement,
} from './measurement';

// Note domain
export {
  NoteStatus,
  NoteBlockSchema,
  NoteSchema,
  NoteExportPayloadSchema,
  type NoteBlock,
  type Note,
  type NoteExportPayload,
} from './note';

// Audit domain
export { AuditActionSchema, AuditEventSchema, type AuditAction, type AuditEvent } from './audit';

// Capture domain (vision strategy contracts)
export {
  CapturedMeasurementSchema,
  VISION_STRATEGY_KEYS,
  type CapturedMeasurement,
  type VisionStrategyMeta,
  type VisionStrategyKey,
} from './capture';

// User domain
export { UserRole, UserSchema, type User } from './user';
