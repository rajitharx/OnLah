// Response shape of GET /api/v1/bus-services/{serviceNo}. Copied from the backend DTOs.
export interface StopReference {
  busStopCode: string;
  description: string;
  roadName: string;
}

export interface HoursRange {
  first: string;
  last: string;
}

export interface OperatingHours {
  weekday: HoursRange | null;
  saturday: HoursRange | null;
  sunday: HoursRange | null;
}

// Minute ranges as LTA publishes them, for example "9-11". Null when LTA has no value.
export interface ServiceFrequency {
  amPeak: string | null;
  amOffPeak: string | null;
  pmPeak: string | null;
  pmOffPeak: string | null;
}

export interface ServiceDirection {
  direction: number;
  category: string;
  isLoop: boolean;
  loopDescription: string | null;
  origin: StopReference | null;
  destination: StopReference | null;
  stopCount: number;
  frequency: ServiceFrequency;
  hours: OperatingHours;
}

export interface BusServiceDetails {
  serviceNo: string;
  operators: string[];
  directions: ServiceDirection[];
}
