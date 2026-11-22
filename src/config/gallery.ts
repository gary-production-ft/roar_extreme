import heroMainImg from '../assets/roar/hero/hero-main.jpg';
import roarBrandingSignageImg from '../assets/roar/branding/roar-branding-signage.jpg';
import interiorFloorImg from '../assets/roar/gym-interior/interior-floor.jpg';
import cableCrossoverImg from '../assets/roar/gym-interior/cable-crossover.jpg';
import strengthDumbbellsImg from '../assets/roar/strength-training/strength-dumbbells.jpg';
import benchPressImg from '../assets/roar/strength-training/bench-press-station.jpg';
import cardioTreadmillsImg from '../assets/roar/cardio/cardio-treadmills.jpg';
import functionalRigImg from '../assets/roar/group-fitness/functional-rig.jpg';
import zumbaDanceFloorImg from '../assets/roar/group-fitness/zumba-dance-floor.jpg';
import facilityAirconImg from '../assets/roar/facilities/facility-aircon.jpg';
import lockersChangingImg from '../assets/roar/facilities/lockers-changing.jpg';

import gallery01Img from '../assets/roar/gallery/gallery-01.jpg';
import gallery02Img from '../assets/roar/gallery/gallery-02.jpg';
import gallery03Img from '../assets/roar/gallery/gallery-03.jpg';
import gallery04Img from '../assets/roar/gallery/gallery-04.jpg';
import gallery05Img from '../assets/roar/gallery/gallery-05.jpg';
import gallery06Img from '../assets/roar/gallery/gallery-06.jpg';

export type GalleryCategory =
  | 'gym-interior'
  | 'strength'
  | 'cardio'
  | 'group-fitness'
  | 'facilities';

export interface GalleryPhoto {
  id: string;
  category: GalleryCategory;
  title: string;
  caption: string;
  image: string;
  width?: number;
  height?: number;
}

export const roarGallery: GalleryPhoto[] = [
  {
    id: 'hero-main',
    category: 'gym-interior',
    title: 'Roar Extreme Arena Floor',
    caption: 'Comprehensive resistance training layout and free weight floor at Rushiraj Regency rooftop',
    image: heroMainImg,
    width: 1920,
    height: 1080,
  },
  {
    id: 'branding-signage',
    category: 'gym-interior',
    title: 'Roar Extreme Wall Brand Identity',
    caption: 'Official gym wall graphics and motivation signage inside the arena',
    image: roarBrandingSignageImg,
    width: 1200,
    height: 800,
  },
  {
    id: 'interior-floor',
    category: 'gym-interior',
    title: 'Main Gym Floor & Rubberized Turf',
    caption: 'Open-plan conditioning zone with heavy-duty rubberized impact flooring',
    image: interiorFloorImg,
    width: 1200,
    height: 800,
  },
  {
    id: 'cable-crossover',
    category: 'strength',
    title: 'Dual Cable Multi-Station Tower',
    caption: 'High and low pulley cable station for chest flyes, pullovers, and triceps pressdowns',
    image: cableCrossoverImg,
    width: 1200,
    height: 800,
  },
  {
    id: 'strength-dumbbells',
    category: 'strength',
    title: 'Free Weight Dumbbell Rack',
    caption: 'Graduated heavy dumbbells suited for progressive overload strength protocols',
    image: strengthDumbbellsImg,
    width: 1200,
    height: 800,
  },
  {
    id: 'bench-press-station',
    category: 'strength',
    title: 'Olympic Flat & Incline Benches',
    caption: 'Commercial-grade Olympic barbell stations with safety catches and spotter platforms',
    image: benchPressImg,
    width: 1200,
    height: 800,
  },
  {
    id: 'cardio-treadmills',
    category: 'cardio',
    title: 'Cardiovascular Treadmill Line',
    caption: 'Commercial motorized treadmills with shock-absorption decks and incline settings',
    image: cardioTreadmillsImg,
    width: 1200,
    height: 800,
  },
  {
    id: 'functional-rig',
    category: 'group-fitness',
    title: 'CrossFit & Functional Rig System',
    caption: 'Multi-station calisthenics rig for pull-ups, gymnastic dips, and suspension work',
    image: functionalRigImg,
    width: 1200,
    height: 800,
  },
  {
    id: 'zumba-dance-floor',
    category: 'group-fitness',
    title: 'Aerobic & Zumba Group Studio',
    caption: 'Dedicated mirrored studio for high-energy dance conditioning and group fitness classes',
    image: zumbaDanceFloorImg,
    width: 1200,
    height: 800,
  },
  {
    id: 'facility-aircon',
    category: 'facilities',
    title: 'Climate Controlled Interior',
    caption: 'Heavy-duty air conditioning ensuring clean airflow during peak summer lifting',
    image: facilityAirconImg,
    width: 1200,
    height: 800,
  },
  {
    id: 'lockers-changing',
    category: 'facilities',
    title: 'Secure Lockers & Changing Area',
    caption: 'Individual lockers for member belongings and private changing cubicles',
    image: lockersChangingImg,
    width: 1200,
    height: 800,
  },
  {
    id: 'gallery-01',
    category: 'strength',
    title: 'Strength Station Racks',
    caption: 'Power cages and plate-loaded resistance stations for compound lifts',
    image: gallery01Img,
    width: 1200,
    height: 800,
  },
  {
    id: 'gallery-02',
    category: 'strength',
    title: 'Selectorized Weight Stacks',
    caption: 'Pin-selected stack machines for safe and controlled isolation movements',
    image: gallery02Img,
    width: 1200,
    height: 800,
  },
  {
    id: 'gallery-03',
    category: 'cardio',
    title: 'Elliptical Trainers',
    caption: 'Low-impact cardiovascular cross-trainers for joint-friendly aerobic stamina',
    image: gallery03Img,
    width: 1200,
    height: 800,
  },
  {
    id: 'gallery-04',
    category: 'strength',
    title: 'Leg Press & Lower Body Zone',
    caption: '45-degree angled leg press platform and seated calf extension machines',
    image: gallery04Img,
    width: 1200,
    height: 800,
  },
  {
    id: 'gallery-05',
    category: 'strength',
    title: 'Barbell & Plate Rack Storage',
    caption: 'Standardized Olympic bumper plates and calibrated barbell storage tree',
    image: gallery05Img,
    width: 1200,
    height: 800,
  },
  {
    id: 'gallery-06',
    category: 'gym-interior',
    title: 'Personal Training Consultation Corner',
    caption: 'Dedicated assessment zone for body composition reviews and coach consultations',
    image: gallery06Img,
    width: 1200,
    height: 800,
  },
];
