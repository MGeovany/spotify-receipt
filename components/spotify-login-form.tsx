"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SpotifyLoginForm() {
  const [instagramUsername, setInstagramUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!instagramUsername.trim()) return

    setIsLoading(true)

    try {
      // Save the Instagram username and start the authentication flow
      const response = await fetch("/api/auth/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ instagramUsername }),
      })

      if (!response.ok) {
        throw new Error("Failed to initialize auth")
      }

      const { authUrl } = await response.json()
      window.location.href = authUrl
    } catch (error) {
      console.error("Error:", error)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="instagram-username">Enter your Instagram username</Label>
        <Input
          id="instagram-username"
          type="text"
          placeholder="your_instagram_username"
          value={instagramUsername}
          onChange={(e) => setInstagramUsername(e.target.value)}
          required
          className="text-center"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Processing..." : "Generate Receipt"}
      </Button>
    </form>
  )
}
