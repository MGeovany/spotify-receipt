import SpotifyLoginForm from "@/components/spotify-login-form"

export default function Home() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4">Spotify Receipt</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Generate a receipt-style summary of your Spotify profile
        </p>
      </div>
      <SpotifyLoginForm />
    </div>
  )
}
