
import { Car, ShiftType, PriorityLevel } from './types';

export const INITIAL_STATE = {
  money: 500,
  rating: 5.0,
  energy: 100,
  day: 1,
  currentCarId: 'car_1',
  ownedCarIds: [],
  isRenting: true,
  totalRides: 0,
};

export const PRIORITY_THRESHOLDS = {
  BRONZE: { rides: 0, label: 'Бронза', multiplier: 1.0, color: 'bg-orange-700' },
  SILVER: { rides: 10, label: 'Серебро', multiplier: 1.1, color: 'bg-slate-400' },
  GOLD: { rides: 30, label: 'Золото', multiplier: 1.25, color: 'bg-yellow-500' },
  PLATINUM: { rides: 60, label: 'Платина', multiplier: 1.5, color: 'bg-cyan-600' }
};

export const getPriorityLevel = (rides: number): { level: PriorityLevel, config: typeof PRIORITY_THRESHOLDS.BRONZE } => {
  if (rides >= PRIORITY_THRESHOLDS.PLATINUM.rides) return { level: 'PLATINUM', config: PRIORITY_THRESHOLDS.PLATINUM };
  if (rides >= PRIORITY_THRESHOLDS.GOLD.rides) return { level: 'GOLD', config: PRIORITY_THRESHOLDS.GOLD };
  if (rides >= PRIORITY_THRESHOLDS.SILVER.rides) return { level: 'SILVER', config: PRIORITY_THRESHOLDS.SILVER };
  return { level: 'BRONZE', config: PRIORITY_THRESHOLDS.BRONZE };
};

export const getNextPriorityTarget = (rides: number): number | null => {
  if (rides < PRIORITY_THRESHOLDS.SILVER.rides) return PRIORITY_THRESHOLDS.SILVER.rides;
  if (rides < PRIORITY_THRESHOLDS.GOLD.rides) return PRIORITY_THRESHOLDS.GOLD.rides;
  if (rides < PRIORITY_THRESHOLDS.PLATINUM.rides) return PRIORITY_THRESHOLDS.PLATINUM.rides;
  return null; // Max level reached
};

// Заглушки под PNG картинки. 
// Вам нужно создать папку public/assets/cars/ и положить туда файлы.
export const CARS: Car[] = [
  {
    id: 'car_1',
    name: 'Старая Лада',
    type: 'ECONOMY',
    price: 0, 
    rentPrice: 50,
    fuelConsumption: 15,
    speed: 1,
    image: './assets/cars/lada.png', // Заглушка
    color: '#FDE047', // Yellow-400
    textColor: '#000000'
  },
  {
    id: 'car_2',
    name: 'Народный Солярис',
    type: 'ECONOMY',
    price: 5000,
    rentPrice: 150,
    fuelConsumption: 10,
    speed: 1.2,
    image: './assets/cars/solaris.png', // Заглушка
    color: '#FACC15', // Yellow-500
    textColor: '#000000'
  },
  {
    id: 'car_3',
    name: 'Комфорт Камри',
    type: 'COMFORT',
    price: 15000,
    rentPrice: 350,
    fuelConsumption: 8,
    speed: 1.5,
    image: './assets/cars/camry.png', // Заглушка
    color: '#ffffff',
    textColor: '#000000'
  },
  {
    id: 'car_tesla',
    name: 'Электро Тесла',
    type: 'COMFORT',
    price: 25000,
    rentPrice: 450,
    fuelConsumption: 5, // Efficient
    speed: 1.8,
    image: './assets/cars/tesla.png', // Заглушка
    color: '#ef4444', // Red
    textColor: '#ffffff'
  },
  {
    id: 'car_van',
    name: 'Минивэн V-Class',
    type: 'BUSINESS',
    price: 35000,
    rentPrice: 600,
    fuelConsumption: 14,
    speed: 1.4,
    image: './assets/cars/vclass.png', // Заглушка
    color: '#1e293b', // Slate-800
    textColor: '#ffffff'
  },
  {
    id: 'car_4',
    name: 'Люкс Майбах',
    type: 'BUSINESS',
    price: 65000,
    rentPrice: 0, 
    fuelConsumption: 12,
    speed: 2.0,
    image: './assets/cars/maybach.png', // Заглушка
    color: '#000000', // Black
    textColor: '#FFD700' // Gold text
  },
  {
    id: 'car_rolls',
    name: 'Роллс Фантом',
    type: 'LUXURY',
    price: 150000,
    rentPrice: 0,
    fuelConsumption: 20,
    speed: 1.8,
    image: './assets/cars/rolls.png', // Заглушка
    color: '#1a1a1a', // Rich Black
    textColor: '#e5e7eb'
  }
];

export const SHIFT_CONFIG = {
  [ShiftType.MORNING]: {
    label: 'Утро (07:00 - 10:00)',
    multiplier: 1.8,
    commission: 0.30, // 30% commission
    traffic: 'Пробки',
    desc: 'Час пик! Высокий спрос, но большая комиссия.'
  },
  [ShiftType.DAY]: {
    label: 'День (10:00 - 16:00)',
    multiplier: 1.0,
    commission: 0.15, // 15% commission
    traffic: 'Свободно',
    desc: 'Спокойная работа, низкая комиссия.'
  },
  [ShiftType.EVENING]: {
    label: 'Вечер (16:00 - 20:00)',
    multiplier: 2.0,
    commission: 0.35, // 35% commission
    traffic: 'Пробки',
    desc: 'Максимальные цены, но и комиссия кусается.'
  }
};

export const FOOD_COST = 150;
export const FOOD_ENERGY = 60;
