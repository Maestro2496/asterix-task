"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LettersSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nhsNumber, setNhsNumber] = useState(searchParams.get("nhs") || "");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!nhsNumber.trim()) return;

    setIsSearching(true);
    router.push(`/letters?nhs=${encodeURIComponent(nhsNumber.trim())}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Letters</CardTitle>
        <CardDescription>
          Enter an NHS number to view all uploaded letters for that patient.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="nhs-number">NHS Number</Label>
            <Input
              id="nhs-number"
              placeholder="e.g., 123 456 7890"
              value={nhsNumber}
              onChange={(e) => setNhsNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !nhsNumber.trim()}
          >
            {isSearching ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                Searching...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

