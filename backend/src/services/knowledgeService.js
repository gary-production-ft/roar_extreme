import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import { faqCache } from './faqCache.js';
import { logger } from '../utils/logger.js';

let cachedApprovedDocs = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 300000; // 5 minutes cache

export async function warmKnowledgeCache() {
  try {
    const docs = await KnowledgeDocument.find({
      verificationStatus: 'verified',
      isActive: true,
    }).sort({ category: 1, title: 1 }).lean();

    cachedApprovedDocs = docs;
    lastCacheTime = Date.now();
    logger.info(`[KNOWLEDGE] Pre-warmed ${docs.length} verified knowledge documents in memory.`);
    return docs;
  } catch (err) {
    logger.error('[KNOWLEDGE] Failed to warm knowledge cache:', err);
    return [];
  }
}

export function invalidateKnowledgeCache() {
  cachedApprovedDocs = null;
  lastCacheTime = 0;
  faqCache.clear();
  logger.info('[KNOWLEDGE] Knowledge and FAQ caches invalidated.');
}

export async function getApprovedKnowledge(category = null) {
  if (!cachedApprovedDocs || Date.now() - lastCacheTime > CACHE_TTL_MS) {
    await warmKnowledgeCache();
  }

  const docs = cachedApprovedDocs || [];
  if (category) {
    return docs.filter((d) => d.category === category);
  }
  return docs;
}

export async function searchRelevantKnowledge(queryText) {
  if (!cachedApprovedDocs || Date.now() - lastCacheTime > CACHE_TTL_MS) {
    await warmKnowledgeCache();
  }

  const allDocs = cachedApprovedDocs || [];
  const tokens = (queryText || '')
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (tokens.length === 0) {
    return allDocs.slice(0, 8);
  }

  // Fast in-memory token scoring
  const scored = allDocs.map((doc) => {
    const text = `${doc.title} ${doc.content} ${doc.category}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (text.includes(token)) score += 1;
    }
    return { doc, score };
  });

  const matching = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.doc);

  return matching.length > 0 ? matching.slice(0, 8) : allDocs.slice(0, 6);
}

export async function listAllDocuments() {
  return KnowledgeDocument.find().sort({ category: 1, updatedAt: -1 });
}

export async function createKnowledgeDocument(data, adminName = 'admin') {
  const doc = new KnowledgeDocument({
    ...data,
    updatedBy: adminName,
    lastVerifiedAt: data.verificationStatus === 'verified' ? new Date() : undefined,
  });
  const saved = await doc.save();
  invalidateKnowledgeCache();
  return saved;
}

export async function updateKnowledgeDocument(id, updates, adminName = 'admin') {
  const doc = await KnowledgeDocument.findById(id);
  if (!doc) throw new Error('Knowledge document not found');

  Object.assign(doc, updates, { updatedBy: adminName });
  if (updates.verificationStatus === 'verified') {
    doc.lastVerifiedAt = new Date();
  }

  const saved = await doc.save();
  invalidateKnowledgeCache();
  return saved;
}

export async function deleteKnowledgeDocument(id) {
  const deleted = await KnowledgeDocument.findByIdAndDelete(id);
  invalidateKnowledgeCache();
  return deleted;
}

