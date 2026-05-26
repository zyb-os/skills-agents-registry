#!/usr/bin/env node
/**
 * seed.js — Seed the Firestore mcp_servers collection from catalog.json
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json node seed.js
 *
 * Or use Application Default Credentials (after `firebase login`):
 *   node seed.js
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp }       = require('firebase-admin/firestore');
const fs   = require('fs');
const path = require('path');

// ── Init ──────────────────────────────────────────────────────────────────────
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!getApps().length) {
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    initializeApp({ credential: cert(require(serviceAccountPath)) });
  } else {
    // Use Application Default Credentials (works after `firebase login --reauth`)
    initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'biome-registry' });
  }
}

const db = getFirestore();

// ── Load catalog ──────────────────────────────────────────────────────────────
const catalogPath = path.join(__dirname, '..', 'public', 'catalog.json');
const catalog     = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const servers     = catalog.servers || [];

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
  const now = Timestamp.now();
  const batch = db.batch();
  let count = 0;

  for (const server of servers) {
    const ref = db.collection('mcp_servers').doc(server.id);
    batch.set(ref, {
      ...server,
      created_at: now,
      updated_at: now,
    }, { merge: true });
    count++;
    console.log(`  ✓ Queued: ${server.id}`);
  }

  await batch.commit();
  console.log(`\nSeeded ${count} servers to Firestore.`);

  // Also write categories
  const categories = [...new Set(servers.map(s => s.category))];
  const catBatch   = db.batch();
  for (const cat of categories) {
    const ids = servers.filter(s => s.category === cat).map(s => s.id);
    catBatch.set(db.collection('categories').doc(cat), { ids, updated_at: now });
  }
  await catBatch.commit();
  console.log(`Seeded ${categories.length} categories: ${categories.join(', ')}`);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
