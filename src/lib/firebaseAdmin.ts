import admin from 'firebase-admin';
import fs from 'fs';
import { logger } from './logger';

let initialized = false;

async function initAdmin(): Promise<void> {
  if (initialized || admin.apps.length) {
    initialized = true;
    return;
  }

  let credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  // Fallback: if env var not set, try local service-account.json in project root
  if (!credsPath) {
    const localPath = `${process.cwd()}/service-account.json`;
    if (fs.existsSync(localPath)) {
      credsPath = localPath;
    }
  }
  try {
    if (credsPath && fs.existsSync(credsPath)) {
      const raw = fs.readFileSync(credsPath, 'utf8');
      const serviceAccount = JSON.parse(raw);
      const projectId = serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
      logger.debug('Initializing Firebase Admin with service account', { hasProjectId: Boolean(projectId) });
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
        projectId,
      });
      initialized = true;
      return;
    }

    // Try ADC with explicit projectId if available
    const projectIdEnv = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
    if (projectIdEnv) {
      logger.debug('Initializing Firebase Admin with ADC and explicit projectId', { projectId: projectIdEnv });
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectIdEnv,
      });
      initialized = true;
      return;
    }

    // Last resort: initialize with application default credentials (may fail if no ADC)
    logger.debug('Initializing Firebase Admin with applicationDefault()');
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    initialized = true;
  } catch (err) {
    logger.error('Failed to initialize Firebase Admin SDK', err as Error);
    // Do not throw here; let callers handle lack of initialization.
  }
}

export async function getDb(): Promise<admin.firestore.Firestore> {
  await initAdmin();
  try {
    const db = admin.firestore();
    // Try to detect projectId from admin app options or environment
    // Prefer admin app options, fall back to env vars
    // @ts-ignore
    const pidFromDb = (db as any)?._databaseId?.projectId;
    const pidFromAdmin = (admin.apps && admin.apps[0] && (admin.apps[0].options as any)?.projectId) || null;
    const pid = pidFromDb || pidFromAdmin || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || null;
    if (!pid) {
      logger.warn('No project id detected by Admin SDK; proceeding because credentials appear present (env may provide project id).');
    }
    return db;
  } catch (err) {
    logger.error('Unable to get Firestore DB instance', err as Error);
    throw new Error('Firebase Admin not initialized with a Project ID. Ensure GOOGLE_APPLICATION_CREDENTIALS or NEXT_PUBLIC_FIREBASE_PROJECT_ID is set.');
  }
}

export { admin };
