
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Palette, ScrollText, ClipboardCheck } from "lucide-react";

const infoItems = [
  {
    icon: Palette,
    title: "Tema Poster",
    content: "Dirgahayu Republik Indonesia ke-80: Bersatu Berdaulat Rakyat Sejahtera Indonesia Maju",
  },
  {
    icon: Calendar,
    title: "Tanggal Penting",
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
            <li>Karya harus 100% orisinal dan belum pernah dipublikasikan sebelumnya.</li>
            <li>Juri dapat mendiskualifikasi karya karena plagiarisme atau pelanggaran hak cipta.</li>
            <li>Format yang diterima adalah PNG atau JPG, ukuran maksimal 32MB.</li>
            <li>Keputusan juri bersifat final dan tidak dapat diganggu gugat.</li>
        </ul>
    ),
  },
  {
    icon: ClipboardCheck,
    title: "Kriteria Penilaian",
    content: (
        <ul className="list-disc pl-5 space-y-1">
            <li>Kesesuaian dengan tema</li>
            <li>Tata letak dan komposisi</li>
            <li>Penggunaan tipografi dan warna</li>
            <li>Kejelasan dan dampak konten</li>
        </ul>
    ),
  },
];


export function ContestInfo() {
  return (
    <section id="info" className="space-y-16 section-padding container">
        <div className="text-center">
            <h2 className="text-4xl font-bold font-headline text-primary">Informasi Lomba</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Semua yang perlu Anda ketahui untuk berpartisipasi dan menang.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
            {infoItems.map((item, index) => (
                <div key={index} className="flex items-start gap-6">
                    <div className="bg-card/80 p-4 rounded-lg border border-primary/20">
                        <item.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-headline text-xl font-semibold mb-2">{item.title}</h3>
                        <div className="text-muted-foreground leading-relaxed">
                            {item.content}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </section>
  );
}
