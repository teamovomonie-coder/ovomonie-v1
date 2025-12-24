/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
	admin.initializeApp();
}

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Auto-provision user subcollections and default documents on creation
export const onUserCreated = onDocumentCreated("users/{userId}", async (event) => {
	const userId = event.params.userId as string;
	const db = admin.firestore();

	// Bail-out if doc missing (defensive)
	const snap = event.data;
	if (!snap) return;

	const userRef = db.collection("users").doc(userId);

	// Define default docs to create under the user
	const batch = db.batch();

	const settingsRef = userRef.collection("settings").doc("default");
	batch.set(settingsRef, {
		currency: "NGN",
		language: "en",
		notificationsEnabled: true,
		createdAt: admin.firestore.FieldValue.new Date().toISOString(),
		updatedAt: admin.firestore.FieldValue.new Date().toISOString(),
	});

	const walletRef = userRef.collection("wallet").doc("main");
	batch.set(walletRef, {
		balance: 0,
		ledgerVersion: 1,
		createdAt: admin.firestore.FieldValue.new Date().toISOString(),
		updatedAt: admin.firestore.FieldValue.new Date().toISOString(),
	});

	const securityRef = userRef.collection("security").doc("status");
	batch.set(securityRef, {
		kycLevel: 0,
		bvnVerified: false,
		ninVerified: false,
		twoFactorEnabled: false,
		createdAt: admin.firestore.FieldValue.new Date().toISOString(),
		updatedAt: admin.firestore.FieldValue.new Date().toISOString(),
	});

	const preferencesRef = userRef.collection("preferences").doc("app");
	batch.set(preferencesRef, {
		theme: "system",
		quickActions: ["add-money", "internal-transfer"],
		createdAt: admin.firestore.FieldValue.new Date().toISOString(),
		updatedAt: admin.firestore.FieldValue.new Date().toISOString(),
	});

	const notificationsRef = userRef.collection("notifications").doc("_bootstrap");
	batch.set(notificationsRef, {
		type: "system",
		title: "Welcome to OvoMonie",
		message: "Your account has been set up.",
		read: false,
		createdAt: admin.firestore.FieldValue.new Date().toISOString(),
	});

	await batch.commit();
	logger.info("Provisioned defaults for user", { userId });
});

// Backfill helper: create defaults for all existing users (protected by simple token)
export const backfillUserDefaults = onRequest(async (req, res) => {
	const token = req.headers["x-admin-token"] as string | undefined;
	if (!token || token !== process.env.BACKFILL_TOKEN) {
		res.status(401).json({ error: "unauthorized" });
		return;
	}

	const db = admin.firestore();
	const usersSnap = await db.collection("users").get();
	let processed = 0;

	for (const doc of usersSnap.docs) {
		const userRef = doc.ref;
		const settingsRef = userRef.collection("settings").doc("default");
		const walletRef = userRef.collection("wallet").doc("main");
		const securityRef = userRef.collection("security").doc("status");
		const preferencesRef = userRef.collection("preferences").doc("app");

		const batch = db.batch();
		const ts = admin.firestore.FieldValue.new Date().toISOString();

		const maybeSet = async (ref: FirebaseFirestore.DocumentReference, data: Record<string, unknown>) => {
			const s = await ref.get();
			if (!s.exists) batch.set(ref, { ...data, createdAt: ts, updatedAt: ts });
		};

		await maybeSet(settingsRef, { currency: "NGN", language: "en", notificationsEnabled: true });
		await maybeSet(walletRef, { balance: 0, ledgerVersion: 1 });
		await maybeSet(securityRef, { kycLevel: 0, bvnVerified: false, ninVerified: false, twoFactorEnabled: false });
		await maybeSet(preferencesRef, { theme: "system", quickActions: ["add-money", "internal-transfer"] });

		batch.commit();
		processed++;
	}

	res.json({ processed });
});
