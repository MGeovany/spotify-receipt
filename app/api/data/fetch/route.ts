import { createServerSupabaseClient } from "@/lib/supabase"
import { getTopTracks, getTopArtists, getRecentlyPlayed, getAudioFeatures, refreshAccessToken } from "@/lib/spotify"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.redirect(new URL("/auth/error?error=missing_user_id", request.nextUrl.origin))
    }

    const supabase = createServerSupabaseClient()

    // Get user data
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !user) {
      return NextResponse.redirect(new URL("/auth/error?error=user_not_found", request.nextUrl.origin))
    }

    // Check if token has expired
    if (new Date(user.token_expires_at) <= new Date()) {
      console.log('Token expired, attempting refresh...');
      // Refresh the token
      try {
        const refreshResponse = await refreshAccessToken(user.spotify_refresh_token);
        const { access_token, expires_in } = refreshResponse;
        
        console.log('Token refreshed successfully');

        // Calculate new expiration date
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

        // Update user with new token
        const { error: updateError } = await supabase
          .from("users")
          .update({
            spotify_access_token: access_token,
            token_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) {
          console.error('Error updating user with new token:', updateError);
          throw updateError;
        }

        user.spotify_access_token = access_token;
        console.log('User token updated in database');
      } catch (error) {
        console.error('Token refresh failed:', error);
        return NextResponse.redirect(new URL("/auth/error?error=token_refresh_failed", request.nextUrl.origin));
      }
    } else {
      console.log('Token still valid, expires at:', user.token_expires_at);
    }

    // Fetch top tracks for multiple time ranges
    const timeRanges = ["short_term", "medium_term", "long_term"]
    for (const timeRange of timeRanges) {
      const topTracksResponse = await getTopTracks(user.spotify_access_token, timeRange, 10)

      // Store top tracks in database
      const topTracks = topTracksResponse.items.map((track: any, index: number) => ({
        user_id: user.id,
        track_id: track.id,
        track_name: track.name,
        artist_name: track.artists[0].name,
        album_name: track.album.name,
        popularity: track.popularity,
        image_url: track.album.images[0]?.url,
        preview_url: track.preview_url,
        rank: index + 1,
        time_range: timeRange,
      }))

      // Delete existing data first
      await supabase.from("user_top_tracks").delete().eq("user_id", user.id).eq("time_range", timeRange)

      // Insert new data
      await supabase.from("user_top_tracks").insert(topTracks)

      // Fetch audio features for these tracks
      const trackIds = topTracksResponse.items.map((track: any) => track.id)
      const audioFeatures = await getAudioFeatures(user.spotify_access_token, trackIds)

      if (audioFeatures.length > 0) {
        // Calculate average audio features
        const avgFeatures = audioFeatures.reduce(
          (acc: any, feature: any) => {
            acc.danceability += feature.danceability
            acc.energy += feature.energy
            acc.valence += feature.valence
            acc.tempo += feature.tempo
            acc.acousticness += feature.acousticness
            acc.instrumentalness += feature.instrumentalness
            return acc
          },
          {
            danceability: 0,
            energy: 0,
            valence: 0,
            tempo: 0,
            acousticness: 0,
            instrumentalness: 0,
          }
        )

        const count = audioFeatures.length
        Object.keys(avgFeatures).forEach((key) => {
          avgFeatures[key] = avgFeatures[key] / count
        })

        // Delete existing audio features first
        await supabase
          .from("user_audio_features")
          .delete()
          .eq("user_id", user.id)
          .eq("time_range", timeRange)

        // Store audio features
        await supabase.from("user_audio_features").insert({
          user_id: user.id,
          ...avgFeatures,
          time_range: timeRange,
        })
      }
    }

    // Fetch top artists
    for (const timeRange of timeRanges) {
      const topArtistsResponse = await getTopArtists(user.spotify_access_token, timeRange, 10)

      // Store top artists in database
      const topArtists = topArtistsResponse.items.map((artist: any, index: number) => ({
        user_id: user.id,
        artist_id: artist.id,
        artist_name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
        image_url: artist.images[0]?.url,
        rank: index + 1,
        time_range: timeRange,
      }))

      // Delete existing data first
      await supabase.from("user_top_artists").delete().eq("user_id", user.id).eq("time_range", timeRange)

      // Insert new data
      await supabase.from("user_top_artists").insert(topArtists)
    }

    // Fetch recently played tracks
    const recentlyPlayedResponse = await getRecentlyPlayed(user.spotify_access_token, 20)

    // Store recently played in database
    const recentlyPlayed = recentlyPlayedResponse.items.map((item: any) => ({
      user_id: user.id,
      track_id: item.track.id,
      track_name: item.track.name,
      artist_name: item.track.artists[0].name,
      album_name: item.track.album.name,
      played_at: item.played_at,
    }))

    // Delete existing data first
    await supabase.from("user_recently_played").delete().eq("user_id", user.id)

    // Insert new data
    await supabase.from("user_recently_played").insert(recentlyPlayed)

    // Redirect to receipt page
    return NextResponse.redirect(new URL(`/receipt/${user.instagram_username}`, request.nextUrl.origin))
  } catch (error) {
    console.error("Error fetching data:", error)
    return NextResponse.redirect(new URL("/auth/error?error=data_fetch_failed", request.nextUrl.origin))
  }
}
