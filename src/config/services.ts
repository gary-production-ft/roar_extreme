import interiorFloorImg from '../assets/roar/gym-interior/interior-floor.jpg';
import strengthDumbbellsImg from '../assets/roar/strength-training/strength-dumbbells.jpg';
import benchPressImg from '../assets/roar/strength-training/bench-press-station.jpg';
import cardioTreadmillsImg from '../assets/roar/cardio/cardio-treadmills.jpg';
import zumbaDanceFloorImg from '../assets/roar/group-fitness/zumba-dance-floor.jpg';
import functionalRigImg from '../assets/roar/group-fitness/functional-rig.jpg';

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  category: string;
  description: string;
  image: string;
  source: string;
  scheduleNotice: string;
  width?: number;
  height?: number;
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
    source: 'Roar Extreme Interior Gym Floor',
    scheduleNotice: 'Daily open gym access during operating hours',
    width: 800,
    height: 600,
  },
  {
    id: 'strength-training',
    number: '02',
    title: 'STRENGTH TRAINING',
    category: 'Hypertrophy & Power',
    description:
      'Targeted free-weight progression utilizing calibrated dumbbells, squat platforms, and resistance gear for muscular hypertrophy.',
    image: strengthDumbbellsImg,
    source: 'Roar Extreme Dumbbell Rack & Free Weights',
    scheduleNotice: 'All-day free-weight platform availability',
    width: 675,
    height: 1200,
  },
  {
    id: 'bench-press',
    number: '03',
    title: 'OLYMPIC BARBELL & BENCH',
    category: 'Heavy Compound Lifts',
    description:
      'Commercial-grade flat and incline Olympic bench press stations equipped with heavy-duty safety catches and plate trees.',
    image: benchPressImg,
    source: 'Roar Extreme Bench Press Station',
    scheduleNotice: 'Open access during gym hours',
    width: 800,
    height: 450,
  },
  {
    id: 'cardio-fitness',
    number: '04',
    title: 'CARDIO FITNESS',
    category: 'Endurance & Stamina',
    description:
      'High-performance commercial treadmills and cardio telemetry equipment to maximize aerobic threshold and metabolic conditioning.',
    image: cardioTreadmillsImg,
    source: 'Roar Extreme Treadmill Deck',
    scheduleNotice: 'Open access during gym hours',
    width: 800,
    height: 1067,
  },
  {
    id: 'zumba',
    number: '05',
    title: 'ZUMBA',
    category: 'Group Dance Conditioning',
    description:
      'Energetic, rhythm-driven aerobic dance sessions designed to torch calories, improve coordination, and bring high-energy group motivation.',
    image: zumbaDanceFloorImg,
    source: 'Roar Extreme Studio Floor',
    scheduleNotice: 'Batch timings confirmed upon enrollment',
    width: 800,
    height: 1067,
  },
  {
    id: 'crossfit',
    number: '06',
    title: 'CROSSFIT & FUNCTIONAL',
    category: 'Functional High-Intensity',
    description:
      'Dynamic multi-joint functional movements combining pull-up stations, gymnastics rings, and rig intervals for conditioning.',
    image: functionalRigImg,
    source: 'Roar Extreme Functional Rig Zone',
    scheduleNotice: 'Scheduled group workout sessions',
    width: 800,
    height: 400,
  },
];
