import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Palette, ScrollText } from "lucide-react";

const infoItems = [
  {
    icon: Palette,
    title: "Tema Lomba",
    content: "Kreativitas Tanpa Batas: Inovasi untuk Masa Depan. Tunjukkan bagaimana idemu dapat membentuk hari esok yang lebih baik melalui poster infografis yang inspiratif.",
  },
  {
    icon: Calendar,
    title: "Jadwal Penting",
    content: (
        <ul className="list-disc pl-5 space-y-1">
            <li><strong>Pendaftaran & Pengumpulan:</strong> 1 - 15 Oktober 2025</li>
            <li><strong>Periode Penjurian:</strong> 16 - 20 Oktober 2025</li>
            <li><strong>Pengumuman Pemenang:</strong> 22 Oktober 2025</li>
        </ul>
    ),
  },
  {
    icon: ScrollText,
    title: "Ketentuan Umum",
    content: (
        <ul className="list-disc pl-5 space-y-1">
            <li>Karya harus orisinal dan belum pernah dipublikasikan.</li>
            <li>Peserta adalah siswa aktif sekolah ini.</li>
            <li>Format file yang diterima adalah PNG atau JPG, maks. 5MB.</li>
            <li>Keputusan juri bersifat mutlak dan tidak dapat diganggu gugat.</li>
        </ul>
    ),
  },
];


export function ContestInfo() {
  return (
    <section id="info" className="space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-bold font-headline">Informasi Lomba</h2>
            <p className="text-muted-foreground">Semua yang perlu kamu ketahui untuk berpartisipasi.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
            {infoItems.map((item, index) => (
                <Card key={index} className="flex flex-col">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <item.icon className="w-8 h-8 text-primary" />
                        <CardTitle className="font-headline">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground flex-grow">
                        {item.content}
                    </CardContent>
                </Card>
            ))}
        </div>
    </section>
  );
}
