import { z } from 'zod';
import { MembershipPlan } from '../models/MembershipPlan.js';
import { logAdminAudit } from '../utils/auditLogger.js';

export const planSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    durationDays: z.number().int().positive(),
    price: z.number().min(0),
    active: z.boolean().default(true),
    description: z.string().optional(),
    features: z.array(z.string()).optional(),
  }),
});

export async function listPlans(req, res, next) {
  try {
    const plans = await MembershipPlan.find({ active: true }).sort({ durationDays: 1 });
    res.json({ success: true, plans });
  } catch (err) {
    next(err);
  }
}

export async function createPlan(req, res, next) {
  try {
    const plan = await MembershipPlan.create(req.validatedData.body);
    await logAdminAudit(req, 'PLAN_CREATED', `Plan:${plan._id}`, { name: plan.name, price: plan.price });
    res.status(201).json({ success: true, plan, message: 'Plan created successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updatePlan(req, res, next) {
  try {
    const { id } = req.params;
    const plan = await MembershipPlan.findByIdAndUpdate(id, req.body, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    await logAdminAudit(req, 'PLAN_UPDATED', `Plan:${plan._id}`, { name: plan.name });
    res.json({ success: true, plan, message: 'Plan updated successfully' });
  } catch (err) {
    next(err);
  }
}
