import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <h1 className="text-3xl font-bold">Page Not Found</h1>
      <p className="text-muted-foreground">
        The page you're looking for doesn't exist or the user hasn't created a Spotify receipt yet.
      </p>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  )
}
