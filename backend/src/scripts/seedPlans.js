import mongoose from 'mongoose';
import { env } from '../config/environment.js';
import { MembershipPlan } from '../models/MembershipPlan.js';
import { logger } from '../utils/logger.js';

const DEFAULT_PLANS = [
  {
    name: 'Monthly Pass',
    durationDays: 30,
    price: 6500,
    active: true,
    description: 'Full general gym & equipment access, standard floor trainer guidance.',
    features: ['General Gym Access', 'Floor Trainer Guidance', 'Locker Room'],
  },
  {
    name: 'Quarterly Transformation',
    durationDays: 90,
    price: 8500,
    active: true,
    description: 'Complete facility & free weights access, cardio & cross-training zones.',
    features: ['Facility & Free Weights', 'Cardio & Cross-Training', 'Body Composition Review'],
  },
  {
    name: 'Annual Beast Membership',
    durationDays: 365,
    price: 12000,
    active: true,
    description: '365 days of unrestricted training access, priority batch registration.',
    features: ['365 Days Unrestricted Access', 'Quarterly Metric Checks', 'Priority Workshops'],
  },
];

export async function seedPlans() {
  await mongoose.connect(env.mongoUri);
  logger.info('Connected to MongoDB for MembershipPlan seeding...');

  let plansToSeed = DEFAULT_PLANS;
  if (process.env.PLANS_SEED_JSON) {
    try {
      plansToSeed = JSON.parse(process.env.PLANS_SEED_JSON);
      logger.info('Using custom plans from PLANS_SEED_JSON environment variable.');
    } catch (e) {
      logger.error('Failed to parse PLANS_SEED_JSON. Falling back to default verified plans.');
    }
  }

  for (const plan of plansToSeed) {
    const existing = await MembershipPlan.findOne({ name: plan.name });
    if (!existing) {
      await MembershipPlan.create(plan);
      logger.info(`Created plan: ${plan.name} - ₹${plan.price} (${plan.durationDays} days)`);
    } else {
      logger.info(`Plan already exists: ${plan.name} - ₹${existing.price}`);
    }
  }

  await mongoose.disconnect();
}

if (process.argv[1]?.endsWith('seedPlans.js')) {
  seedPlans().catch((err) => {
    logger.error('Error seeding plans:', err);
    process.exit(1);
  });
}
