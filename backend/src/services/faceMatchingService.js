import { FaceTemplate } from '../models/FaceTemplate.js';
import { decryptDescriptor, euclideanDistance } from '../utils/faceCrypto.js';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

/**
 * Perform 1:N Euclidean distance face matching across all enrolled member templates.
 * Enforces faceMatchThreshold and ambiguous match rejection.
 *
 * @param {Array<number>} queryDescriptor 128-dimensional float descriptor from kiosk
 * @returns {Promise<{
 *   matched: boolean,
 *   member?: Object,
 *   distance?: number,
 *   reason?: 'no_face_match' | 'low_confidence' | 'ambiguous_match'
 * }>}
 */
export async function matchFaceDescriptor(queryDescriptor) {
  if (!Array.isArray(queryDescriptor) || queryDescriptor.length < 64) {
    return {
      matched: false,
      reason: 'no_face_match',
    };
  }

  // Retrieve all enrolled biometric templates
  const templates = await FaceTemplate.find().populate('memberId');
  if (!templates || templates.length === 0) {
    return {
      matched: false,
      reason: 'no_face_match',
    };
  }

  const threshold = env.faceMatchThreshold || 0.48;
  const ambiguityMargin = env.ambiguityMargin || 0.08;

  const candidateMatches = [];

  for (const tpl of templates) {
    if (!tpl.memberId) continue;

    let minDistanceForMember = Infinity;

    for (const encDesc of tpl.encryptedDescriptors) {
      try {
        const enrolledDesc = decryptDescriptor(encDesc);
        const dist = euclideanDistance(queryDescriptor, enrolledDesc);
        if (dist < minDistanceForMember) {
          minDistanceForMember = dist;
        }
      } catch (err) {
        logger.error(`Error decrypting descriptor for template ${tpl._id}: ${err.message}`);
      }
    }

    if (minDistanceForMember < Infinity) {
      candidateMatches.push({
        member: tpl.memberId,
        templateId: tpl._id,
        distance: minDistanceForMember,
      });
    }
  }

  if (candidateMatches.length === 0) {
    return { matched: false, reason: 'no_face_match' };
  }

  // Sort ascending by distance (closest first)
  candidateMatches.sort((a, b) => a.distance - b.distance);

  const best = candidateMatches[0];

  // Check threshold
  if (best.distance > threshold) {
    return {
      matched: false,
      reason: 'no_face_match',
      distance: Number(best.distance.toFixed(4)),
    };
  }

  // Ambiguity / Low-confidence check against 2nd candidate from a different member
  if (candidateMatches.length > 1) {
    const second = candidateMatches[1];
    const isDifferentMember = String(best.member._id) !== String(second.member._id);
    const difference = second.distance - best.distance;

    if (isDifferentMember && difference < ambiguityMargin) {
      return {
        matched: false,
        reason: 'low_confidence',
        distance: Number(best.distance.toFixed(4)),
      };
    }
  }

  return {
    matched: true,
    member: best.member,
    distance: Number(best.distance.toFixed(4)),
  };
}
