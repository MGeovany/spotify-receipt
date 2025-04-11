// Spotify API endpoints
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

// Spotify authorization endpoints
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

// Scopes for Spotify API access
const SPOTIFY_SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "user-read-recently-played",
];

// Generate a Spotify authorization URL
export function getSpotifyAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID || "",
    response_type: "code",
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI || "",
    state,
    scope: SPOTIFY_SCOPES.join(" "),
  });

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for access token
export async function getSpotifyTokens(code: string) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI || "",
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify tokens");
  }

  return response.json();
}

// Get user profile information
export async function getSpotifyProfile(accessToken: string) {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify profile");
  }

  return response.json();
}

// Get user's top tracks
export async function getTopTracks(
  accessToken: string,
  timeRange = "medium_term",
  limit = 10
) {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get top tracks");
  }

  return response.json();
}

// Get user's top artists
export async function getTopArtists(
  accessToken: string,
  timeRange = "medium_term",
  limit = 10
) {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/me/top/artists?time_range=${timeRange}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get top artists");
  }

  return response.json();
}

// Get user's recently played tracks
export async function getRecentlyPlayed(accessToken: string, limit = 20) {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/me/player/recently-played?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get recently played tracks");
  }

  return response.json();
}

// Get audio features for multiple tracks
export async function getAudioFeatures(
  accessToken: string,
  trackIds: string[]
) {
  if (!trackIds.length) return [];

  const response = await fetch(
    `${SPOTIFY_API_BASE}/audio-features?ids=${trackIds.join(",")}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get audio features");
  }

  return response.json();
}

// Refresh the access token
export async function refreshAccessToken(refreshToken: string) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  return response.json();
}
