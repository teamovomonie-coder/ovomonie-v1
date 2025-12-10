import { NextResponse } from 'next/server';
import fs from 'fs';
import { getDb, admin } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const info: Record<string, unknown> = {
      env_GOOGLE_APPLICATION_CREDENTIALS: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      env_NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null,
      env_GCLOUD_PROJECT: process.env.GCLOUD_PROJECT || null,
    };

    try {
      const db = await getDb();
      // attempt to read projectId from admin options or db internals
      const projectId = (admin as any).options?.projectId || (db as any)?._databaseId?.projectId || null;
      info['admin_projectId'] = projectId;
      info['admin_apps_count'] = (admin.apps || []).length;

      // Inspect GOOGLE_APPLICATION_CREDENTIALS file if set
      const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || null;
      info['credsPath'] = credsPath;
      if (credsPath) {
        try {
          info['creds_exists'] = fs.existsSync(credsPath);
          if (info['creds_exists']) {
            const raw = fs.readFileSync(credsPath, 'utf8');
            try {
              const parsed = JSON.parse(raw);
              // expose only non-sensitive fields
              info['creds_project_id'] = parsed.project_id || null;
              info['creds_client_email'] = parsed.client_email || null;
            } catch (parseErr) {
              info['creds_parse_error'] = String(parseErr);
            }
          }
        } catch (fsErr) {
          info['creds_read_error'] = String(fsErr);
        }
      }

      return NextResponse.json({ ok: true, info }, { status: 200 });
    } catch (err) {
      logger.warn('Debug route: getDb failed', err as Error);
      // Always return 200 so PowerShell curl/Invoke-WebRequest doesn't throw on non-2xx
      const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || null;
      info['credsPath'] = credsPath;
      if (credsPath) {
        try {
          info['creds_exists'] = fs.existsSync(credsPath);
        } catch (fsErr) {
          info['creds_read_error'] = String(fsErr);
        }
      }
      return NextResponse.json({ ok: false, message: (err as Error).message, info }, { status: 200 });
    }
  } catch (error) {
    logger.error('Debug route unexpected error', error as Error);
    return NextResponse.json({ ok: false, message: 'Unexpected error' }, { status: 500 });
  }
}
