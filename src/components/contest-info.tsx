
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Palette, ScrollText, ClipboardCheck } from "lucide-react";

const infoItems = [
  {
    icon: Palette,
    title: "Tema Poster",
    content: "Dirgahayu republik indonesia ke 80: Bersatu Berdaulat Rakyat Sejahtera Indonesia Maju",
  },
  {
    icon: Calendar,
    title: "Jadwal Penting",
    content: (
        <ul className="list-disc pl-5 space-y-1">
            <li><strong>Pengumpulan:</strong> 6 - 8 Agustus 2025</li>
            <li><strong>Periode Penjurian:</strong> 8 Agustus 2025</li>
            <li><strong>Pengumuman Pemenang:</strong> 9 Agustus 2025</li>
        </ul>
    ),
  },
  {
    icon: ScrollText,
    title: "Ketentuan Umum",
    content: (
        <ul className="list-disc pl-5 space-y-1">
            <li>Karya harus 100% original milik peserta dan belum pernah di publikasikan di perlombaan apapun!</li>
            <li>Juri berhak mendiskualifikasi peserta apabila ketahuan mengambil atau menyalin atau menduplikasikan karya orang lain.</li>
            <li>Format file yang diterima adalah PNG atau JPG, maks. 25MB.</li>
            <li>Keputusan juri bersifat mutlak dan tidak dapat diganggu gugat.</li>
        </ul>
    ),
  },
  {
    icon: ClipboardCheck,
    title: "Kriteria Penilaian",
    content: (
        <ul className="list-disc pl-5 space-y-1">
            <li>Kesesuaian desain dengan tema</li>
            <li>Tata letak (Layout)</li>
            <li>Penggunaan font dan warna</li>
            <li>Isi/konten informatif dari poster</li>
        </ul>
    ),
  },
];


export function ContestInfo() {
  return (
    <section id="info" className="space-y-12 section-padding container">
        <div className="text-center">
            <h2 className="text-3xl font-bold font-headline text-primary">Informasi Lomba</h2>
            <p className="text-muted-foreground mt-2">Semua yang perlu kamu ketahui untuk berpartisipasi.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {infoItems.map((item, index) => (
                <Card key={index} className="flex flex-col bg-transparent border-0 shadow-none">
                    <CardHeader className="flex flex-row items-center gap-4 p-0">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <item.icon className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-xl">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground flex-grow pt-4 pl-16">
                        {item.content}
                    </CardContent>
                </Card>
            ))}
        </div>
    </section>
  );
}
