"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { NHSLetter } from "@/lib/types";

interface LettersTableProps {
  letters: NHSLetter[];
  nhsNumber?: string;
}

function formatDate(dateString: string) {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function formatDateTime(dateString: string) {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function maskNhsNumber(nhsNumber: string | undefined) {
  if (!nhsNumber) return "-";
  return `***-***-${nhsNumber.slice(-4)}`;
}

function maskNhsNumbersInText(text: string | undefined) {
  if (!text) return text;
  // Match NHS numbers in various formats: 123 456 7890, 123-456-7890, 1234567890
  return text.replace(
    /\b(\d{3})[\s-]?(\d{3})[\s-]?(\d{4})\b/g,
    (_, _p1, _p2, p3) => `***-***-${p3}`
  );
}

export function LettersTable({ letters, nhsNumber }: LettersTableProps) {
  const [selectedLetter, setSelectedLetter] = useState<NHSLetter | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {nhsNumber
                  ? `Letters for NHS ${maskNhsNumber(nhsNumber)}`
                  : "All Letters"}
              </CardTitle>
              <CardDescription>
                {letters.length} letter{letters.length === 1 ? "" : "s"} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {letters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <svg
                className="h-12 w-12 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>
                {nhsNumber
                  ? "No letters found for this NHS number"
                  : "No letters found"}
              </p>
            </div>
          ) : (
            <div className="rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NHS Number</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Letter Date</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pages</TableHead>
                    <TableHead>Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {letters.map((letter) => (
                    <TableRow
                      key={`${letter.pk}-${letter.uploaded_at}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedLetter(letter)}
                    >
                      <TableCell className="font-mono">
                        {maskNhsNumber(letter.nhs_number || letter.pk)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {letter.file_name}
                      </TableCell>
                      <TableCell>{formatDate(letter.letter_date)}</TableCell>
                      <TableCell>
                        {formatDateTime(letter.uploaded_at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            letter.status === "processed"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            letter.status === "processed"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                          }
                        >
                          {letter.status === "processed" ? (
                            <svg
                              className="h-3 w-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-3 w-3 mr-1 animate-spin"
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
                          )}
                          {letter.status === "processed"
                            ? "Processed"
                            : "Processing"}
                        </Badge>
                      </TableCell>
                      <TableCell>{letter.num_pages}</TableCell>
                      <TableCell>{formatFileSize(letter.file_size)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={!!selectedLetter}
        onOpenChange={(open) => !open && setSelectedLetter(null)}
      >
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedLetter && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedLetter.file_name}</SheetTitle>
                <SheetDescription>
                  NHS Number:{" "}
                  {maskNhsNumber(
                    selectedLetter.nhs_number || selectedLetter.pk
                  )}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6 p-8">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Letter Date</p>
                    <p className="font-medium">
                      {formatDate(selectedLetter.letter_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uploaded</p>
                    <p className="font-medium">
                      {formatDateTime(selectedLetter.uploaded_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pages</p>
                    <p className="font-medium">{selectedLetter.num_pages}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">File Size</p>
                    <p className="font-medium">
                      {formatFileSize(selectedLetter.file_size)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge
                      variant={
                        selectedLetter.status === "processed"
                          ? "default"
                          : "secondary"
                      }
                      className={
                        selectedLetter.status === "processed"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }
                    >
                      {selectedLetter.status === "processed"
                        ? "Processed"
                        : "Processing"}
                    </Badge>
                  </div>
                  {selectedLetter.processed_at && (
                    <div>
                      <p className="text-muted-foreground">Processed At</p>
                      <p className="font-medium">
                        {formatDateTime(selectedLetter.processed_at)}
                      </p>
                    </div>
                  )}
                </div>

                {selectedLetter.summary && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Summary</h3>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded p-4">
                      {maskNhsNumbersInText(selectedLetter.summary)}
                    </div>
                  </div>
                )}

                {selectedLetter.letter_body && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Letter Content
                    </h3>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded p-4 max-h-96 overflow-y-auto">
                      {maskNhsNumbersInText(selectedLetter.letter_body)}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
