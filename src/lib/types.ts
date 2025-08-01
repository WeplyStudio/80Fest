
export type JudgeScore = {
  judgeName: string;
  score: number;
};

export type Comment = {
  id: string;
  text: string;
  createdAt: Date;
}

export type Artwork = {
  id: string; // Will be ObjectId string from MongoDB
  name: string;
  class: string;
  title: string;
  description:string;
  imageUrl: string;
  imageHint: string;
  scores: JudgeScore[];
  totalPoints: number;
  status_juara: number; // 0 for none, 1 for 1st, 2 for 2nd, 3 for 3rd
  isInGallery: boolean; // true if it should be shown in the public gallery
  comments: Comment[];
  createdAt: Date;
};
