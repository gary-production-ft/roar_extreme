import { z } from 'zod';
import {
  listAllDocuments,
  createKnowledgeDocument,
  updateKnowledgeDocument,
  deleteKnowledgeDocument,
} from '../services/knowledgeService.js';

export const documentSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    category: z.enum([
      'general',
      'services',
      'amenities',
      'location',
      'hours',
      'pricing',
      'free_session',
      'policy',
    ]),
    content: z.string().min(5),
    sourceUrl: z.string().optional(),
    verificationStatus: z.enum(['verified', 'unverified', 'pending']).default('verified'),
    isActive: z.boolean().default(true),
  }),
});

export async function getDocuments(req, res, next) {
  try {
    const docs = await listAllDocuments();
    res.json({
      success: true,
      documents: docs,
    });
  } catch (err) {
    next(err);
  }
}

export async function createDocument(req, res, next) {
  try {
    const adminName = req.admin ? req.admin.name : 'admin';
    const doc = await createKnowledgeDocument(req.validatedData.body, adminName);
    res.status(201).json({
      success: true,
      document: doc,
      message: 'Knowledge document created successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDocument(req, res, next) {
  try {
    const { id } = req.params;
    const adminName = req.admin ? req.admin.name : 'admin';
    const doc = await updateKnowledgeDocument(id, req.body, adminName);
    res.json({
      success: true,
      document: doc,
      message: 'Knowledge document updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    await deleteKnowledgeDocument(id);
    res.json({
      success: true,
      message: 'Knowledge document deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

