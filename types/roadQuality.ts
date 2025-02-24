// types/roadQuality.ts

// Represents a road in our system
export interface Road {
  id: string;
  name: string;
  region?: string; // Optional: geographical region
  lastInspected?: string; // Optional: ISO date string of last inspection
}

// Represents location data from device
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

// Represents metadata associated with a photo
export interface PhotoMetadata {
  location?: LocationData;
  timestamp?: string;
}

// Represents the complete form data for a quality assessment
export interface QAFormData {
  roadName: string;
  photo: string | null;
  photoMetadata: PhotoMetadata | null;
  chainage: string;
  lhsCrossfall: string;
  rhsCrossfall: string;
  roadWidth: string;
}
