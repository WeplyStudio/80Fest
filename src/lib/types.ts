export type Artwork = {
  id: string; // Will be ObjectId string from MongoDB
  name: string;
  class: string;
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  status_juara: number; // 0 for none, 1 for 1st, 2 for 2nd, 3 for 3rd
  createdAt: Date;
};
