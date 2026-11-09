import mongoose from 'mongoose';
import { env } from '../config/environment.js';
import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import { logger } from '../utils/logger.js';

const KNOWLEDGE_SEEDS = [
  {
    title: 'Roar Fitness Official Identity & Brand',
    category: 'general',
    content:
      'Roar Fitness (Roar Extreme) is Nashik premier athletic training studio and gym. Tagline: "TRAIN HARD. LIVE STRONG. ROAR LOUD." Slogan: "UNLEASH YOUR INNER BEAST."',
    sourceUrl: 'https://www.facebook.com/roarfitnessnsk/',
    verificationStatus: 'verified',
  },
  {
    title: 'Official Rooftop Location & Address',
    category: 'location',
    content:
      'Roar Fitness is located at 601/602 Rushiraj Regency, Vidya Vikas Circle, above Axis Bank, Patil Colony, Canada Corner, Nashik, Maharashtra 422005. Visitors take the elevator to the 5th floor and then use the dedicated staircase flight up to the rooftop terrace arena.',
    sourceUrl: 'Google Maps Verified Listing',
    verificationStatus: 'verified',
  },
  {
    title: 'Directory Address Discrepancy Note',
    category: 'location',
    content:
      'The address is verified via official Google Maps listing: 601/602 Rushiraj Regency, above Axis Bank, Patil Colony, Canada Corner, Nashik 422005.',
    sourceUrl: 'https://www.google.com/maps/dir//Roar+Fitness,+601%2F602+Rushiraj+Regency,+Vidya+Vikas+Cir,+above+Axis+Bank,+Patil+Colony,+Canada+Corner,+Nashik,+Maharashtra+422005',
    verificationStatus: 'verified',
  },
  {
    title: 'Official Operating Hours',
    category: 'hours',
    content:
      'Monday through Saturday: 6:00 AM to 10:00 PM continuously. Sunday: Dedicated physical recovery and maintenance (by appointment).',
    sourceUrl: 'Owner Supplied Information',
    verificationStatus: 'verified',
  },
  {
    title: 'Directory Phone Number',
    category: 'general',
    content:
      'Helpline phone number: +91 93099 06640 (sourced from public directory Magicpin). Contact buttons remain pending final owner confirmation; visitors are advised to apply online for free session passes.',
    sourceUrl: 'https://magicpin.in/Nashik/College-Road/Fitness/Roar-Fitness/store/23c022',
    verificationStatus: 'pending',
  },
  {
    title: 'Free Single Session Pass Offer',
    category: 'free_session',
    content:
      'First session is 100% free. Includes equipment and rooftop arena tour, 60-minute guided trial workout, body composition evaluation, and 1-on-1 coach consultation. Applying online generates an instant booking reference. A performance coach calls to confirm the exact time slot.',
    sourceUrl: 'Owner Business Information',
    verificationStatus: 'verified',
  },
  {
    title: 'What to Bring on Day 1',
    category: 'free_session',
    content:
      'Visitors must bring: (1) Clean change of athletic sports shoes (mandatory for platform and turf hygiene), (2) Personal workout towel, (3) Digital pass reference ID.',
    sourceUrl: 'Gym Protocol Rules',
    verificationStatus: 'verified',
  },
  {
    title: '01. General Gym Training',
    category: 'services',
    content:
      'Comprehensive access to full-body resistance machines, selectorized weight stacks, and guided floor spaces for lifters of all skill levels.',
    sourceUrl: 'Magicpin Verified Category',
    verificationStatus: 'verified',
  },
  {
    title: '02. Weight Management',
    category: 'services',
    content:
      'Calorie-burning workout protocols combining cardiovascular intervals, HIIT, and metabolic circuits for sustainable fat loss.',
    sourceUrl: 'Magicpin Verified Category',
    verificationStatus: 'verified',
  },
  {
    title: '03. Strength Training',
    category: 'services',
    content:
      'Heavy-duty progressive overload utilizing calibrated Olympic barbells, flat and incline benches, squat cages, and heavy dumbbell racks.',
    sourceUrl: 'Magicpin Verified Category',
    verificationStatus: 'verified',
  },
  {
    title: '04. Cardio Fitness',
    category: 'services',
    content:
      'Commercial motorized treadmills, elliptical cross-trainers, and endurance conditioning equipment.',
    sourceUrl: 'Magicpin Verified Category',
    verificationStatus: 'verified',
  },
  {
    title: '05. Zumba Group Fitness',
    category: 'services',
    content:
      'High-energy aerobic dance workouts set to music in the dedicated mirrored studio. Batch timings confirmed with gym staff.',
    sourceUrl: 'Magicpin Verified Category',
    verificationStatus: 'verified',
  },
  {
    title: '06. CrossFit Functional Training',
    category: 'services',
    content:
      'Dynamic multi-joint functional rig calisthenics, kettlebells, battle ropes, and high-intensity interval conditioning.',
    sourceUrl: 'Magicpin Verified Category',
    verificationStatus: 'verified',
  },
  {
    title: '07. Combat Kickboxing',
    category: 'services',
    content:
      'Striking, footwork, and heavy bag pad drills developing hand-eye reflexes, core power, and functional self-defense stamina.',
    sourceUrl: 'Magicpin Verified Category',
    verificationStatus: 'verified',
  },
  {
    title: '08. Personal Coaching',
    category: 'services',
    content:
      '1-on-1 direct coaching covering biomechanics, form auditing, progressive periodization plans, and continuous accountability.',
    sourceUrl: 'Magicpin Verified Category',
    verificationStatus: 'verified',
  },
  {
    title: 'Verified Amenities',
    category: 'amenities',
    content:
      'Air-conditioned interior facility, secure personal lockers, clean changing rooms, mobile device charging docks, flexible 6 AM - 10 PM timings, parking available, and elevator/wheelchair-accessible entrance.',
    sourceUrl: 'Magicpin Verified Amenities',
    verificationStatus: 'verified',
  },
  {
    title: 'Catalogue Membership Rates',
    category: 'pricing',
    content:
      'Directory catalogue listed rates: 1 Month: ₹6,500 onwards; 3 Months: ₹8,500 onwards; 1 Year: ₹12,000 onwards. Active seasonal promotional packages are confirmed in person by management.',
    sourceUrl: 'Magicpin Store Catalogue',
    verificationStatus: 'pending',
  },
];

async function seed() {
  await mongoose.connect(env.mongoUri);
  logger.info('Connected to MongoDB for knowledge seeding...');

  await KnowledgeDocument.deleteMany({});
  const inserted = await KnowledgeDocument.insertMany(KNOWLEDGE_SEEDS);

  logger.info(`Successfully seeded ${inserted.length} knowledge documents into MongoDB.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error('Failed to seed knowledge:', err);
  process.exit(1);
});

