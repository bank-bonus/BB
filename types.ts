
export enum ShiftType {
  MORNING = 'MORNING', // Peak
  DAY = 'DAY',         // Normal
  EVENING = 'EVENING'  // Peak
}

export interface Car {
  id: string;
  name: string;
  type: 'ECONOMY' | 'COMFORT' | 'BUSINESS' | 'LUXURY';
  price: number; // Purchase price
  rentPrice: number; // Daily rent price
  fuelConsumption: number; // Energy per ride
  speed: number; // Affects ride duration
  image: string;
  color: string; // Hex for UI accents
  textColor: string; // Text color on top of car color
}

export interface RideOffer {
  id: string;
  distanceKm: number;
  price: number;
  basePrice: number; // For showing bonuses
  ratingReward: number;
  commission: number;
  passengerName: string;
  passengerStory: string; // AI Generated
  destination: string;
  isHighDemand: boolean; // Visual cue
}

export interface PlayerState {
  money: number;
  rating: number; // 0.0 to 5.0
  energy: number; // 0 to 100
  day: number;
  currentCarId: string;
  ownedCarIds: string[];
  isRenting: boolean;
  totalRides: number; // New: Tracks experience
}

export interface GameLog {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export type PriorityLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

// Global window extension for Yandex SDK
declare global {
  interface Window {
    YaGames: any;
    ysdk: any;
  }
}
