import { UploadResponse } from "./types";
import { getAuthToken } from "./auth";
import { AppError } from "./errors";

// API base URL - configure this for your environment
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://wcnpoewlzb.execute-api.us-east-1.amazonaws.com/Prod";

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  headers["Authorization"] = `Bearer ${token}`; //
  return headers;
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/pdf",
      "x-filename": file.name,
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
