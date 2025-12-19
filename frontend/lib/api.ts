import { UploadResponse } from "./types";
import { getAuthToken } from "./auth";
import { AppError } from "./errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  headers["Authorization"] = `Bearer ${token}`; //
  return headers;
}

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

export async function uploadFile(file: File): Promise<UploadResponse> {
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/pdf",
      "x-filename": appendDateToFilename(file.name),
      ...getAuthHeaders(),
    },
    body: file,
  });

  console.log({ response });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw AppError.fromResponse(response, errorBody, "Failed to upload file");
  }

  return response.json();
}
