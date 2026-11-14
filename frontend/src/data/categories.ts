import { AgricultureCategory } from '../types';

export const AGRICULTURE_CATEGORIES: AgricultureCategory[] = [
  {
    id: 'crop',
    title: 'Crop Information',
    icon: '🌱',
    description: 'Crop suitability, sowing seasons, seed selection & rotation',
    color: 'from-emerald-500 to-green-600',
    questions: [
      'Which crops are best to grow in my soil type?',
      'What is the ideal sowing time and seed rate for wheat?',
      'How do I practice crop rotation to maintain soil health?',
      'What are high-yield and drought-tolerant tomato varieties?',
    ],
  },
  {
    id: 'soil',
    title: 'Soil Problems',
    icon: '🌾',
    description: 'Soil health, testing, pH balance & organic fertility',
    color: 'from-amber-600 to-yellow-700',
    questions: [
      'How can I improve soil fertility using natural compost?',
      'Which crops are suitable for black cotton soil?',
      'How do I test and correct high acidity or alkalinity in my soil?',
      'What are the best cover crops to prevent soil erosion?',
    ],
  },
  {
    id: 'water',
    title: 'Water and Irrigation',
    icon: '💧',
    description: 'Drip irrigation, water conservation & watering schedules',
    color: 'from-cyan-500 to-blue-600',
    questions: [
      'How does drip irrigation save water and increase yield?',
      'How often should I water my vegetables during summer?',
      'How do I prevent root rot caused by waterlogging?',
      'What are low-cost rainwater harvesting techniques for small farms?',
    ],
  },
  {
    id: 'fertilizer',
    title: 'Fertilizer Guidance',
    icon: '🌿',
    description: 'NPK ratios, organic manure, compost & nutrient deficiencies',
    color: 'from-lime-500 to-emerald-600',
    questions: [
      'How do I prepare organic vermicompost at home?',
      'What does N-P-K ratio mean and how much does my crop need?',
      'What are the signs of nitrogen and potassium deficiency in plants?',
      'What is the safest organic alternative to chemical urea?',
    ],
  },
  {
    id: 'pests',
    title: 'Plant and Pest Problems',
    icon: '🐛',
    description: 'Pest identification, disease cure & organic bio-pesticides',
    color: 'from-rose-500 to-red-600',
    questions: [
      'How do I prepare neem oil spray to control aphids and whiteflies?',
      'Why are my crop leaves turning yellow and curling?',
      'How can I protect my tomato plants from early blight fungus?',
      'What natural biological controls can reduce stem borers?',
    ],
  },
  {
    id: 'weather',
    title: 'Weather and Farming',
    icon: '🌦️',
    description: 'Monsoon readiness, heatwave defense & frost protection',
    color: 'from-sky-500 to-indigo-600',
    questions: [
      'How should I prepare my fields before heavy monsoon rains?',
      'How can I protect delicate vegetables from extreme summer heatwaves?',
      'What farming techniques help crops survive sudden frost and cold waves?',
      'How does mulching help retain soil moisture during dry spells?',
    ],
  },
];

export const SUGGESTED_PROMPTS = [
  'How can I improve soil fertility naturally?',
  'Which crops are best suited for black soil?',
  'Explain drip irrigation in simple steps.',
  'How can I identify common plant diseases early?',
  'What are sustainable farming practices for beginners?',
];
