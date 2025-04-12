import { createServerSupabaseClient } from "@/lib/supabase";
import { SpotifyReceipt } from "@/components/spotify-receipt";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: {
    username: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  return {
    title: `${params.username}'s Spotify Receipt`,
    description: "A receipt-style summary of Spotify listening habits",
  };
}

export default async function ReceiptPage({ params }: PageProps) {
  const { username } = params;

  const supabase = createServerSupabaseClient();

  // Get user data
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("instagram_username", username)
    .single();

  if (userError || !user || !user.spotify_id) {
    notFound();
  }

  // Get top tracks (medium term)
  const { data: topTracks } = await supabase
    .from("user_top_tracks")
    .select("*")
    .eq("user_id", user.id)
    .eq("time_range", "medium_term")
    .order("rank", { ascending: true });

  // Get top artists (medium term)
  const { data: topArtists } = await supabase
    .from("user_top_artists")
    .select("*")
    .eq("user_id", user.id)
    .eq("time_range", "medium_term")
    .order("rank", { ascending: true });

  // Get audio features (medium term)
  const { data: audioFeatures } = await supabase
    .from("user_audio_features")
    .select("*")
    .eq("user_id", user.id)
    .eq("time_range", "medium_term")
    .single();

  // Get recently played tracks
  const { data: recentlyPlayed } = await supabase
    .from("user_recently_played")
    .select("*")
    .eq("user_id", user.id)
    .order("played_at", { ascending: false })
    .limit(1);

  return (
    <div className="w-full max-w-md mx-auto">
      <SpotifyReceipt
        user={user}
        topTracks={topTracks || []}
        topArtists={topArtists || []}
        audioFeatures={audioFeatures}
        lastPlayed={recentlyPlayed?.[0] || null}
      />
    </div>
  );
}
