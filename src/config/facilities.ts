import facilityAirconImg from '../assets/roar/facilities/facility-aircon.jpg';
import lockersChangingImg from '../assets/roar/facilities/lockers-changing.jpg';

export interface FacilityAmenity {
  id: string;
  title: string;
  description: string;
  iconName: string;
  source: string;
  image?: string;
  width?: number;
  height?: number;
}

// D14: Deduplicated — CHANGING ROOMS and LOCKER FACILITY merged into one entry.
// All amenities sourced from a single array; no duplicated icons or photo banners.
export const roarFacilities: FacilityAmenity[] = [
  {
    id: 'air-conditioned',
    title: 'AIR-CONDITIONED FACILITY',
    description:
      'Fully climate-controlled indoor workout zones maintaining optimal temperature during intense lifting and high-heat seasons in Nashik.',
    iconName: 'Wind',
    source: 'Verified Facility Standard',
    image: facilityAirconImg,
    width: 800,
    height: 800,
  },
  {
    id: 'lockers-changing-rooms',
    title: 'LOCKERS & CHANGING ROOMS',
    description:
      'Secure personal day lockers and clean, private changing areas enabling seamless transitions between daily routines and training sessions.',
    iconName: 'Lock',
    source: 'Verified Facility Standard',
    image: lockersChangingImg,
    width: 800,
    height: 450,
  },
  {
    id: 'mobile-charging',
    title: 'MOBILE CHARGING POINT',
    description:
      'Convenient power docks and device charging stations so your mobile phone and music gear stay powered throughout your workout.',
    iconName: 'BatteryCharging',
    source: 'Verified Facility Standard',
  },
  {
    id: 'flexible-timings',
    title: 'FLEXIBLE TIMINGS',
    description:
      'Continuous 6:00 AM to 10:00 PM operating window from Monday to Saturday, accommodating early-morning and late-night schedules.',
    iconName: 'Clock',
    source: 'Verified Facility Standard',
  },
  {
    id: 'wheelchair-accessible',
    title: 'WHEELCHAIR-ACCESSIBLE',
    description:
      'Dedicated elevator access to the rooftop facility with accessible entry points for all visitors.',
    iconName: 'Accessibility',
    source: 'Verified Facility Standard',
  },
  {
    id: 'parking-available',
    title: 'PARKING AVAILABLE',
    description:
      'Dedicated parking space around Rushiraj Regency for two-wheelers and member vehicles.',
    iconName: 'Car',
    source: 'Verified Facility Standard',
  },
];
