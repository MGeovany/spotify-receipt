import { createServerSupabaseClient } from "@/lib/supabase";
import { getSpotifyTokens, getSpotifyProfile } from "@/lib/spotify";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Get stored state and Instagram username from cookies
    const storedState = request.cookies.get("spotify_auth_state")?.value;
    const instagramUsername = request.cookies.get("instagram_username")?.value;

    // Check for errors or missing data
    if (error) {
      return NextResponse.redirect(
        new URL("/auth/error?error=" + error, request.nextUrl.origin)
      );
    }

    if (
      !code ||
      !state ||
      !storedState ||
      state !== storedState ||
      !instagramUsername
    ) {
      return NextResponse.redirect(
        new URL("/auth/error?error=invalid_state", request.nextUrl.origin)
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await getSpotifyTokens(code);
    const { access_token, refresh_token, expires_in } = tokenResponse;

    // Get user profile
    const profile = await getSpotifyProfile(access_token);

    // Calculate token expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

    // Update user in database
    const supabase = createServerSupabaseClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("instagram_username", instagramUsername)
      .single();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL("/auth/error?error=user_not_found", request.nextUrl.origin)
      );
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        spotify_id: profile.id,
        spotify_display_name: profile.display_name,
        spotify_email: profile.email,
        spotify_image_url: profile.images?.[0]?.url,
        spotify_access_token: access_token,
        spotify_refresh_token: refresh_token,
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.redirect(
        new URL("/auth/error?error=database_error", request.nextUrl.origin)
      );
    }

    // Redirect to data fetching page
    const response = NextResponse.redirect(
      new URL("/api/data/fetch?user_id=" + user.id, request.nextUrl.origin)
    );

    // Clear auth cookies
    response.cookies.delete("spotify_auth_state");
    response.cookies.delete("instagram_username");

    return response;
  } catch (error) {
    console.error("Error in callback:", error);
    return NextResponse.redirect(
      new URL("/auth/error?error=server_error", request.nextUrl.origin)
    );
  }
}
