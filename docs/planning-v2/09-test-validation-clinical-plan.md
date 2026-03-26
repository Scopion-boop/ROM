# 09 - Test, Validation, and Clinical Quality Plan

## Test pyramid

## Unit tests

- Angle calculation primitives
- Validation and quality scoring rules
- Note generation formatting
- Auth and authorization policy checks

## Integration tests

- API routes + DB persistence
- CV pipeline output -> measurement storage
- Summary job pipeline
- Export and audit event generation

## End-to-end tests

- Clinician happy path: start session -> capture -> review -> export
- Error path: low confidence -> retry -> accept
- Role path: clinician vs admin permissions

## Non-functional tests

- Performance tests for key APIs and capture flows
- Soak tests for session volume
- Security tests (auth bypass, injection, abuse scenarios)

## Clinical validation framework

- Compare AI-assisted outputs against reference manual measurements
- Multi-rater protocol to assess consistency
- Stratify by joint, movement, environment quality, and patient body types

## Quality thresholds (draft)

- Mean absolute error threshold (to be finalized with clinical lead)
- Minimum confidence score for auto-accept
- Inter-session repeatability threshold

## Data and model governance

- Version all algorithms and key model configurations
- Track calibration and confidence distributions over time
- Release model updates behind feature flag with staged validation

## UAT and pilot acceptance

- Clinician usability score target
- Time-per-assessment target
- Documentation quality target
- Safety/appropriateness review sign-off
