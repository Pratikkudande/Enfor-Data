export const statusConfig: Record<string, { label: string; badge: string; bar: string }> = {
  upcoming:           { label: 'Upcoming',           badge: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-400' },
  launched:           { label: 'Launched',           badge: 'bg-blue-100 text-blue-700',    bar: 'bg-blue-500'   },
  under_construction: { label: 'Under Construction', badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-400' },
  ready:              { label: 'Ready',              badge: 'bg-green-100 text-green-700',  bar: 'bg-green-500'  },
  sold_out:           { label: 'Sold Out',           badge: 'bg-gray-100 text-gray-600',    bar: 'bg-gray-400'   },
};

export const typeConfig: Record<string, { label: string; badge: string }> = {
  residential: { label: 'Residential', badge: 'bg-purple-100 text-purple-700' },
  commercial:  { label: 'Commercial',  badge: 'bg-teal-100 text-teal-700'     },
  mixed:       { label: 'Mixed',       badge: 'bg-indigo-100 text-indigo-700' },
};

export const formatPrice = (value: number): string => {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  if (value >= 100_000)    return `₹${(value / 100_000).toFixed(2)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
};

export const projectAmenities = [
  'Swimming Pool', 'Gym', 'Clubhouse', 'Children Play Area', 'Jogging Track',
  'Garden / Landscaping', 'Security / CCTV', 'Power Backup', 'Lift / Elevator',
  'Parking', 'Intercom', 'Rainwater Harvesting', 'Solar Panels', 'EV Charging',
  'Amphitheatre', 'Indoor Games', 'Yoga / Meditation Area', 'Multipurpose Hall',
  'Concierge', 'Visitor Parking',
];
