/**
 * clinical-tests.ts — Database of clinical special tests per joint.
 *
 * These are orthopaedic/MSK tests that CANNOT be performed via imaging
 * alone and require hands-on examination. Organised by joint, with
 * indications based on ROM deficit patterns.
 *
 * Sources: AAOS Clinical Practice Guidelines, Magee DJ Orthopedic
 * Physical Assessment, Hoppenfeld S Physical Examination of the Spine
 * and Extremities.
 */

export interface ClinicalTest {
    name: string;
    /** What the test assesses. */
    purpose: string;
    /** When to recommend based on ROM findings. */
    indication: string;
    /** Movements or deficit patterns that trigger this recommendation. */
    triggerMovements: string[];
    /** Sensitivity / specificity note (if well-established). */
    evidence?: string;
}

export interface JointTestSet {
    joint: string;
    tests: ClinicalTest[];
}

// ─── Shoulder ──────────────────────────────────────────────────────

const SHOULDER_TESTS: ClinicalTest[] = [
    {
        name: "Neer's Impingement Sign",
        purpose: 'Subacromial impingement / rotator cuff tendinopathy',
        indication: 'Reduced flexion or abduction with pain',
        triggerMovements: ['flexion', 'abduction'],
        evidence: 'Sensitivity 72%, Specificity 60%',
    },
    {
        name: 'Hawkins-Kennedy Test',
        purpose: 'Subacromial impingement',
        indication: 'Painful arc or limited flexion/internal rotation',
        triggerMovements: ['flexion', 'internal_rotation'],
        evidence: 'Sensitivity 80%, Specificity 56%',
    },
    {
        name: 'Empty Can Test (Jobe)',
        purpose: 'Supraspinatus integrity',
        indication: 'Weakness or deficit in abduction',
        triggerMovements: ['abduction'],
        evidence: 'Sensitivity 69%, Specificity 62%',
    },
    {
        name: "Speed's Test",
        purpose: 'Biceps tendon pathology / SLAP lesion',
        indication: 'Anterior shoulder pain with flexion deficit',
        triggerMovements: ['flexion'],
        evidence: 'Sensitivity 63%, Specificity 58%',
    },
    {
        name: 'Apprehension / Relocation Test',
        purpose: 'Anterior glenohumeral instability',
        indication: 'Limited external rotation or history of subluxation',
        triggerMovements: ['external_rotation', 'abduction'],
        evidence: 'Sensitivity 72%, Specificity 96% (combined)',
    },
    {
        name: "O'Brien's Active Compression Test",
        purpose: 'SLAP lesion / AC joint pathology',
        indication: 'Pain with overhead movements or cross-body adduction',
        triggerMovements: ['flexion', 'adduction', 'internal_rotation'],
        evidence: 'Sensitivity 100%, Specificity 98% (original study)',
    },
    {
        name: 'Drop Arm Test',
        purpose: 'Full-thickness rotator cuff tear',
        indication: 'Significant abduction deficit, especially severe',
        triggerMovements: ['abduction'],
        evidence: 'Sensitivity 27%, Specificity 88%',
    },
    {
        name: 'Infraspinatus Strength Test',
        purpose: 'Infraspinatus integrity (external rotation weakness)',
        indication: 'Deficit in external rotation',
        triggerMovements: ['external_rotation'],
    },
];

// ─── Knee ──────────────────────────────────────────────────────────

const KNEE_TESTS: ClinicalTest[] = [
    {
        name: 'Lachman Test',
        purpose: 'Anterior cruciate ligament (ACL) integrity',
        indication: 'Knee instability, post-injury with flexion/extension deficit',
        triggerMovements: ['flexion', 'extension'],
        evidence: 'Sensitivity 87%, Specificity 93%',
    },
    {
        name: 'Anterior Drawer Test',
        purpose: 'ACL laxity',
        indication: 'Knee effusion or limited flexion post-trauma',
        triggerMovements: ['flexion'],
        evidence: 'Sensitivity 48%, Specificity 93%',
    },
    {
        name: "McMurray's Test",
        purpose: 'Meniscal tear',
        indication: 'Joint-line tenderness with flexion deficit or locking',
        triggerMovements: ['flexion', 'extension'],
        evidence: 'Sensitivity 61%, Specificity 84%',
    },
    {
        name: 'Valgus Stress Test',
        purpose: 'Medial collateral ligament (MCL) integrity',
        indication: 'Medial knee pain or instability',
        triggerMovements: ['flexion', 'extension'],
    },
    {
        name: 'Varus Stress Test',
        purpose: 'Lateral collateral ligament (LCL) integrity',
        indication: 'Lateral knee instability',
        triggerMovements: ['flexion', 'extension'],
    },
    {
        name: 'Thessaly Test',
        purpose: 'Meniscal pathology (weight-bearing)',
        indication: 'Rotational pain, flexion deficit',
        triggerMovements: ['flexion'],
        evidence: 'Sensitivity 89%, Specificity 97% (at 20° flexion)',
    },
    {
        name: 'Pivot Shift Test',
        purpose: 'ACL deficiency (rotational instability)',
        indication: 'Giving-way episodes, ACL tear suspicion',
        triggerMovements: ['flexion', 'extension'],
        evidence: 'Sensitivity 49%, Specificity 98%',
    },
    {
        name: 'Patellar Apprehension Test',
        purpose: 'Patellar instability / subluxation',
        indication: 'Anterior knee pain with extension deficit',
        triggerMovements: ['extension'],
    },
];

// ─── Hip ───────────────────────────────────────────────────────────

const HIP_TESTS: ClinicalTest[] = [
    {
        name: 'FABER Test (Patrick)',
        purpose: 'Hip joint pathology / SI joint dysfunction',
        indication: 'Limited hip flexion, abduction, or external rotation',
        triggerMovements: ['flexion', 'abduction', 'external_rotation'],
        evidence: 'Sensitivity 57–69%, Specificity 71%',
    },
    {
        name: 'FADIR Test',
        purpose: 'Femoroacetabular impingement / labral tear',
        indication: 'Groin pain with limited flexion or internal rotation',
        triggerMovements: ['flexion', 'adduction', 'internal_rotation'],
        evidence: 'Sensitivity 96%, Specificity 29%',
    },
    {
        name: 'Thomas Test',
        purpose: 'Hip flexion contracture / iliopsoas tightness',
        indication: 'Limited hip extension',
        triggerMovements: ['extension'],
    },
    {
        name: 'Trendelenburg Test',
        purpose: 'Hip abductor weakness (gluteus medius)',
        indication: 'Abduction deficit or antalgic gait',
        triggerMovements: ['abduction'],
    },
    {
        name: "Ober's Test",
        purpose: 'Iliotibial band (ITB) tightness',
        indication: 'Limited adduction or lateral hip pain',
        triggerMovements: ['adduction'],
    },
    {
        name: 'Log Roll Test',
        purpose: 'Intra-articular hip pathology',
        indication: 'Hip pain with limited rotation',
        triggerMovements: ['internal_rotation', 'external_rotation'],
        evidence: 'Sensitivity 52%, Specificity 82%',
    },
    {
        name: 'Stinchfield Test',
        purpose: 'Intra-articular pathology (hip flexor loading)',
        indication: 'Deep groin pain with flexion deficit',
        triggerMovements: ['flexion'],
    },
];

// ─── Registry ──────────────────────────────────────────────────────

export const CLINICAL_TESTS: JointTestSet[] = [
    { joint: 'shoulder', tests: SHOULDER_TESTS },
    { joint: 'knee', tests: KNEE_TESTS },
    { joint: 'hip', tests: HIP_TESTS },
];

/**
 * Given a joint name and a list of movements with deficits, return
 * recommended clinical tests in order of relevance.
 */
export function getRecommendedTests(
    joint: string,
    deficitMovements: string[],
): ClinicalTest[] {
    const normJoint = joint.toLowerCase();
    const testSet = CLINICAL_TESTS.find((s) => normJoint.includes(s.joint));
    if (!testSet) return [];

    // Score each test by how many trigger movements overlap with deficits
    const scored = testSet.tests.map((test) => {
        const overlapCount = test.triggerMovements.filter((t) =>
            deficitMovements.some((d) => d.toLowerCase().includes(t)),
        ).length;
        return { test, score: overlapCount };
    });

    return scored
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((s) => s.test);
}
