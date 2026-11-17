import mongoose from 'mongoose';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { Exercise } from '../models/Exercise.js';
import { FoodItem } from '../models/FoodItem.js';
import { VERIFIED_EXERCISES, VERIFIED_FOODS } from '../data/gymSeedData.js';

export async function seedFitnessKnowledge() {
  const isDirect = mongoose.connection.readyState === 0;
  if (isDirect) {
    await mongoose.connect(env.mongoUri);
    logger.info('Connected to MongoDB for Fitness Knowledge seeding...');
  }

  // Seed Exercises
  let exerciseCount = 0;
  for (const ex of VERIFIED_EXERCISES) {
    await Exercise.findOneAndUpdate(
      { exerciseId: ex.exerciseId },
      { $set: ex },
      { upsert: true, new: true }
    );
    exerciseCount++;
  }
  logger.info(`Seeded ${exerciseCount} verified exercises into ExerciseLibrary.`);

  // Seed Foods
  let foodCount = 0;
  for (const food of VERIFIED_FOODS) {
    await FoodItem.findOneAndUpdate(
      { foodId: food.foodId },
      { $set: food },
      { upsert: true, new: true }
    );
    foodCount++;
  }
  logger.info(`Seeded ${foodCount} verified foods into FoodDatabase with IFCT 2017 nutrients.`);

  if (isDirect) {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB.');
  }
}

if (process.argv[1]?.endsWith('seedFitnessData.js')) {
  seedFitnessKnowledge().catch((err) => {
    logger.error('Error seeding fitness data:', err);
    process.exit(1);
  });
}
