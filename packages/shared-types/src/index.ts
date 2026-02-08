/**
 * @rom/shared-types — Public API barrel export.
 *
 * All domain contracts re-exported from this single entry point.
 */

// Session domain
export {
    SessionStatus,
    SessionSchema,
    CreateSessionSchema,
    type Session,
    type CreateSession,
} from './session';

// Measurement domain
export {
    BodySide,
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
export {
    AuditActionSchema,
    AuditEventSchema,
    type AuditAction,
    type AuditEvent,
} from './audit';

// User domain
export {
    UserRole,
    UserSchema,
    type User,
} from './user';
