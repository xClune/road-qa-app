// types/roadQuality.ts

export interface PhotoPair {
  photo1: string | null;
  photo2: string | null;
}

export interface QAFormData {
  // Pre-filled fields
  testPoint: string;
  lineItem: string;
  treatmentType: string;
  chainage: string;
  latitude?: string;
  longitude?: string;

  // User input fields
  testDate: string;
  lineItemCompleted: boolean;
  pavementThickness: string;
  crossfallOutbound: string;
  crossfallOutboundPhotos: PhotoPair;
  crossfallInbound: string;
  crossfallInboundPhotos: PhotoPair;
  roadWidthTotal: string;
  comments: string;
}

export interface PhotoMetadata {
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  };
  timestamp: string;
}
