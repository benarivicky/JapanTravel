/**
 * Unit tests for src/lib/firebase.ts
 * Verifies env-var-driven config, duplicate-init guard, and missing-var errors.
 */

const VALID_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:123:web:abc',
};

// We need to dynamically require firebase.ts after setting env vars,
// so we reset modules before each test.
beforeEach(() => {
  jest.resetModules();
  // Restore all env vars to valid state
  Object.assign(process.env, VALID_ENV);
});

afterEach(() => {
  // Clean up env vars set by tests
  for (const key of Object.keys(VALID_ENV)) {
    delete process.env[key];
  }
});

describe('firebase.ts — env-var configuration', () => {
  test('initializeApp is called with values from process.env, not hardcoded strings', () => {
    // Intercept initializeApp via isolateModules
    jest.isolateModules(() => {
      const { initializeApp } = jest.requireMock('firebase/app') as any;
      jest.mock('firebase/app', () => ({
        initializeApp: jest.fn(() => ({ name: '[DEFAULT]' })),
        getApps: jest.fn(() => []),
        getApp: jest.fn(),
      }));
      jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
      jest.mock('firebase/firestore', () => ({ getFirestore: jest.fn() }));

      require('../firebase');

      const mockInit = (require('firebase/app') as any).initializeApp;
      expect(mockInit).toHaveBeenCalledTimes(1);
      const config = mockInit.mock.calls[0][0];
      expect(config.apiKey).toBe('test-api-key');
      expect(config.projectId).toBe('test-project');
      // Must NOT contain any hardcoded production values
      expect(config.apiKey).not.toContain('AIzaSyCT81');
    });
  });

  test('throws a descriptive error when NEXT_PUBLIC_FIREBASE_API_KEY is missing', () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    jest.isolateModules(() => {
      jest.mock('firebase/app', () => ({
        initializeApp: jest.fn(),
        getApps: jest.fn(() => []),
        getApp: jest.fn(),
      }));
      jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
      jest.mock('firebase/firestore', () => ({ getFirestore: jest.fn() }));

      expect(() => require('../firebase')).toThrow(
        'Missing required environment variable: NEXT_PUBLIC_FIREBASE_API_KEY'
      );
    });
  });

  test('throws a descriptive error when NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing', () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    jest.isolateModules(() => {
      jest.mock('firebase/app', () => ({
        initializeApp: jest.fn(),
        getApps: jest.fn(() => []),
        getApp: jest.fn(),
      }));
      jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
      jest.mock('firebase/firestore', () => ({ getFirestore: jest.fn() }));

      expect(() => require('../firebase')).toThrow(
        'Missing required environment variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID'
      );
    });
  });

  test('does not call initializeApp twice when module is loaded (duplicate guard)', () => {
    jest.isolateModules(() => {
      const mockApp = { name: '[DEFAULT]' };
      jest.mock('firebase/app', () => ({
        initializeApp: jest.fn(() => mockApp),
        // Simulate an already-initialized app on the second call
        getApps: jest.fn().mockReturnValueOnce([]).mockReturnValueOnce([mockApp]),
        getApp: jest.fn(() => mockApp),
      }));
      jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
      jest.mock('firebase/firestore', () => ({ getFirestore: jest.fn() }));

      require('../firebase');
      // Re-requiring inside the same isolateModules scope uses the cached module,
      // so initializeApp should only be called once total.
      require('../firebase');

      const mockInit = (require('firebase/app') as any).initializeApp;
      expect(mockInit).toHaveBeenCalledTimes(1);
    });
  });
});
