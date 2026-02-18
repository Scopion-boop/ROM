# Drizzle Repository Integration Tests

Comprehensive integration tests for Drizzle ORM repositories that verify database operations against a real PostgreSQL database.

## Prerequisites

### 1. PostgreSQL Test Database

You need a running PostgreSQL database for integration testing. **Do not use your development or production database.**

#### Option A: Docker (Recommended)

```bash
# Start PostgreSQL test database
docker run --name rom-test-db \
  -p 5433:5432 \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=rom_test \
  -d postgres:15

# Stop and remove when done
docker stop rom-test-db && docker rm rom-test-db
```

#### Option B: Local PostgreSQL

Create a dedicated test database:

```sql
CREATE DATABASE rom_test;
```

### 2. Environment Variable

Set the `TEST_DATABASE_URL` environment variable:

```bash
export TEST_DATABASE_URL="postgresql://postgres:test@localhost:5433/rom_test"
```

Or create a `.env.test` file in `apps/api/`:

```env
TEST_DATABASE_URL=postgresql://postgres:test@localhost:5433/rom_test
```

## Running Tests

### Run All Integration Tests

```bash
cd apps/api
TEST_DATABASE_URL="postgresql://postgres:test@localhost:5433/rom_test" npm test -- --grep "Integration"
```

### Run Specific Test Suites

```bash
# Session repository tests
TEST_DATABASE_URL="..." npm test -- session-repo.integration.test.ts

# Measurement repository tests
TEST_DATABASE_URL="..." npm test -- measurement-repo.integration.test.ts
```

### Run in CI/CD

In GitHub Actions or other CI systems:

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: test
      POSTGRES_DB: rom_test
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5

steps:
  - name: Run integration tests
    env:
      TEST_DATABASE_URL: postgresql://postgres:test@localhost:5432/rom_test
    run: npm test -- --grep "Integration"
```

## Test Structure

### Test Setup (`test-setup.ts`)

- Manages test database connection lifecycle
- Runs migrations (if needed)
- Clears all tables before each test for isolation
- Provides `setupIntegrationTestHooks()` for easy integration

### Session Repository Tests (`session-repo.integration.test.ts`)

Tests:
- ✅ Create sessions with all fields
- ✅ Get session by ID
- ✅ List sessions by organization
- ✅ Update session status
- ✅ Concurrent operations (race condition safety)
- ✅ Data persistence across multiple reads
- ✅ Data integrity after updates

### Measurement Repository Tests (`measurement-repo.integration.test.ts`)

Tests:
- ✅ Create measurements with all fields
- ✅ Get measurement by ID
- ✅ List measurements by session
- ✅ Concurrent measurement creates
- ✅ Decimal precision preservation (ROM degrees, confidence scores)
- ✅ Quality flags array handling
- ✅ Measurement ordering

## Writing New Integration Tests

```typescript
import { describe, it, expect } from 'vitest';
import { setupIntegrationTestHooks } from './test-setup';
import { createDrizzleYourRepo } from '../your-repo';

describe('YourRepo Integration Tests', () => {
    setupIntegrationTestHooks(); // Handles setup/teardown

    const repo = createDrizzleYourRepo();

    it('should do something', async () => {
        const result = await repo.doSomething();
        expect(result).toBeDefined();
    });
});
```

## Troubleshooting

### "TEST_DATABASE_URL is not set"

Make sure you've exported the environment variable or created a `.env.test` file.

### "Connection refused"

Ensure PostgreSQL is running and accessible on the specified port:

```bash
# Check if PostgreSQL is running
docker ps | grep rom-test-db

# Check connection
psql postgresql://postgres:test@localhost:5433/rom_test -c "SELECT 1"
```

### "relation does not exist"

The database schema may not be initialized. Run migrations:

```bash
cd apps/api
npx drizzle-kit push
```

### Tests Interfering With Each Other

Each test should be isolated via `beforeEach` clearing all tables. If you see interference:

1. Check that `setupIntegrationTestHooks()` is called
2. Verify `clearAllTables()` clears in correct dependency order
3. Ensure tests don't rely on execution order

## Performance

Integration tests are slower than unit tests because they hit a real database. Expected timings:

- Setup: ~100ms (one-time)
- Per test: ~10-50ms
- Cleanup: ~50ms (one-time)

Full suite: ~2-5 seconds

## Best Practices

1. **Use transactions for test isolation** (future improvement)
2. **Don't test Drizzle ORM itself** - focus on your repository logic
3. **Test edge cases** - concurrent access, null values, empty arrays
4. **Test data precision** - floating point numbers, timestamps
5. **Clean up properly** - always clear data in `beforeEach`
6. **Run in CI** - catch database-specific issues early

## Future Improvements

- [ ] Use database transactions for faster test isolation
- [ ] Add tests for audit repository
- [ ] Add tests for note repository
- [ ] Add tests for user repository
- [ ] Add tests for database constraint violations
- [ ] Add tests for connection pool exhaustion
- [ ] Add performance benchmarks

## See Also

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Vitest Documentation](https://vitest.dev/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
