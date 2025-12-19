import { Suspense } from "react";
import { LettersTable } from "@/components/letters-table";
import { listAllUploadedFiles } from "@/lib/api-server";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

async function LettersResults() {
  let result;
  let error: Error | null = null;

  try {
    result = await listAllUploadedFiles();
  } catch (e) {
    error = e instanceof Error ? e : new Error("Failed to fetch letters");
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Sorry, something bad happened</AlertDescription>
      </Alert>
    );
  }

  return <LettersTable letters={result?.files || []} />;
}

function LettersLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <svg
        className="animate-spin h-8 w-8 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="ml-3 text-muted-foreground">Loading letters...</span>
    </div>
  );
}

export default async function LettersPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Letters</h1>
        <p className="text-muted-foreground mt-2">View uploaded NHS letters.</p>
      </div>

      <Suspense fallback={<LettersLoading />}>
        <LettersResults />
      </Suspense>
    </div>
  );
}
