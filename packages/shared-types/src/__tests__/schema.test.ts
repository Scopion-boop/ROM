/**
 * Schema validation tests for shared domain contracts.
 *
 * Covers: Session, Measurement, Note, Audit, User schemas
 *         + Clinical domain: JointType, MovementType, JOINT_MOVEMENT_MAP,
 *           NORMATIVE_RANGES, LANDMARK_MAP
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
  JointType,
} from '../index';
import { JOINT_TYPES, JOINT_META } from '../clinical/joints';
import { MOVEMENT_TYPES, MOVEMENT_META } from '../clinical/movements';
import {
  JOINT_MOVEMENT_MAP,
  isValidJointMovement,
  getMovementsForJoint,
  TOTAL_MEASUREMENT_TYPES,
} from '../clinical/joint-movement-map';
import {
  NORMATIVE_RANGES,
  getNormativeRange,
  compareToNormative,
} from '../clinical/normative-ranges';
import { LANDMARK_MAP, getLandmarkTriple, getSidesForJoint } from '../clinical/landmark-map';

// ─── Helpers ───────────────────────────────────────────────────────
const UUID1 = '550e8400-e29b-41d4-a716-446655440000';
const UUID2 = '550e8400-e29b-41d4-a716-446655440001';
const UUID3 = '550e8400-e29b-41d4-a716-446655440002';
const TS = '2026-02-08T10:00:00.000Z';

// ═══════════════════════════════════════════════════════════════════
// SESSION
// ═══════════════════════════════════════════════════════════════════
describe('SessionSchema', () => {
  it('accepts a valid session', () => {
    const valid = {
      id: UUID1,
      organizationId: UUID2,
      clinicianId: UUID3,
      status: 'created',
      joints: ['shoulder'],
      createdAt: TS,
      updatedAt: TS,
    };
    expect(SessionSchema.parse(valid)).toBeDefined();
  });

  it('rejects session with no joints', () => {
    const invalid = {
      id: UUID1,
      organizationId: UUID2,
      clinicianId: UUID3,
      status: 'created',
      joints: [],
      createdAt: TS,
      updatedAt: TS,
    };
    expect(() => SessionSchema.parse(invalid)).toThrow();
  });

  it('rejects invalid session status', () => {
    const invalid = {
      id: UUID1,
      organizationId: UUID2,
      clinicianId: UUID3,
      status: 'nonexistent_status',
      joints: ['knee'],
      createdAt: TS,
      updatedAt: TS,
    };
    expect(() => SessionSchema.parse(invalid)).toThrow();
  });

  it('accepts multiple valid joint types', () => {
    const valid = {
      id: UUID1,
      organizationId: UUID2,
      clinicianId: UUID3,
      status: 'created',
      joints: ['shoulder', 'knee', 'cervical_spine'],
      createdAt: TS,
      updatedAt: TS,
    };
    expect(SessionSchema.parse(valid)).toBeDefined();
  });

  it('rejects invalid joint type in array', () => {
    const invalid = {
      id: UUID1,
      organizationId: UUID2,
      clinicianId: UUID3,
      status: 'created',
      joints: ['shoulder', 'finger'],
      createdAt: TS,
      updatedAt: TS,
    };
    expect(() => SessionSchema.parse(invalid)).toThrow();
  });
});

describe('CreateSessionSchema', () => {
  it('accepts valid create session input', () => {
    const valid = {
      organizationId: UUID2,
      clinicianId: UUID3,
      joints: ['shoulder', 'knee'],
    };
    expect(CreateSessionSchema.parse(valid)).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// MEASUREMENT
// ═══════════════════════════════════════════════════════════════════
describe('MeasurementSchema', () => {
  const baseMeasurement = {
    id: UUID1,
    sessionId: UUID2,
    joint: 'knee',
    movement: 'flexion',
    side: 'right',
    romDegrees: 135.5,
    confidenceScore: 0.92,
    qualityFlags: [],
    algorithmVersion: 'v1.0',
    captureDurationMs: 3200,
    createdAt: TS,
  };

  it('accepts a valid measurement', () => {
    expect(MeasurementSchema.parse(baseMeasurement)).toBeDefined();
  });

  it('accepts midline side for spine', () => {
    const spine = {
      ...baseMeasurement,
      joint: 'lumbar_spine',
      movement: 'flexion',
      side: 'midline',
    };
    expect(MeasurementSchema.parse(spine)).toBeDefined();
  });

  it('accepts optional plane field', () => {
    const withPlane = { ...baseMeasurement, plane: 'sagittal' };
    expect(MeasurementSchema.parse(withPlane).plane).toBe('sagittal');
  });

  it('accepts optional normalRomDegrees and percentOfNormal', () => {
    const withNorm = {
      ...baseMeasurement,
      normalRomDegrees: 140,
      percentOfNormal: 97,
    };
    const parsed = MeasurementSchema.parse(withNorm);
    expect(parsed.normalRomDegrees).toBe(140);
    expect(parsed.percentOfNormal).toBe(97);
  });

  it('rejects romDegrees out of range', () => {
    expect(() => MeasurementSchema.parse({ ...baseMeasurement, romDegrees: 400 })).toThrow();
  });

  it('rejects invalid body side', () => {
    expect(() => MeasurementSchema.parse({ ...baseMeasurement, side: 'center' })).toThrow();
  });

  it('rejects invalid joint type', () => {
    expect(() => MeasurementSchema.parse({ ...baseMeasurement, joint: 'finger' })).toThrow();
  });

  it('rejects invalid movement type', () => {
    expect(() => MeasurementSchema.parse({ ...baseMeasurement, movement: 'twist' })).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════
// NOTE BLOCK
// ═══════════════════════════════════════════════════════════════════
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

  it('accepts optional normative fields', () => {
    const valid = {
      joint: 'knee',
      movement: 'flexion',
      side: 'right',
      romDegrees: 130,
      confidenceScore: 0.9,
      normalRomDegrees: 140,
      percentOfNormal: 93,
    };
    const parsed = NoteBlockSchema.parse(valid);
    expect(parsed.normalRomDegrees).toBe(140);
    expect(parsed.percentOfNormal).toBe(93);
  });

  it('accepts midline for spine blocks', () => {
    const valid = {
      joint: 'cervical_spine',
      movement: 'flexion',
      side: 'midline',
      romDegrees: 45,
      confidenceScore: 0.88,
    };
    expect(NoteBlockSchema.parse(valid)).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// NOTE
// ═══════════════════════════════════════════════════════════════════
describe('NoteSchema', () => {
  const baseNote = {
    id: UUID1,
    sessionId: UUID2,
    clinicianId: UUID3,
    status: 'draft',
    blocks: [
      { joint: 'knee', movement: 'flexion', side: 'right', romDegrees: 130, confidenceScore: 0.9 },
    ],
    generatedAt: TS,
  };

  it('accepts a valid note', () => {
    expect(NoteSchema.parse(baseNote)).toBeDefined();
  });

  it('rejects note with empty blocks', () => {
    expect(() => NoteSchema.parse({ ...baseNote, blocks: [] })).toThrow();
  });

  it('accepts all valid note statuses', () => {
    for (const status of ['draft', 'reviewed', 'finalized', 'amended', 'exported']) {
      expect(NoteSchema.parse({ ...baseNote, status })).toBeDefined();
    }
  });

  it('rejects legacy status "approved"', () => {
    expect(() => NoteSchema.parse({ ...baseNote, status: 'approved' })).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════
// AUDIT
// ═══════════════════════════════════════════════════════════════════
describe('AuditEventSchema', () => {
  it('accepts a valid audit event', () => {
    const valid = {
      id: UUID1,
      action: 'session.created',
      actorId: UUID3,
      organizationId: UUID2,
      resourceType: 'session',
      resourceId: UUID1,
      timestamp: TS,
    };
    expect(AuditEventSchema.parse(valid)).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// USER
// ═══════════════════════════════════════════════════════════════════
describe('UserSchema', () => {
  it('accepts a valid user', () => {
    const valid = {
      id: UUID3,
      organizationId: UUID2,
      email: 'clinician@clinic.example',
      displayName: 'Dr. Smith',
      role: 'clinician',
      isActive: true,
      createdAt: TS,
      updatedAt: TS,
    };
    expect(UserSchema.parse(valid)).toBeDefined();
  });

  it('rejects invalid role', () => {
    const invalid = {
      id: UUID3,
      organizationId: UUID2,
      email: 'user@example.com',
      displayName: 'User',
      role: 'superadmin',
      isActive: true,
      createdAt: TS,
      updatedAt: TS,
    };
    expect(() => UserSchema.parse(invalid)).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════
// CLINICAL: JointType
// ═══════════════════════════════════════════════════════════════════
describe('JointType', () => {
  it('contains exactly 9 joint types', () => {
    expect(JOINT_TYPES).toHaveLength(9);
  });

  it('includes all expected joints', () => {
    const expected = [
      'shoulder',
      'elbow',
      'wrist',
      'hip',
      'knee',
      'ankle',
      'cervical_spine',
      'thoracic_spine',
      'lumbar_spine',
    ];
    for (const j of expected) {
      expect(JOINT_TYPES).toContain(j);
    }
  });

  it('parses valid joint string', () => {
    expect(JointType.parse('shoulder')).toBe('shoulder');
  });

  it('rejects invalid joint string', () => {
    expect(() => JointType.parse('finger')).toThrow();
  });

  it('has metadata for every joint', () => {
    for (const j of JOINT_TYPES) {
      expect(JOINT_META[j]).toBeDefined();
      expect(JOINT_META[j].label).toBeTruthy();
    }
  });

  it('marks spine joints as non-bilateral', () => {
    expect(JOINT_META['cervical_spine'].bilateral).toBe(false);
    expect(JOINT_META['thoracic_spine'].bilateral).toBe(false);
    expect(JOINT_META['lumbar_spine'].bilateral).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// CLINICAL: MovementType
// ═══════════════════════════════════════════════════════════════════
describe('MovementType', () => {
  it('contains exactly 20 movement types', () => {
    expect(MOVEMENT_TYPES).toHaveLength(20);
  });

  it('has metadata with valid plane for every movement', () => {
    for (const m of MOVEMENT_TYPES) {
      const meta = MOVEMENT_META[m];
      expect(meta).toBeDefined();
      expect(['sagittal', 'frontal', 'transverse']).toContain(meta.plane);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// CLINICAL: Joint-Movement Map
// ═══════════════════════════════════════════════════════════════════
describe('JOINT_MOVEMENT_MAP', () => {
  it('has entries for all 9 joints', () => {
    expect(Object.keys(JOINT_MOVEMENT_MAP)).toHaveLength(9);
  });

  it('has correct total measurement combos (44)', () => {
    expect(TOTAL_MEASUREMENT_TYPES).toBe(44);
  });

  it('shoulder has 8 movements', () => {
    expect(JOINT_MOVEMENT_MAP['shoulder']).toHaveLength(8);
  });

  it('knee has 2 movements', () => {
    expect(JOINT_MOVEMENT_MAP['knee']).toHaveLength(2);
  });

  it('isValidJointMovement works correctly', () => {
    expect(isValidJointMovement('knee', 'flexion')).toBe(true);
    expect(isValidJointMovement('knee', 'abduction')).toBe(false);
    expect(isValidJointMovement('shoulder', 'horizontal_adduction')).toBe(true);
  });

  it('getMovementsForJoint returns correct array', () => {
    const kneeMovements = getMovementsForJoint('knee');
    expect(kneeMovements).toEqual(['flexion', 'extension']);
  });
});

// ═══════════════════════════════════════════════════════════════════
// CLINICAL: Normative Ranges
// ═══════════════════════════════════════════════════════════════════
describe('NORMATIVE_RANGES', () => {
  it('has entries for all valid joint-movement pairs', () => {
    let expectedCount = 0;
    for (const movements of Object.values(JOINT_MOVEMENT_MAP)) {
      expectedCount += movements.length;
    }
    expect(Object.keys(NORMATIVE_RANGES)).toHaveLength(expectedCount);
  });

  it('shoulder flexion max is 180°', () => {
    const range = getNormativeRange('shoulder', 'flexion');
    expect(range).toBeDefined();
    expect(range!.maxDegrees).toBe(180);
    expect(range!.source).toBe('AMA6');
  });

  it('knee flexion max is 140°', () => {
    const range = getNormativeRange('knee', 'flexion');
    expect(range).toBeDefined();
    expect(range!.maxDegrees).toBe(140);
  });

  it('returns undefined for invalid pair', () => {
    expect(getNormativeRange('knee', 'abduction')).toBeUndefined();
  });

  it('compareToNormative calculates correctly', () => {
    // Shoulder flexion: 180° normal, measure 150°
    const result = compareToNormative('shoulder', 'flexion', 150);
    expect(result.withinNormal).toBe(true);
    expect(result.percentOfNormal).toBe(83); // round(150/180*100)
    expect(result.deficitDegrees).toBe(30);
    expect(result.normativeRange).toBeDefined();
  });

  it('compareToNormative detects deficit', () => {
    // Knee flexion: 140° normal, measure 200° – exceeds max
    const result = compareToNormative('knee', 'flexion', 200);
    expect(result.withinNormal).toBe(false);
    expect(result.deficitDegrees).toBe(0); // exceeded max, no deficit
  });
});

// ═══════════════════════════════════════════════════════════════════
// CLINICAL: Landmark Map
// ═══════════════════════════════════════════════════════════════════
describe('LANDMARK_MAP', () => {
  it('has landmark triples for bilateral joints on both sides', () => {
    const triple = getLandmarkTriple('knee', 'flexion', 'left');
    expect(triple).toBeDefined();
    expect(triple!.center).toBe(25); // left_knee
    const rightTriple = getLandmarkTriple('knee', 'flexion', 'right');
    expect(rightTriple).toBeDefined();
    expect(rightTriple!.center).toBe(26); // right_knee
  });

  it('has midline landmarks for spine joints', () => {
    const triple = getLandmarkTriple('cervical_spine', 'flexion', 'midline');
    expect(triple).toBeDefined();
    expect(triple!.preferredView).toBe('sagittal');
  });

  it('returns undefined for invalid combo', () => {
    expect(getLandmarkTriple('knee', 'abduction', 'left')).toBeUndefined();
  });

  it('getSidesForJoint returns left/right for bilateral', () => {
    expect(getSidesForJoint('shoulder')).toEqual(['left', 'right']);
  });

  it('getSidesForJoint returns midline for spine', () => {
    expect(getSidesForJoint('cervical_spine')).toEqual(['midline']);
  });

  it('all landmark indices are in 0-32 range', () => {
    for (const triple of Object.values(LANDMARK_MAP)) {
      if (!triple) continue;
      expect(triple.proximal).toBeGreaterThanOrEqual(0);
      expect(triple.proximal).toBeLessThanOrEqual(32);
      expect(triple.center).toBeGreaterThanOrEqual(0);
      expect(triple.center).toBeLessThanOrEqual(32);
      expect(triple.distal).toBeGreaterThanOrEqual(0);
      expect(triple.distal).toBeLessThanOrEqual(32);
    }
  });
});
