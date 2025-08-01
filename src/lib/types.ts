
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
  text: string;
  createdAt: Date;
  parentId: string | null;
  replies: Comment[];
}

export type Artwork = {
  id: string; // Will be ObjectId string from MongoDB
  name: string;
  class: string;
  title: string;
  description:string;
  imageUrl: string;
  scores: JudgeScore[];
  totalPoints: number;
  status_juara: number; // 0 for none, 1 for 1st, 2 for 2nd, 3 for 3rd
  isInGallery: boolean; // true if it should be shown in the public gallery
  comments: Comment[];
  createdAt: Date;
};
