export interface MembershipPlan {
  id: string;
  name: string;
  duration: string;
  priceStartingFrom: string;
  amount: number;
  currency: string;
  cadence: string;
  popular?: boolean;
  features: string[];
  source: string;
  verifiedByOwner: boolean;
}

export interface MembershipConfig {
  /**
   * Publication Flag:
   * Keep this `false` until the business owner explicitly confirms current package rates.
   * Toggle to `true` to immediately activate the membership pricing section in the UI.
   */
  isPublished: boolean;
  unverifiedDisclaimer: string;
  plans: MembershipPlan[];
}

export const membershipConfig: MembershipConfig = {
  isPublished: false, // Owner verification pending
  unverifiedDisclaimer:
    'Pricing shown is sourced from public directory archives (Magicpin) and is subject to official owner confirmation. Contact gym directly for active seasonal offers.',

  plans: [
    {
      id: 'gym-1-month',
      name: 'Monthly Pass',
      duration: '1 Month',
      priceStartingFrom: '₹6,500 onwards',
      amount: 6500,
      currency: 'INR',
      cadence: 'per month',
      popular: false,
      features: [
        'Full general gym & equipment access',
        'Standard floor trainer guidance',
        'Locker and changing room access',
        'Climate-controlled workout arena',
      ],
      source: 'Magicpin Catalogue Listing',
      verifiedByOwner: false,
    },
    {
      id: 'gym-3-months',
      name: 'Quarterly Transformation',
      duration: '3 Months',
      priceStartingFrom: '₹8,500 onwards',
      amount: 8500,
      currency: 'INR',
      cadence: 'for 3 months',
      popular: true,
      features: [
        'Complete facility & free weights access',
        'Cardio & functional cross-training zones',
        'Initial fitness & body composition review',
        'Complimentary single-session personal audit',
      ],
      source: 'Magicpin Catalogue Listing',
      verifiedByOwner: false,
    },
    {
      id: 'gym-1-year',
      name: 'Annual Beast Membership',
      duration: '1 Year',
      priceStartingFrom: '₹12,000 onwards',
      amount: 12000,
      currency: 'INR',
      cadence: 'for 12 months',
      popular: false,
      features: [
        '365 days of unrestricted training access',
        'Priority batch registration for group classes',
        'Quarterly body metric check-ins',
        'Maximum long-term value commitment',
      ],
      source: 'Magicpin Catalogue Listing',
      verifiedByOwner: false,
    },
  ],
};

