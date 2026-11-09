import heroMainImg from '../assets/roar/hero/hero-main.jpg';
import roarBrandingSignageImg from '../assets/roar/branding/roar-branding-signage.jpg';
import interiorFloorImg from '../assets/roar/gym-interior/interior-floor.jpg';
import cableCrossoverImg from '../assets/roar/gym-interior/cable-crossover.jpg';
import strengthDumbbellsImg from '../assets/roar/strength-training/strength-dumbbells.jpg';
import benchPressImg from '../assets/roar/strength-training/bench-press-station.jpg';
import cardioTreadmillsImg from '../assets/roar/cardio/cardio-treadmills.jpg';
import functionalRigImg from '../assets/roar/group-fitness/functional-rig.jpg';
import zumbaDanceFloorImg from '../assets/roar/group-fitness/zumba-dance-floor.jpg';
import combatKickboxingImg from '../assets/roar/kickboxing/combat-kickboxing.jpg';
import facilityAirconImg from '../assets/roar/facilities/facility-aircon.jpg';
import lockersChangingImg from '../assets/roar/facilities/lockers-changing.jpg';

import gallery01Img from '../assets/roar/gallery/gallery-01.jpg';
import gallery02Img from '../assets/roar/gallery/gallery-02.jpg';
import gallery03Img from '../assets/roar/gallery/gallery-03.jpg';
import gallery04Img from '../assets/roar/gallery/gallery-04.jpg';
import gallery05Img from '../assets/roar/gallery/gallery-05.jpg';
import gallery06Img from '../assets/roar/gallery/gallery-06.jpg';

export interface GalleryPhoto {
  id: string;
  category:
    | 'hero'
    | 'branding'
    | 'gym-interior'
    | 'strength-training'
    | 'cardio'
    | 'group-fitness'
    | 'kickboxing'
    | 'facilities'
    | 'gallery';
  title: string;
  caption: string;
  image: string;
  verifiedSource: string;
}

export const roarGallery: GalleryPhoto[] = [
  {
    id: 'hero-main',
    category: 'hero',
    title: 'Roar Fitness Interior Arena',
    caption: 'Official equipment layout and conditioning space at Roar Extreme Nashik',
    image: heroMainImg,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'branding-signage',
    category: 'branding',
    title: 'Roar Extreme Wall Brand Signage',
    caption: 'Authentic gym wall art and brand identity inside the facility',
    image: roarBrandingSignageImg,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'interior-floor',
    category: 'gym-interior',
    title: 'Main Gym Floor',
    caption: 'Clean, open-plan training floor with heavy-duty rubberized impact flooring',
    image: interiorFloorImg,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'cable-crossover',
    category: 'gym-interior',
    title: 'Dual Cable Multi-Station',
    caption: 'High & low pulley cables for isolation, chest flyes, and triceps pressdowns',
    image: cableCrossoverImg,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'strength-dumbbells',
    category: 'strength-training',
    title: 'Free Weight Dumbbell Rack',
    caption: 'Graduated heavy dumbbells suited for progressive overload protocols',
    image: strengthDumbbellsImg,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'bench-press-station',
    category: 'strength-training',
    title: 'Olympic Flat & Incline Benches',
    caption: 'Commercial-grade bench press stations with bar catches and spotter decks',
    image: benchPressImg,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'cardio-treadmills',
    category: 'cardio',
    title: 'Cardiovascular Treadmill Line',
    caption: 'Commercial motorized treadmills with heart-rate telemetry and custom speed settings',
    image: cardioTreadmillsImg,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'functional-rig',
    category: 'group-fitness',
    title: 'CrossFit & Functional Rig System',
    caption: 'Multi-station calisthenics rig for pull-ups, ring dips, and TRX suspension training',
    image: functionalRigImg,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'zumba-dance-floor',
    category: 'group-fitness',
    title: 'Aerobic & Zumba Group Studio',
    caption: 'Dedicated mirrored studio for high-energy dance fitness and group workouts',
    image: zumbaDanceFloorImg,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'combat-kickboxing',
    category: 'kickboxing',
    title: 'Combat & Kickboxing Corner',
    caption: 'Padded floor area for martial arts agility and pad work',
    image: combatKickboxingImg,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'facility-aircon',
    category: 'facilities',
    title: 'Climate Controlled Interior',
    caption: 'Heavy-duty air conditioning keeping the atmosphere fresh during peak hours',
    image: facilityAirconImg,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'lockers-changing',
    category: 'facilities',
    title: 'Secure Lockers & Changing Area',
    caption: 'Individual lockers for member belongings during workouts',
    image: lockersChangingImg,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'gallery-01',
    category: 'gallery',
    title: 'Strength Station Racks',
    caption: 'Power cages and plate-loaded resistance equipment',
    image: gallery01Img,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'gallery-02',
    category: 'gallery',
    title: 'Selectorized Weight Stacks',
    caption: 'Pin-selected stack machines for safe and controlled isolation lifts',
    image: gallery02Img,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'gallery-03',
    category: 'gallery',
    title: 'Elliptical Trainers',
    caption: 'Low-impact cardiovascular trainers for joint-friendly aerobic conditioning',
    image: gallery03Img,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'gallery-04',
    category: 'gallery',
    title: 'Leg Press & Lower Body Zone',
    caption: 'Calibrated angle leg press and quad development equipment',
    image: gallery04Img,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'gallery-05',
    category: 'gallery',
    title: 'Barbell & Plate Rack Storage',
    caption: 'High-density weight plate storage with standardized Olympic hubs',
    image: gallery05Img,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
  {
    id: 'gallery-06',
    category: 'gallery',
    title: 'Personal Training Consultation Corner',
    caption: 'Dedicated coach area for movement screening and program review',
    image: gallery06Img,
    verifiedSource: 'Magicpin Verified Listing Gallery',
  },
];

