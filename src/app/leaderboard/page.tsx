
import { Leaderboard } from "@/components/leaderboard";
import { getArtworks, getLeaderboardStatus } from "@/lib/actions";
import { Trophy } from "lucide-react";

export default async function LeaderboardPage() {
  const showResults = await getLeaderboardStatus();
  
  if (!showResults) {
     return (
       <div className="space-y-12">
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Leaderboard</h1>
            <p className="mt-2 text-lg text-muted-foreground">
            Hasil akhir dari Lomba Desain Poster 80Fest!
            </p>
        </div>
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Hasil Belum Diumumkan</h3>
            <p className="mt-1 text-sm text-muted-foreground">
            Proses penilaian masih berlangsung. Nantikan pengumuman juara di halaman ini!
            </p>
        </div>
      </div>
    );
  }

  const allArtworks = await getArtworks();
  const rankedArtworks = allArtworks
    .filter((artwork) => artwork.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Leaderboard</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Hasil akhir dari Lomba Desain Poster 80Fest!
        </p>
      </div>
      <Leaderboard rankedArtworks={rankedArtworks} />
    </div>
  );
}
