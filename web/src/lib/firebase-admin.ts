import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "rpg-study-4c228",
  });
}

export const adminAuth = admin.auth();
