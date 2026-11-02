import { CityInfo } from '../types';

export const POPULAR_CITIES: CityInfo[] = [
  { 
    name: 'Hyderabad', 
    state: 'Telangana', 
    isPopular: true, 
    tier: 'metro',
    places: [
      'Kokapet',
      'Financial District',
      'Gachibowli',
      'Hitec City',
      'Madhapur',
      'Jubilee Hills',
      'Banjara Hills',
      'Kondapur',
      'Tellapur',
      'Mokila',
      'Shankarpally',
      'Nanakramguda',
      'Manikonda',
      'Miyapur',
      'Kompally',
      'Nallagandla',
      'Kukatpally',
      'Bachupally',
      'Shamshabad',
      'Shadnagar',
      'Uppal'
    ]
  },
  { 
    name: 'Bengaluru', 
    state: 'Karnataka', 
    isPopular: true, 
    tier: 'metro',
    places: [
      'Whitefield',
      'Indiranagar',
      'Koramangala',
      'HSR Layout',
      'Sarjapur Road',
      'Electronic City',
      'Bellandur',
      'Marathahalli',
      'Hebbal',
      'Yelahanka',
      'JP Nagar',
      'Jayanagar'
    ]
  },
  { 
    name: 'Mumbai', 
    state: 'Maharashtra', 
    isPopular: true, 
    tier: 'metro',
    places: [
      'Bandra West',
      'Andheri West',
      'Juhu',
      'Worli',
      'Powai',
      'Malad West',
      'Borivali West',
      'Dadar',
      'Thane West',
      'Navi Mumbai (Vashi)',
      'Kharghar',
      'Panvel'
    ]
  },
  { 
    name: 'Pune', 
    state: 'Maharashtra', 
    isPopular: true, 
    tier: 'metro',
    places: [
      'Hinjewadi',
      'Wakad',
      'Baner',
      'Kharadi',
      'Koregaon Park',
      'Viman Nagar',
      'Kothrud',
      'Magarpatta',
      'Hadapsar'
    ]
  },
  { 
    name: 'Delhi NCR', 
    state: 'Delhi NCR', 
    isPopular: true, 
    tier: 'metro',
    places: [
      'Gurgaon Golf Course Road',
      'Cyber City Gurgaon',
      'Sohna Road',
      'Noida Sector 62',
      'Noida Expressway',
      'Noida Sector 150',
      'South Delhi (GK / Vasant Kunj)',
      'Dwarka'
    ]
  },
  { 
    name: 'Chennai', 
    state: 'Tamil Nadu', 
    isPopular: true, 
    tier: 'metro',
    places: [
      'OMR (Old Mahabalipuram Rd)',
      'ECR (East Coast Road)',
      'Anna Nagar',
      'Adyar',
      'Velachery',
      'T. Nagar',
      'Porur'
    ]
  },
  { 
    name: 'Ahmedabad', 
    state: 'Gujarat', 
    isPopular: true, 
    tier: 'metro',
    places: [
      'SG Highway',
      'Bopal',
      'Prahlad Nagar',
      'Bodakdev',
      'Gift City',
      'Satellite'
    ]
  },
  { 
    name: 'Visakhapatnam', 
    state: 'Andhra Pradesh', 
    isPopular: true, 
    tier: 'metro',
    places: [
      'Madhurawada',
      'MVP Colony',
      'Rushikonda',
      'Gajuwaka',
      'Seethammadhara'
    ]
  },
  { 
    name: 'Vijayawada', 
    state: 'Andhra Pradesh', 
    isPopular: true, 
    tier: 'metro',
    places: [
      'Benz Circle',
      'Poranki',
      'Gunadala',
      'Gannavaram',
      'Auto Nagar'
    ]
  },
  { 
    name: 'Mysore', 
    state: 'Karnataka', 
    isPopular: true, 
    tier: 'tier2',
    places: [
      'Gokulam',
      'Vijayanagar',
      'Jayalakshmipuram',
      'Kuvempunagar'
    ]
  },
];

export const REGIONAL_CITIES: { [state: string]: string[] } = {
  'Telangana & Andhra Pradesh': [
    'Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam', 'Nalgonda', 'Siddipet', 'Mahbubnagar', 'Adilabad',
    'Visakhapatnam', 'Vijayawada', 'Guntur', 'Kakinada', 'Kurnool', 'Nellore', 'Rajahmundry', 'Tirupati', 'Anantapur', 'Eluru', 'Kadapa', 'Ongole'
  ],
  'Maharashtra': [
    'Mumbai', 'Pune', 'Thane', 'Navi Mumbai', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Jalgaon', 'Akola', 'Latur', 'Ahmednagar', 'Satara', 'Chandrapur', 'Nanded', 'Sangli'
  ],
  'Karnataka': [
    'Bengaluru', 'Mysore', 'Mangalore', 'Hubli-Dharwad', 'Belgaum', 'Davanagere', 'Bellary', 'Shimoga', 'Tumkur', 'Udupi', 'Hassan', 'Bidar', 'Gulbarga', 'Raichur'
  ],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Anand', 'Bharuch', 'Vapi', 'Valsad', 'Morbi', 'Mehsana', 'Gift City', 'Junagadh', 'Porbandar'
  ],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Vellore', 'Tirunelveli', 'Thanjavur', 'Hosur', 'Kanchipuram', 'Dindigul', 'Nagercoil'
  ],
  'Kerala': [
    'Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kannur', 'Kottayam', 'Malappuram', 'Kasaragod'
  ],
  'North & Central India': [
    'Delhi', 'Gurgaon', 'Noida', 'Faridabad', 'Ghaziabad', 'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur', 'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Raipur', 'Bilaspur', 'Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Dehradun', 'Haridwar'
  ],
  'East & North East': [
    'Kolkata', 'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bhubaneswar', 'Cuttack', 'Rourkela', 'Guwahati', 'Silchar', 'Dibrugarh', 'Agartala', 'Imphal', 'Shillong', 'Aizawl', 'Dimapur', 'Gangtok'
  ]
};
