import { vi } from 'vitest';

// Mock proper-lockfile to avoid "Cannot use retries with the sync api" error.
// In tests, file locking is unnecessary since tests run sequentially.
vi.mock('proper-lockfile', () => ({
  default: {
    lockSync: () => () => {},   // returns a release function
    lock: async () => async () => {},
  },
  lockSync: () => () => {},
  lock: async () => async () => {},
}));
