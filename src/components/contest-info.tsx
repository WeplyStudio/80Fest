
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Palette, ScrollText, ClipboardCheck } from "lucide-react";

const infoItems = [
  {
    icon: Palette,
    title: "Poster Theme",
    content: "Dirgahayu republik indonesia ke 80: Bersatu Berdaulat Rakyat Sejahtera Indonesia Maju",
  },
  {
    icon: Calendar,
    title: "Important Dates",
    content: (
        <ul className="list-disc pl-5 space-y-1">
            <li><strong>Submission:</strong> August 6 - 8, 2025</li>
            <li><strong>Judging Period:</strong> August 8, 2025</li>
            <li><strong>Winner Announcement:</strong> August 9, 2025</li>
        </ul>
    ),
  },
  {
    icon: ScrollText,
    title: "General Rules",
    content: (
        <ul className="list-disc pl-5 space-y-1">
            <li>Artwork must be 100% original and never published before.</li>
            <li>Judges can disqualify entries for plagiarism or copyright infringement.</li>
            <li>Accepted formats are PNG or JPG, max size 25MB.</li>
            <li>The judges' decisions are final and cannot be contested.</li>
        </ul>
    ),
  },
  {
    icon: ClipboardCheck,
    title: "Judging Criteria",
    content: (
        <ul className="list-disc pl-5 space-y-1">
            <li>Alignment with the theme</li>
            <li>Layout and composition</li>
            <li>Typography and color usage</li>
            <li>Clarity and impact of the content</li>
        </ul>
    ),
  },
];


export function ContestInfo() {
  return (
    <section id="info" className="space-y-16 section-padding container">
        <div className="text-center">
            <h2 className="text-4xl font-bold font-headline text-primary">Contest Information</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Everything you need to know to participate and win.</p>
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
