import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Artwork } from '@/lib/types';
import { Medal, Trophy } from 'lucide-react';

interface LeaderboardProps {
  winners: Artwork[];
}

const winnerStyles: { [key: number]: { card: string; iconColor: string; bgColor: string; label: string; } } = {
  1: {
    card: 'border-yellow-400 shadow-yellow-200/50 shadow-lg',
    iconColor: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    label: 'Juara 1',
  },
  2: {
    card: 'border-gray-400 shadow-gray-200/50 shadow-md',
    iconColor: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    label: 'Juara 2',
  },
  3: {
    card: 'border-amber-600 shadow-amber-900/20 shadow-md',
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-600/10',
    label: 'Juara 3',
  },
};

export function Leaderboard({ winners }: LeaderboardProps) {
  if (winners.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Pemenang Belum Diumumkan</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Nantikan pengumuman juara di halaman ini!
        </p>
      </div>
    );
  }

  const firstPlace = winners.find(w => w.status_juara === 1);
  const otherPlaces = winners.filter(w => w.status_juara > 1).sort((a,b) => a.status_juara - b.status_juara);

  return (
    <div className="space-y-10">
      {firstPlace && <WinnerCard artwork={firstPlace} />}
      {otherPlaces.length > 0 && (
        <div className="grid md:grid-cols-2 gap-8">
            {otherPlaces.map((winner) => <WinnerCard key={winner.id} artwork={winner} />)}
        </div>
      )}
    </div>
  );
}

function WinnerCard({ artwork }: { artwork: Artwork }) {
  const style = winnerStyles[artwork.status_juara];
  
  return (
     <Card className={`overflow-hidden transition-all bg-card ${style.card}`}>
        <div className="grid md:grid-cols-2 items-start">
            <div className="aspect-[3/4] relative rounded-md overflow-hidden m-4">
                <Image
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    fill
                    className="object-cover"
                    data-ai-hint={artwork.imageHint}
                />
            </div>
            <div className='p-6'>
                <div className={`inline-flex items-center gap-2 p-2 pr-3 rounded-full ${style.bgColor}`}>
                    <Medal className={`w-6 h-6 shrink-0 ${style.iconColor}`} />
                    <span className="font-semibold">{style.label}</span>
                </div>
                <CardHeader className='p-0 pt-4'>
                    <CardTitle className="font-headline text-2xl">{artwork.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                    <h3 className="font-semibold">{artwork.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{artwork.class}</p>
                    <p className="text-sm text-muted-foreground">{artwork.description}</p>
                </CardContent>
            </div>
        </div>
    </Card>
  )
}
