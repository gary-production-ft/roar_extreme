import { z } from 'zod';
import { createLead, getLeads, updateLeadStatus, deleteLeadById, exportLeadsToCsv } from '../services/leadService.js';

export const leadValidationSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(80),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
    email: z.string().email().optional().or(z.literal('')),
    preferredTime: z.enum(['morning', 'afternoon', 'evening']),
    fitnessGoal: z.enum(['weight-loss', 'muscle-building', 'strength', 'general-fitness']),
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    source: z.string().optional(),
    idempotencyKey: z.string().optional(),
  }),
});

export async function submitLead(req, res, next) {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
    const result = await createLead(req.validatedData.body, ipAddress);

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      bookingReference: result.bookingReference,
      lead: result.lead,
      message: result.isDuplicate
        ? 'Application already on file. Our performance coach will contact you shortly.'
        : 'Application received. Our performance coach will contact you to confirm your slot.',
    });
  } catch (err) {
    next(err);
  }
}

export async function listLeads(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const { status, search, goal } = req.query;

    const result = await getLeads({ page, limit, status, search, goal });
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateLead(req, res, next) {
  try {
    const { id } = req.params;
    const { status, coachNotes } = req.body;

    const updated = await updateLeadStatus(id, { status, coachNotes });
    res.json({
      success: true,
      lead: updated,
      message: 'Lead updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteLead(req, res, next) {
  try {
    const { id } = req.params;
    await deleteLeadById(id);
    res.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function exportLeads(req, res, next) {
  try {
    const csv = await exportLeadsToCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="roar_leads_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

