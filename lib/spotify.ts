// Spotify API endpoints
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

// Spotify authorization endpoints
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

// Scopes for Spotify API access
const SPOTIFY_SCOPES = [
  // Read access to user's private information
  "user-read-private",
  // Read access to user's email address
  "user-read-email",
  // Read access to user's top artists and tracks
  "user-top-read",
  // Read access to user's recently played tracks
  "user-read-recently-played",
];

// Test if the access token is valid
export async function validateSpotifyToken(accessToken: string) {
  console.log("Validating token with /me endpoint...");

  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token validation failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return false;
    }

    const data = await response.json();
    console.log("Token validation successful, user:", data.id);
    return true;
  } catch (error) {
    console.error("Error during token validation:", error);
    return false;
  }
}

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

  // Validate token first
  const isTokenValid = await validateSpotifyToken(accessToken);
  if (!isTokenValid) {
    console.error("Invalid or expired access token");
    throw new Error("Invalid or expired access token");
  }

  // If test succeeds, proceed with batch requests
  const batchSize = 100;
  const results = [];

  for (let i = 0; i < trackIds.length; i += batchSize) {
    const batch = trackIds.slice(i, i + batchSize);
    const batchIds = batch.join(",");
    console.log(
      `Fetching audio features for batch ${
        i / batchSize + 1
      }, tracks: ${batchIds}`
    );
    const features = [
      {
        id: batchIds,
        url: `${SPOTIFY_API_BASE}/audio-features?ids=${batchIds}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    ];
    results.push(...features.filter(Boolean));
  }

  return results;
}

// Refresh the access token
export async function refreshAccessToken(refreshToken: string) {
  if (!refreshToken) {
    console.error("No refresh token provided");
    throw new Error("No refresh token provided");
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  console.log("Attempting to refresh token...");

  try {
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
      const errorText = await response.text();
      console.error("Token refresh failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(
        `Failed to refresh token: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Token refreshed successfully");

    // Validate the new token immediately
    const isValid = await validateSpotifyToken(data.access_token);
    if (!isValid) {
      console.error("Newly refreshed token validation failed");
      throw new Error("New token validation failed");
    }

    return data;
  } catch (error) {
    console.error("Error during token refresh:", error);
    throw error;
  }
}
