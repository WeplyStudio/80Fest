
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
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              The final results of the 80Fest Poster Design Contest!
            </p>
        </div>
        <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-card/50">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-6 text-xl font-medium">Results Are Not Yet Announced</h3>
            <p className="mt-2 text-base text-muted-foreground">
              The judging process is still ongoing. Stay tuned for the winner announcement on this page!
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
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          The final results of the 80Fest Poster Design Contest!
        </p>
      </div>
      <Leaderboard rankedArtworks={rankedArtworks} />
    </div>
  );
}
