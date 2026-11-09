export interface BusinessConfig {
  name: string;
  brandIdentity: string;
  category: string;
  city: string;
  state: string;
  country: string;
  headline: string;
  tagline: string;
  heroDescription: string;
  aboutHeadline: string;
  aboutDescription: string;
  freeSessionHeadline: string;
  freeSessionDescription: string;

  address: {
    primary: string;
    building: string;
    landmark: string;
    area: string;
    city: string;
    state: string;
    postalCode?: string;
    fullFormatted: string;
    mapsEmbedQuery: string;
    googleMapsDirectionsUrl: string;
  };

  /**
   * Discrepancy Note:
   * Magicpin lists "Patil Colony, Canada Corner, College Road, Nashik".
   * The owner directly supplied "6th Floor Terrace, Rushiraj Regency, Vidya Vikas Circle, Gangapur Road, Nashik".
   * This is flagged for owner verification rather than silently overwritten.
   */
  addressDiscrepancy: {
    hasDiscrepancy: boolean;
    magicpinListedAddress: string;
    verifiedByOwner: boolean;
    note: string;
  };

  contact: {
    phone: string;
    phoneFormatted: string;
    isPhoneVerifiedByOwner: boolean;
    phonePendingNotice: string;
    email?: string;
  };

  operatingHours: {
    days: string;
    hours: string;
    sundayHours: string;
    source: string;
  };

  socialLinks: {
    facebook: string;
    magicpin: string;
    instagram?: string;
    youtube?: string;
  };

  features: {
    showMembershipPricing: boolean;
    showTestimonials: boolean;
  };
}

export const businessConfig: BusinessConfig = {
  name: 'ROAR FITNESS',
  brandIdentity: 'ROAR EXTREME',
  category: 'Fitness Studio & Athletic Conditioning Center',
  city: 'Nashik',
  state: 'Maharashtra',
  country: 'India',

  headline: 'UNLEASH YOUR INNER BEAST.',
  tagline: 'TRAIN HARD. LIVE STRONG. ROAR LOUD.',

  heroDescription:
    'Discover Roar Fitness Nashik. Build strength, improve performance and experience a dedicated fitness environment designed to push your limits.',

  aboutHeadline: 'BUILT FOR STRENGTH. DRIVEN BY DISCIPLINE.',
  aboutDescription:
    'Roar Fitness brings together gym training, strength development, cardio and fitness experiences in Nashik. Whether you are starting your fitness journey or looking to challenge yourself further, take your next step with Roar.',

  freeSessionHeadline: 'YOUR FIRST SESSION IS ON US.',
  freeSessionDescription:
    'Step inside Roar Fitness and experience the training environment for yourself. Apply for your complimentary single-session pass.',

  address: {
    primary: '601/602, 6th Floor Terrace, Rushiraj Regency',
    building: 'Rushiraj Regency (Above Axis Bank)',
    landmark: 'Vidya Vikas Circle, Above Axis Bank',
    area: 'Patil Colony, Canada Corner',
    city: 'Nashik',
    state: 'Maharashtra',
    postalCode: '422005',
    fullFormatted:
      '601/602 Rushiraj Regency, Vidya Vikas Circle, above Axis Bank, Patil Colony, Canada Corner, Nashik, Maharashtra 422005',
    mapsEmbedQuery: 'Roar+Fitness+Rushiraj+Regency+Vidya+Vikas+Circle+Nashik',
    googleMapsDirectionsUrl:
      'https://www.google.com/maps/dir//Roar+Fitness,+601%2F602+Rushiraj+Regency,+Vidya+Vikas+Cir,+above+Axis+Bank,+Patil+Colony,+Canada+Corner,+Nashik,+Maharashtra+422005/@19.9890244,73.7830858,24934m/data=!3m1!1e3!4m8!4m7!1m0!1m5!1m1!1s0x3bddeb99f3d80043:0xe11b269b99a6d07e!2m2!1d73.7656344!2d20.0094151',
  },

  addressDiscrepancy: {
    hasDiscrepancy: false,
    magicpinListedAddress: 'Patil Colony, Canada Corner, Nashik 422005',
    verifiedByOwner: true,
    note: 'Verified official location: 601/602 Rushiraj Regency, Vidya Vikas Circle, above Axis Bank, Patil Colony, Canada Corner, Nashik 422005.',
  },

  contact: {
    phone: '+91 93099 06640',
    phoneFormatted: '+91 93099 06640',
    isPhoneVerifiedByOwner: false, // Pending owner confirmation before active dialing
    phonePendingNotice:
      'Contact number sourced from public directory (Magicpin). Direct dialing pending final owner verification.',
  },

  operatingHours: {
    days: 'Monday – Saturday',
    hours: '6:00 AM – 10:00 PM',
    sundayHours: 'Dedicated recovery & maintenance (By appointment)',
    source: 'Business-supplied operational window',
  },

  socialLinks: {
    facebook: 'https://www.facebook.com/roarfitnessnsk/',
    magicpin: 'https://magicpin.in/Nashik/College-Road/Fitness/Roar-Fitness/store/23c022',
  },

  features: {
    showMembershipPricing: false, // Flag initially set to false until owner confirms rates
    showTestimonials: false, // Hidden until authentic verified customer reviews are supplied
  },
};

