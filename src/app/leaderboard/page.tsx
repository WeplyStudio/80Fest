
import { Leaderboard } from "@/components/leaderboard";
import { getArtworks } from "@/lib/actions";

export default async function LeaderboardPage() {
  const allArtworks = await getArtworks();
  const winners = allArtworks
    .filter((artwork) => artwork.status_juara > 0)
    .sort((a, b) => a.status_juara - b.status_juara);

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Leaderboard Juara</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Selamat kepada para pemenang lomba desain poster 80Fest!
        </p>
      </div>
      <Leaderboard winners={winners} />
    </div>
  );
}
