"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import html2canvas from "html2canvas"

interface User {
  id: string
  instagram_username: string
  spotify_id: string
  spotify_display_name: string
  spotify_email: string
  spotify_image_url: string
  created_at: string
}

interface Track {
  track_name: string
  artist_name: string
  rank: number
}

interface Artist {
  artist_name: string
  genres: string[]
  rank: number
}

interface AudioFeatures {
  danceability: number
  energy: number
  valence: number
  tempo: number
  acousticness: number
  instrumentalness: number
}

interface RecentlyPlayed {
  track_name: string
  artist_name: string
  played_at: string
}

interface SpotifyReceiptProps {
  user: User
  topTracks: Track[]
  topArtists: Artist[]
  audioFeatures: AudioFeatures | null
  lastPlayed: RecentlyPlayed | null
}

export function SpotifyReceipt({ user, topTracks, topArtists, audioFeatures, lastPlayed }: SpotifyReceiptProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  const currentDate = new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const orderNumber = Math.floor(100000 + Math.random() * 900000)

  // Get most common genre
  const allGenres = topArtists.flatMap((artist) => artist.genres || [])
  const genreCounts: Record<string, number> = {}

  allGenres.forEach((genre) => {
    genreCounts[genre] = (genreCounts[genre] || 0) + 1
  })

  const favoriteGenre =
    Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)[0] || "N/A"

  const downloadReceipt = async () => {
    try {
      const receiptElement = document.getElementById("spotify-receipt")
      if (!receiptElement) return

      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        backgroundColor: "#ffffff",
      })

      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = `spotify-receipt-${user.instagram_username}.png`
      link.click()

      toast({
        title: "Receipt downloaded",
        description: "Your Spotify receipt has been saved to your device",
      })
    } catch (error) {
      console.error("Error downloading receipt:", error)
      toast({
        title: "Download failed",
        description: "There was an error downloading your receipt",
        variant: "destructive",
      })
    }
  }

  const shareReceipt = async () => {
    try {
      setIsSharing(true)

      const receiptElement = document.getElementById("spotify-receipt")
      if (!receiptElement) return

      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        backgroundColor: "#ffffff",
      })

      canvas.toBlob(async (blob) => {
        if (!blob) return

        if (navigator.share) {
          const file = new File([blob], "spotify-receipt.png", {
            type: "image/png",
          })

          await navigator.share({
            title: "My Spotify Receipt",
            text: "Check out my Spotify listening habits!",
            files: [file],
          })
        } else {
          // Fallback for browsers that don't support Web Share API
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `spotify-receipt-${user.instagram_username}.png`
          link.click()
          URL.revokeObjectURL(url)
        }

        toast({
          title: "Receipt shared",
          description: "Your Spotify receipt has been shared",
        })
      }, "image/png")
    } catch (error) {
      console.error("Error sharing receipt:", error)
      toast({
        title: "Share failed",
        description: "There was an error sharing your receipt",
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card id="spotify-receipt" className="border-2 rounded-md p-6 bg-white text-black font-mono">
        <div className="text-center border-b-2 border-black pb-4">
          <h1 className="text-3xl font-bold tracking-tight mb-2">SPOTIFY RECEIPT</h1>
          <p className="text-sm">{currentDate}</p>
          <p className="text-sm">ORDER #{orderNumber}</p>
        </div>

        <div className="py-4 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <div className="font-bold">CUSTOMER:</div>
            <div>{user.spotify_display_name}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-bold">INSTAGRAM:</div>
            <div>@{user.instagram_username}</div>
          </div>
        </div>

        <div className="py-4 border-b-2 border-black">
          <h2 className="font-bold mb-2">TOP TRACKS:</h2>
          <div className="space-y-1">
            {topTracks.slice(0, 5).map((track) => (
              <div key={`track-${track.rank}`} className="flex justify-between">
                <div className="truncate flex-1">
                  {track.rank}. {track.track_name} - {track.artist_name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="py-4 border-b-2 border-black">
          <h2 className="font-bold mb-2">TOP ARTISTS:</h2>
          <div className="space-y-1">
            {topArtists.slice(0, 5).map((artist) => (
              <div key={`artist-${artist.rank}`} className="flex justify-between">
                <div className="truncate flex-1">
                  {artist.rank}. {artist.artist_name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="py-4 border-b-2 border-black">
          <h2 className="font-bold mb-2">MUSIC PROFILE:</h2>
          <div className="grid grid-cols-2 gap-2">
            {audioFeatures && (
              <>
                <div className="flex justify-between">
                  <span>Danceability:</span>
                  <span>{Math.round(audioFeatures.danceability * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Energy:</span>
                  <span>{Math.round(audioFeatures.energy * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Happiness:</span>
                  <span>{Math.round(audioFeatures.valence * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Acousticness:</span>
                  <span>{Math.round(audioFeatures.acousticness * 100)}%</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span>Favorite Genre:</span>
              <span>{favoriteGenre}</span>
            </div>
            {lastPlayed && (
              <div className="flex justify-between col-span-2">
                <span>Last Played:</span>
                <span className="truncate">{lastPlayed.track_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 text-center text-sm">
          <p>Thanks for using Spotify Receipt!</p>
          <p>Generated on {new Date().toLocaleDateString()}</p>
        </div>
      </Card>

      <div className="flex gap-4 justify-center">
        <Button onClick={downloadReceipt} className="flex items-center gap-2">
          <Download size={16} />
          Download Receipt
        </Button>
        <Button onClick={shareReceipt} variant="outline" disabled={isSharing} className="flex items-center gap-2">
          <Share2 size={16} />
          {isSharing ? "Sharing..." : "Share Receipt"}
        </Button>
      </div>
    </div>
  )
}
