import interiorFloorImg from '../assets/roar/gym-interior/interior-floor.jpg';
import strengthDumbbellsImg from '../assets/roar/strength-training/strength-dumbbells.jpg';
import benchPressImg from '../assets/roar/strength-training/bench-press-station.jpg';
import cardioTreadmillsImg from '../assets/roar/cardio/cardio-treadmills.jpg';
import zumbaDanceFloorImg from '../assets/roar/group-fitness/zumba-dance-floor.jpg';
import functionalRigImg from '../assets/roar/group-fitness/functional-rig.jpg';
import combatKickboxingImg from '../assets/roar/kickboxing/combat-kickboxing.jpg';
import personalCoachStationImg from '../assets/roar/gallery/gallery-06.jpg';

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  category: string;
  description: string;
  image: string;
  source: string;
  scheduleNotice: string;
}

export const roarServices: ServiceItem[] = [
  {
    id: 'general-gym',
    number: '01',
    title: 'GENERAL GYM TRAINING',
    category: 'Foundational Fitness',
    description:
      'Comprehensive access to full-body resistance machinery, multi-stations, and guided conditioning spaces suited for lifters of all levels.',
    image: interiorFloorImg,
    source: 'Roar Fitness Interior Gym Floor',
    scheduleNotice: 'Daily open gym access during operating hours',
  },
  {
    id: 'weight-management',
    number: '02',
    title: 'WEIGHT MANAGEMENT',
    category: 'Body Transformation',
    description:
      'Structured calorie-burning workout regimens integrating cardiovascular intervals and metabolic circuits aimed at sustainable weight and body composition goals.',
    image: cardioTreadmillsImg,
    source: 'Roar Fitness Cardio Deck',
    scheduleNotice: 'Personalized programs available upon consultation',
  },
  {
    id: 'strength-training',
    number: '03',
    title: 'STRENGTH TRAINING',
    category: 'Hypertrophy & Power',
    description:
      'Targeted free-weight progression utilizing calibrated dumbbells, Olympic barbells, squat platforms, and bench presses for raw strength.',
    image: strengthDumbbellsImg,
    source: 'Roar Fitness Free Weights & Dumbbell Rack',
    scheduleNotice: 'All-day platform availability',
  },
  {
    id: 'cardio-fitness',
    number: '04',
    title: 'CARDIO FITNESS',
    category: 'Endurance & Stamina',
    description:
      'High-performance commercial treadmills, cross-trainers, and stationary bikes to boost cardiovascular threshold, lung capacity, and aerobic health.',
    image: benchPressImg,
    source: 'Roar Fitness Resistance & Conditioning Deck',
    scheduleNotice: 'Open access during gym hours',
  },
  {
    id: 'zumba',
    number: '05',
    title: 'ZUMBA',
    category: 'Group Dance Conditioning',
    description:
      'Energetic, rhythm-driven aerobic dance sessions designed to torch calories, improve coordination, and bring high-energy group motivation.',
    image: zumbaDanceFloorImg,
    source: 'Roar Fitness Aerobics & Zumba Studio Floor',
    scheduleNotice: 'Batch timings subject to gym schedule confirmation',
  },
  {
    id: 'crossfit',
    number: '06',
    title: 'CROSSFIT',
    category: 'Functional High-Intensity',
    description:
      'Dynamic multi-joint functional movements combining bodyweight pull-ups, kettlebells, box jumps, and functional rig intervals for conditioning.',
    image: functionalRigImg,
    source: 'Roar Fitness Functional Rig & Rig Stations',
    scheduleNotice: 'Scheduled group workout sessions',
  },
  {
    id: 'kickboxing',
    number: '07',
    title: 'KICKBOXING',
    category: 'Combat & Agility',
    description:
      'Striking, footwork, and heavy bag pad drills engineered to develop explosive hand-eye reflexes, core power, and functional self-defense endurance.',
    image: combatKickboxingImg,
    source: 'Roar Fitness Combat & Striking Zone',
    scheduleNotice: 'Trainer-assisted combat slots',
  },
  {
    id: 'personal-trainer',
    number: '08',
    title: 'PERSONAL TRAINER',
    category: '1-on-1 Dedicated Coaching',
    description:
      'Direct one-on-one mentorship covering movement screening, form auditing, progressive periodization, and continuous motivational accountability.',
    image: personalCoachStationImg,
    source: 'Roar Fitness 1-on-1 Coaching Area',
    scheduleNotice: 'By dedicated trainer appointment',
  },
];

