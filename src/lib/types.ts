
export type ScoreCriteria = {
  theme_match: number;       // Kesesuaian dengan tema
  layout: number;            // Tata letak
  typography_color: number;  // Tipografi dan warna
  content_clarity: number;   // Kejelasan isi/konten
};

export type JudgeScore = {
  judgeName: string;
  criteria: ScoreCriteria;
  totalScore: number;
};

export type Comment = {
  id: string;
  artworkId?: string; // Optional: To know which artwork it belongs to in a flat list
  artworkTitle?: string; // Optional: For display in admin panel
  text: string;
  createdAt: Date;
  parentId: string | null;
  replies: Comment[];
  isPendingModeration: boolean;
  moderationReason: string | null;
}

export type Artwork = {
  id: string; // Will be ObjectId string from MongoDB
  name: string;
  class: string;
  title: string;
  description:string;
  imageUrl?: string;
  scores: JudgeScore[];
  totalPoints: number;
  likes: number; // Jumlah "like" yang diterima karya
  isDisqualified: boolean;
  disqualificationReason: string | null;
  comments: Comment[];
  createdAt: Date;
  customData: Record<string, string>; // For custom form fields
};

export type ContestInfoData = {
    theme: string;
    dates: string;
    rules: string;
    criteria: string;
};

export type AnnouncementBannerData = {
    text: string;
    isEnabled: boolean;
};

export type FormFieldDefinition = {
    name: string; // Will be used as the key in customData
    label: string;
    type: 'text' | 'select' | 'file';
    required: boolean;
    options?: string[]; // For select type
};
