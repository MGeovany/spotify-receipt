import { createServerSupabaseClient } from "@/lib/supabase"
import { getSpotifyAuthUrl } from "@/lib/spotify"
import { type NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { instagramUsername } = await request.json()

    if (!instagramUsername) {
      return NextResponse.json({ error: "Instagram username is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Check if user already exists
    const { data: existingUser, error: queryError } = await supabase
      .from("users")
      .select("id")
      .eq("instagram_username", instagramUsername)
      .single()

    // Generate a state parameter for CSRF protection
    const state = randomUUID()

    // If user doesn't exist, create a new one
    if (!existingUser) {
      const { error: insertError } = await supabase.from("users").insert({
        instagram_username: instagramUsername,
      })

      if (insertError) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }
    }

    // Generate the Spotify authorization URL
    const authUrl = getSpotifyAuthUrl(state)

    // Store the state and Instagram username in a cookie for validation
    const response = NextResponse.json({ authUrl })
    response.cookies.set("spotify_auth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    })
    response.cookies.set("instagram_username", instagramUsername, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error initializing auth:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
