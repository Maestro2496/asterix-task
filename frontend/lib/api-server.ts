"use server";
import { UploadResponse, NHSLetter, AllFilesResponse } from "./types";

// API base URL - configure this for your environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function appendDateToFilename(filename: string): string {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return `${filename}_${date}`;
  }
  const name = filename.slice(0, lastDotIndex);
  const ext = filename.slice(lastDotIndex);
  return `${name}_${date}${ext}`;
}

export async function uploadFile(
  base64Data: string,
  filename: string
): Promise<UploadResponse> {
  if (!base64Data) {
    throw new Error("No file provided");
  }

  if (!filename.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF files are allowed");
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/pdf",
      "x-filename": appendDateToFilename(filename),
      Authorization: "Bearer TOKEN",
    },
    body: base64Data,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload file");
  }

  return response.json();
}

export async function listAllUploadedFiles(): Promise<AllFilesResponse> {
  const response = await fetch(`${API_BASE_URL}/all`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: "Bearer TOKEN",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch all files");
  }

  const data = await response.json();

  // Map pk to nhs_number for each file
  return {
    ...data,
    files: data.files.map((file: NHSLetter) => ({
      ...file,
      nhs_number: file.pk,
    })),
  };
}
