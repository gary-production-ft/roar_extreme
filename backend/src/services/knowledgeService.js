import { KnowledgeDocument } from '../models/KnowledgeDocument.js';

export async function getApprovedKnowledge(category = null) {
  const query = {
    verificationStatus: 'verified',
    isActive: true,
  };
  if (category) query.category = category;

  return KnowledgeDocument.find(query).sort({ category: 1, title: 1 });
}

export async function searchRelevantKnowledge(queryText) {
  // Simple token/regex relevance search over title and content
  const tokens = queryText
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (tokens.length === 0) {
    return getApprovedKnowledge();
  }

  const regexes = tokens.map((t) => new RegExp(t, 'i'));

  const docs = await KnowledgeDocument.find({
    verificationStatus: 'verified',
    isActive: true,
    $or: [
      { title: { $in: regexes } },
      { content: { $in: regexes } },
      { category: { $in: regexes } },
    ],
  }).limit(8);

  return docs;
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
  return doc.save();
}

export async function updateKnowledgeDocument(id, updates, adminName = 'admin') {
  const doc = await KnowledgeDocument.findById(id);
  if (!doc) throw new Error('Knowledge document not found');

  Object.assign(doc, updates, { updatedBy: adminName });
  if (updates.verificationStatus === 'verified') {
    doc.lastVerifiedAt = new Date();
  }

  return doc.save();
}

export async function deleteKnowledgeDocument(id) {
  return KnowledgeDocument.findByIdAndDelete(id);
}

