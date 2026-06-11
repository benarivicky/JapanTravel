/**
 * Unit tests for src/lib/firebase.ts
 *
 * Key constraint: Next.js/Turbopack statically replaces process.env.NEXT_PUBLIC_*
 * at compile time using literal references. Dynamic access (process.env[key]) does
 * NOT work in client bundles — so validation checks config VALUES, not process.env.
 */

const VALID_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "test-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "test-project",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "test.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:abc",
};

beforeEach(() => {
  jest.resetModules();
  Object.assign(process.env, VALID_ENV);
});

afterEach(() => {
  for (const key of Object.keys(VALID_ENV)) {
    delete process.env[key];
  }
});

describe("firebase.ts — configuration", () => {
  test("initializeApp receives values from process.env, not hardcoded strings", () => {
    jest.isolateModules(() => {
      jest.mock("firebase/app", () => ({
        initializeApp: jest.fn(() => ({ name: "[DEFAULT]" })),
        getApps: jest.fn(() => []),
        getApp: jest.fn(),
      }));
      jest.mock("firebase/auth", () => ({ getAuth: jest.fn() }));
      jest.mock("firebase/firestore", () => ({ getFirestore: jest.fn() }));

      require("../firebase");

      const { initializeApp } = require("firebase/app");
      expect(initializeApp).toHaveBeenCalledTimes(1);
      const config = initializeApp.mock.calls[0][0];

      expect(config.apiKey).toBe("test-api-key");
      expect(config.projectId).toBe("test-project");
      // Must not contain any hardcoded production key
      expect(config.apiKey).not.toContain("AIzaSyCT81");
    });
  });

  test("throws a descriptive error when NEXT_PUBLIC_FIREBASE_API_KEY is missing", () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    jest.isolateModules(() => {
      jest.mock("firebase/app", () => ({
        initializeApp: jest.fn(),
        getApps: jest.fn(() => []),
        getApp: jest.fn(),
      }));
      jest.mock("firebase/auth", () => ({ getAuth: jest.fn() }));
      jest.mock("firebase/firestore", () => ({ getFirestore: jest.fn() }));

      expect(() => require("../firebase")).toThrow("NEXT_PUBLIC_FIREBASE_API_KEY");
    });
  });

  test("throws a descriptive error when NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing", () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    jest.isolateModules(() => {
      jest.mock("firebase/app", () => ({
        initializeApp: jest.fn(),
        getApps: jest.fn(() => []),
        getApp: jest.fn(),
      }));
      jest.mock("firebase/auth", () => ({ getAuth: jest.fn() }));
      jest.mock("firebase/firestore", () => ({ getFirestore: jest.fn() }));

      expect(() => require("../firebase")).toThrow("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    });
  });

  test("does not call initializeApp twice (duplicate-init guard)", () => {
    jest.isolateModules(() => {
      const mockApp = { name: "[DEFAULT]" };
      jest.mock("firebase/app", () => ({
        initializeApp: jest.fn(() => mockApp),
        getApps: jest.fn(() => []),
        getApp: jest.fn(() => mockApp),
      }));
      jest.mock("firebase/auth", () => ({ getAuth: jest.fn() }));
      jest.mock("firebase/firestore", () => ({ getFirestore: jest.fn() }));

      require("../firebase");
      require("../firebase"); // second require hits module cache

      const { initializeApp } = require("firebase/app");
      expect(initializeApp).toHaveBeenCalledTimes(1);
    });
  });
});
