// types/qaTypes.ts

export interface PhotoPair {
  photo1: string | null;
  photo2: string | null;
}

export interface QAFormData {
  // Pre-filled fields (read-only)
  testPoint: string;
  lineItem: string;
  treatmentType: string;
  chainage: string;
  latitude?: string;
  longitude?: string;

  // User input fields
  testDate: string;
  lineItemCompleted: boolean;
  pavementThickness: string; // in mm
  crossfallOutbound: string; // in %
  crossfallOutboundPhotos: PhotoPair;
  crossfallInbound: string; // in %
  crossfallInboundPhotos: PhotoPair;
  roadWidthTotal: string; // in m
  comments: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export interface PhotoMetadata {
  location?: LocationData;
  timestamp: string;
}

// Validation types
export interface QAFormValidation {
  pavementThickness: boolean;
  crossfallOutbound: boolean;
  crossfallInbound: boolean;
  roadWidthTotal: boolean;
}

// Props for the PrefilledSection component
export interface PrefilledSectionProps {
  data: Pick<
    QAFormData,
    | "testPoint"
    | "lineItem"
    | "treatmentType"
    | "chainage"
    | "latitude"
    | "longitude"
  >;
}

// Props for the CrossfallSection component
export interface CrossfallSectionProps {
  type: "outbound" | "inbound";
  value: string;
  photos: PhotoPair;
  onValueChange: (value: string) => void;
  onPhotoCapture: (photoType: "photo1" | "photo2") => Promise<void>;
}
