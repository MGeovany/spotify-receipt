import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessage = getErrorMessage(searchParams.error);

  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <h1 className="text-3xl font-bold">Authentication Error</h1>
      <p className="text-muted-foreground">{errorMessage}</p>
      <Button asChild>
        <Link href="/">Try Again</Link>
      </Button>
    </div>
  );
}

function getErrorMessage(error?: string): string {
  switch (error) {
    case "access_denied":
      return "You denied permission to access your Spotify account.";
    case "invalid_state":
      return "Invalid state parameter. Please try again.";
    case "user_not_found":
      return "User not found in our database. Please start over.";
    case "database_error":
      return "There was an error updating your information in our database.";
    case "token_refresh_failed":
      return "Failed to refresh your Spotify access token. Please try again.";
    case "server_error":
      return "An internal server error occurred. Please try again later.";
    case "missing_user_id":
      return "User ID is missing. Please start over.";
    case "data_fetch_failed":
      return "Failed to fetch your Spotify data. Please try again.";
    default:
      return "An unknown error occurred. Please try again.";
  }
}
