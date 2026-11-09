import facilityAirconImg from '../assets/roar/facilities/facility-aircon.jpg';
import lockersChangingImg from '../assets/roar/facilities/lockers-changing.jpg';

export interface FacilityAmenity {
  id: string;
  title: string;
  description: string;
  iconName: string;
  source: string;
  image?: string;
}

export const roarFacilities: FacilityAmenity[] = [
  {
    id: 'air-conditioned',
    title: 'AIR-CONDITIONED FACILITY',
    description:
      'Fully climate-controlled indoor workout zones maintaining optimal temperature during intense lifting and high-heat seasons in Nashik.',
    iconName: 'Wind',
    source: 'Magicpin Verified Listing',
    image: facilityAirconImg,
  },
  {
    id: 'changing-rooms',
    title: 'CHANGING ROOMS',
    description:
      'Clean, private, and hygienic changing areas enabling seamless transitions between daily office routines and training sessions.',
    iconName: 'UserCheck',
    source: 'Magicpin Verified Listing',
    image: lockersChangingImg,
  },
  {
    id: 'locker-facility',
    title: 'LOCKER FACILITY',
    description:
      'Secure on-site storage lockers ensuring your personal belongings, gear bags, and valuables are safe while you train.',
    iconName: 'Lock',
    source: 'Magicpin Verified Listing',
    image: lockersChangingImg,
  },
  {
    id: 'mobile-charging',
    title: 'MOBILE CHARGING POINT',
    description:
      'Convenient power docks and device charging stations so your mobile phone and music gear stay powered throughout your workout.',
    iconName: 'BatteryCharging',
    source: 'Magicpin Verified Listing',
  },
  {
    id: 'flexible-timings',
    title: 'FLEXIBLE TIMINGS',
    description:
      'Continuous 6:00 AM to 10:00 PM operating window from Monday to Saturday, accommodating early-morning and late-night schedules.',
    iconName: 'Clock',
    source: 'Magicpin & Business Hours',
  },
  {
    id: 'wheelchair-accessible',
    title: 'WHEELCHAIR-ACCESSIBLE',
    description:
      'Dedicated elevator access to the 5th/6th floor terrace facility with accessible entry points for all visitors.',
    iconName: 'Accessibility',
    source: 'Magicpin Verified Listing',
  },
  {
    id: 'parking-available',
    title: 'PARKING AVAILABLE',
    description:
      'Dedicated parking space around Rushiraj Regency for two-wheelers and member vehicles.',
    iconName: 'Car',
    source: 'Magicpin Verified Listing',
  },
];

