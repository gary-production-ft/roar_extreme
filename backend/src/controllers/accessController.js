import { z } from 'zod';
import { verifyAccess } from '../services/accessService.js';

export const verifyAccessSchema = z.object({
  body: z.object({
    descriptor: z.array(z.number()).min(64).max(512),
    livenessProof: z
      .object({
        passed: z.boolean(),
        challenge: z.string().optional(),
        confidence: z.number().optional(),
        delta: z.number().optional(),
      })
      .passthrough(),
    deviceId: z.string().optional(),
  }),
});

export async function handleVerifyAccess(req, res, next) {
  try {
    const { descriptor, livenessProof, deviceId } = req.validatedData.body;
    const result = await verifyAccess({
      descriptor,
      livenessProof,
      deviceId: deviceId || req.headers['x-device-id'] || 'kiosk-main',
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}
