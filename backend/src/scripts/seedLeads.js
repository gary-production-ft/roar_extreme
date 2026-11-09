import mongoose from 'mongoose';
import { Lead } from '../models/Lead.js';
import { env } from '../config/environment.js';

const SAMPLE_LEADS = [
  {
    fullName: 'Rahul Deshmukh',
    phone: '9822014589',
    email: 'rahul.deshmukh@gmail.com',
    preferredTime: 'morning',
    fitnessGoal: 'strength',
    experienceLevel: 'intermediate',
    bookingReference: 'ROAR-RD01-NK26',
    status: 'Completed',
    coachNotes: 'Attended 60-min rooftop trial on Sunday. Interested in 6-month Strength membership.',
    source: 'web_form',
    daysAgo: 1,
  },
  {
    fullName: 'Pooja Kulkarni',
    phone: '9860123456',
    email: 'pooja.k@outlook.com',
    preferredTime: 'evening',
    fitnessGoal: 'weight-loss',
    experienceLevel: 'beginner',
    bookingReference: 'ROAR-PK02-NK26',
    status: 'Scheduled',
    coachNotes: 'Confirmed for Tuesday 6:30 PM slot. Wants guidance on HIIT and Zumba.',
    source: 'chat_recommendation',
    daysAgo: 2,
  },
  {
    fullName: 'Aditya Shinde',
    phone: '9423187654',
    email: 'aditya.shinde@yahoo.com',
    preferredTime: 'morning',
    fitnessGoal: 'muscle-building',
    experienceLevel: 'advanced',
    bookingReference: 'ROAR-AS03-NK26',
    status: 'Contacted',
    coachNotes: 'Called on Monday. Lifting background, wants to tour heavy barbell platforms.',
    source: 'web_form',
    daysAgo: 3,
  },
  {
    fullName: 'Snehal Patil',
    phone: '9890456123',
    email: 'snehal.patil@gmail.com',
    preferredTime: 'evening',
    fitnessGoal: 'general-fitness',
    experienceLevel: 'beginner',
    bookingReference: 'ROAR-SP04-NK26',
    status: 'New',
    coachNotes: 'Gangapur Road resident. Walk-in trial inquiry.',
    source: 'web_form',
    daysAgo: 4,
  },
  {
    fullName: 'Vikas Jadhav',
    phone: '9765123987',
    email: 'vikas.jadhav@rediffmail.com',
    preferredTime: 'afternoon',
    fitnessGoal: 'strength',
    experienceLevel: 'intermediate',
    bookingReference: 'ROAR-VJ05-NK26',
    status: 'Completed',
    coachNotes: 'Enrolled in 3-month powerlifting batch after trial.',
    source: 'walk_in',
    daysAgo: 5,
  },
  {
    fullName: 'Tanvi Joshi',
    phone: '9823987456',
    email: 'tanvi.joshi@gmail.com',
    preferredTime: 'morning',
    fitnessGoal: 'weight-loss',
    experienceLevel: 'beginner',
    bookingReference: 'ROAR-TJ06-NK26',
    status: 'Completed',
    coachNotes: 'Joined morning Zumba and functional training group.',
    source: 'chat_recommendation',
    daysAgo: 6,
  },
  {
    fullName: 'Siddharth More',
    phone: '9545678123',
    email: 'sid.more@gmail.com',
    preferredTime: 'evening',
    fitnessGoal: 'muscle-building',
    experienceLevel: 'intermediate',
    bookingReference: 'ROAR-SM07-NK26',
    status: 'Contacted',
    coachNotes: 'Follow-up call scheduled for Wednesday.',
    source: 'web_form',
    daysAgo: 7,
  },
  {
    fullName: 'Ananya Bhalerao',
    phone: '9822334455',
    email: 'ananya.b@gmail.com',
    preferredTime: 'evening',
    fitnessGoal: 'general-fitness',
    experienceLevel: 'beginner',
    bookingReference: 'ROAR-AB08-NK26',
    status: 'Scheduled',
    coachNotes: 'College Road student. Bringing college partner for session.',
    source: 'web_form',
    daysAgo: 8,
  },
  {
    fullName: 'Kunal Sonawane',
    phone: '9730112233',
    email: 'kunal.sonawane@gmail.com',
    preferredTime: 'morning',
    fitnessGoal: 'strength',
    experienceLevel: 'advanced',
    bookingReference: 'ROAR-KS09-NK26',
    status: 'Completed',
    coachNotes: 'CrossFit enthusiast. Enrolled in open-floor membership.',
    source: 'walk_in',
    daysAgo: 10,
  },
];

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log('Connected to MongoDB. Seeding realistic Nashik leads...');

  for (const item of SAMPLE_LEADS) {
    const existing = await Lead.findOne({ bookingReference: item.bookingReference });
    if (!existing) {
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - item.daysAgo);
      createdAt.setHours(9 + (item.daysAgo % 8), 15 * (item.daysAgo % 4));

      await Lead.create({
        fullName: item.fullName,
        phone: item.phone,
        email: item.email,
        preferredTime: item.preferredTime,
        fitnessGoal: item.fitnessGoal,
        experienceLevel: item.experienceLevel,
        bookingReference: item.bookingReference,
        status: item.status,
        coachNotes: item.coachNotes,
        source: item.source,
        createdAt,
      });
      console.log(`Created lead: ${item.fullName} (${item.bookingReference})`);
    }
  }

  const total = await Lead.countDocuments();
  console.log(`Total leads in DB now: ${total}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

