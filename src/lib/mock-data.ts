export type Artwork = {
  id: number;
  name: string;
  class: string;
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  status_juara: number; // 0 for none, 1 for 1st, 2 for 2nd, 3 for 3rd
};

export const artworks: Artwork[] = [
  {
    id: 1,
    name: "Andi Pratama",
    class: "XII IPA 1",
    title: "Harapan di Ujung Senja",
    description: "Poster ini menggambarkan semangat pantang menyerah dalam menggapai cita-cita, seperti matahari yang selalu terbit kembali.",
    imageUrl: "https://placehold.co/600x800.png",
    imageHint: "sunset hope",
    status_juara: 2,
  },
  {
    id: 2,
    name: "Siti Aminah",
    class: "XI IPS 3",
    title: "Melodi Alam",
    description: "Sebuah visualisasi tentang bagaimana alam dan musik dapat berpadu menciptakan harmoni yang menenangkan jiwa.",
    imageUrl: "https://placehold.co/600x800.png",
    imageHint: "nature melody",
    status_juara: 0,
  },
  {
    id: 3,
    name: "Budi Santoso",
    class: "X-C",
    title: "Metropolis Neon",
    description: "Kehidupan kota yang dinamis dan penuh warna di malam hari, ditangkap dalam goresan digital yang energik.",
    imageUrl: "https://placehold.co/600x800.png",
    imageHint: "neon city",
    status_juara: 0,
  },
  {
    id: 4,
    name: "Dewi Lestari",
    class: "XII Bahasa",
    title: "Jendela Dunia",
    description: "Buku adalah jendela untuk melihat dunia yang lebih luas. Poster ini mengajak kita untuk lebih giat membaca.",
    imageUrl: "https://placehold.co/600x800.png",
    imageHint: "reading books",
    status_juara: 1,
  },
  {
    id: 5,
    name: "Eko Nugroho",
    class: "XI TKJ 2",
    title: "Piksel dan Imajinasi",
    description: "Karya ini mengeksplorasi hubungan antara teknologi digital dan kreativitas tanpa batas dari imajinasi manusia.",
    imageUrl: "https://placehold.co/600x800.png",
    imageHint: "digital imagination",
    status_juara: 3,
  },
  {
    id: 6,
    name: "Fitri Wulandari",
    class: "XII IPS 1",
    title: "Gema Tradisi",
    description: "Mengangkat kekayaan budaya tradisional Indonesia dalam sebuah komposisi modern yang menarik.",
    imageUrl: "https://placehold.co/600x800.png",
    imageHint: "traditional culture",
    status_juara: 0,
  },
   {
    id: 7,
    name: "Gilang Ramadhan",
    class: "X-A",
    title: "Kosmos Bawah Laut",
    description: "Keindahan dan misteri kehidupan di bawah permukaan laut, digambarkan seperti alam semesta yang lain.",
    imageUrl: "https://placehold.co/600x800.png",
    imageHint: "underwater cosmos",
    status_juara: 0,
  },
   {
    id: 8,
    name: "Hana Yulita",
    class: "XI IPA 4",
    title: "Simfoni Urban",
    description: "Ritme kehidupan perkotaan yang sibuk namun memiliki keindahan tersendiri, seperti sebuah simfoni.",
    imageUrl: "https://placehold.co/600x800.png",
    imageHint: "urban symphony",
    status_juara: 0,
  },
];
