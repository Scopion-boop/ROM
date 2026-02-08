/**
 * Schema validation tests for shared domain contracts.
 */
import { describe, it, expect } from 'vitest';
import {
  SessionSchema,
  CreateSessionSchema,
  MeasurementSchema,
  NoteSchema,
  NoteBlockSchema,
  AuditEventSchema,
  UserSchema,
} from '../index';

describe('SessionSchema', () => {
  it('accepts a valid session', () => {
    const valid = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      clinicianId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'created',
      joints: ['shoulder'],
      createdAt: '2026-02-08T10:00:00.000Z',
      updatedAt: '2026-02-08T10:00:00.000Z',
    };
    expect(SessionSchema.parse(valid)).toBeDefined();
  });

  it('rejects session with no joints', () => {
    const invalid = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      clinicianId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'created',
      joints: [],
      createdAt: '2026-02-08T10:00:00.000Z',
      updatedAt: '2026-02-08T10:00:00.000Z',
    };
    expect(() => SessionSchema.parse(invalid)).toThrow();
  });

  it('rejects invalid session status', () => {
    const invalid = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      clinicianId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'nonexistent_status',
      joints: ['knee'],
      createdAt: '2026-02-08T10:00:00.000Z',
      updatedAt: '2026-02-08T10:00:00.000Z',
    };
    expect(() => SessionSchema.parse(invalid)).toThrow();
  });
});

describe('CreateSessionSchema', () => {
  it('accepts valid create session input', () => {
    const valid = {
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      clinicianId: '550e8400-e29b-41d4-a716-446655440002',
      joints: ['shoulder', 'knee'],
    };
    expect(CreateSessionSchema.parse(valid)).toBeDefined();
  });
});

describe('MeasurementSchema', () => {
  it('accepts a valid measurement', () => {
    const valid = {
      id: '550e8400-e29b-41d4-a716-446655440010',
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      joint: 'knee',
      movement: 'flexion',
      side: 'right',
      romDegrees: 135.5,
      confidenceScore: 0.92,
      qualityFlags: [],
      algorithmVersion: 'v1.0',
      captureDurationMs: 3200,
      createdAt: '2026-02-08T10:01:00.000Z',
    };
    expect(MeasurementSchema.parse(valid)).toBeDefined();
  });

  it('rejects romDegrees out of range', () => {
    const invalid = {
      id: '550e8400-e29b-41d4-a716-446655440010',
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      joint: 'knee',
      movement: 'flexion',
      side: 'right',
      romDegrees: 400,
      confidenceScore: 0.92,
      qualityFlags: [],
      algorithmVersion: 'v1.0',
      captureDurationMs: 3200,
      createdAt: '2026-02-08T10:01:00.000Z',
    };
    expect(() => MeasurementSchema.parse(invalid)).toThrow();
  });

  it('rejects invalid body side', () => {
    const invalid = {
      id: '550e8400-e29b-41d4-a716-446655440010',
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      joint: 'knee',
      movement: 'flexion',
      side: 'center',
      romDegrees: 90,
      confidenceScore: 0.8,
      qualityFlags: [],
      algorithmVersion: 'v1.0',
      captureDurationMs: 2000,
      createdAt: '2026-02-08T10:01:00.000Z',
    };
    expect(() => MeasurementSchema.parse(invalid)).toThrow();
  });
});

describe('NoteBlockSchema', () => {
  it('accepts a valid note block', () => {
    const valid = {
      joint: 'shoulder',
      movement: 'flexion',
      side: 'left',
      romDegrees: 160,
      confidenceScore: 0.95,
    };
    expect(NoteBlockSchema.parse(valid)).toBeDefined();
  });
});

describe('NoteSchema', () => {
  it('accepts a valid note', () => {
    const valid = {
      id: '550e8400-e29b-41d4-a716-446655440020',
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      clinicianId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'draft',
      blocks: [
        { joint: 'knee', movement: 'flexion', side: 'right', romDegrees: 130, confidenceScore: 0.9 },
      ],
      generatedAt: '2026-02-08T10:05:00.000Z',
    };
    expect(NoteSchema.parse(valid)).toBeDefined();
  });

  it('rejects note with empty blocks', () => {
    const invalid = {
      id: '550e8400-e29b-41d4-a716-446655440020',
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      clinicianId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'draft',
      blocks: [],
      generatedAt: '2026-02-08T10:05:00.000Z',
    };
    expect(() => NoteSchema.parse(invalid)).toThrow();
  });
});

describe('AuditEventSchema', () => {
  it('accepts a valid audit event', () => {
    const valid = {
      id: '550e8400-e29b-41d4-a716-446655440030',
      action: 'session.created',
      actorId: '550e8400-e29b-41d4-a716-446655440002',
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      resourceType: 'session',
      resourceId: '550e8400-e29b-41d4-a716-446655440000',
      timestamp: '2026-02-08T10:00:00.000Z',
    };
    expect(AuditEventSchema.parse(valid)).toBeDefined();
  });
});

describe('UserSchema', () => {
  it('accepts a valid user', () => {
    const valid = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      email: 'clinician@clinic.example',
      displayName: 'Dr. Smith',
      role: 'clinician',
      isActive: true,
      createdAt: '2026-02-08T09:00:00.000Z',
      updatedAt: '2026-02-08T09:00:00.000Z',
    };
    expect(UserSchema.parse(valid)).toBeDefined();
  });

  it('rejects invalid role', () => {
    const invalid = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      email: 'user@example.com',
      displayName: 'User',
      role: 'superadmin',
      isActive: true,
      createdAt: '2026-02-08T09:00:00.000Z',
      updatedAt: '2026-02-08T09:00:00.000Z',
    };
    expect(() => UserSchema.parse(invalid)).toThrow();
  });
});
