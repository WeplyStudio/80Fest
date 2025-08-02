
import { Calendar, Palette, ScrollText, ClipboardCheck } from "lucide-react";
import { getContestInfo } from "@/lib/actions";
import ReactMarkdown from 'react-markdown';

// Helper component to render list items correctly from markdown
const renderers = {
    ul: ({ children }: { children: React.ReactNode }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
    li: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
};


export async function ContestInfo() {
  const contestInfo = await getContestInfo();

  const infoItems = [
    {
      icon: Palette,
      title: "Tema Poster",
      content: contestInfo.theme,
    },
    {
      icon: Calendar,
      title: "Tanggal Penting",
      content: contestInfo.dates,
    },
    {
      icon: ScrollText,
      title: "Ketentuan Umum",
      content: contestInfo.rules,
    },
    {
      icon: ClipboardCheck,
      title: "Kriteria Penilaian",
      content: contestInfo.criteria,
    },
  ];

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
                        <div className="text-muted-foreground leading-relaxed prose prose-sm prose-p:my-0 prose-ul:my-0 prose-li:my-0 prose-strong:text-foreground">
                             <ReactMarkdown components={renderers}>{item.content}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </section>
  );
}
