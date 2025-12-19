/**
 * Custom error types for the frontend application.
 * Provides structured error handling with error codes and user-friendly messages.
 */

export type ErrorCode =
  | "NETWORK_ERROR"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "UPLOAD_FAILED"
  | "FETCH_FAILED"
  | "UNKNOWN_ERROR"
  // File upload specific errors
  | "FILE_TOO_LARGE"
  | "FILE_TOO_SMALL"
  | "INVALID_FILE_TYPE"
  | "FILE_EMPTY"
  | "FILE_CORRUPTED";

interface AppErrorOptions {
  message: string;
  code: ErrorCode;
  statusCode?: number;
  userMessage?: string;
}

/**
 * Custom error class for application errors.
 * Extends the native Error class with additional properties for
 * structured error handling.
 */
export class AppError extends Error {
  readonly code: ErrorCode;

  readonly statusCode?: number;

  readonly userMessage: string;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.userMessage = options.userMessage ?? options.message;

    // Maintains proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Creates an AppError from an HTTP Response and error body.
   * Maps HTTP status codes to appropriate error codes.
   */
  static fromResponse(
    response: Response,
    errorBody: { message?: string } | null,
    fallbackMessage: string
  ): AppError {
    const message = errorBody?.message || fallbackMessage;
    const statusCode = response.status;

    let code: ErrorCode;
    let userMessage: string;

    switch (statusCode) {
      case 404:
        code = "NOT_FOUND";
        userMessage = "The requested resource was not found.";
        break;
      case 400:
        code = "VALIDATION_ERROR";
        userMessage = message;
        break;
      default:
        code = statusCode >= 500 ? "FETCH_FAILED" : "UNKNOWN_ERROR";
        userMessage = message;
    }

    return new AppError({
      message,
      code,
      statusCode,
      userMessage,
    });
  }

  /**
   * Creates an AppError for network failures (e.g., no internet connection).
   */
  static networkError(originalError?: Error): AppError {
    return new AppError({
      message: originalError?.message || "Network request failed",
      code: "NETWORK_ERROR",
      userMessage:
        "Unable to connect to the server. Please check your internet connection.",
    });
  }

  /**
   * Creates an AppError when file exceeds the maximum allowed size.
   */
  static fileTooLarge(fileSize: number, maxSize: number): AppError {
    const formatSize = (bytes: number) => {
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return new AppError({
      message: `File size ${formatSize(fileSize)} exceeds maximum ${formatSize(
        maxSize
      )}`,
      code: "FILE_TOO_LARGE",
      userMessage: `File is too large. Maximum size allowed is ${formatSize(
        maxSize
      )}.`,
    });
  }

  /**
   * Creates an AppError when file is below minimum size (possibly empty or corrupted).
   */
  static fileTooSmall(fileSize: number, minSize: number): AppError {
    return new AppError({
      message: `File size ${fileSize} bytes is below minimum ${minSize} bytes`,
      code: "FILE_TOO_SMALL",
      userMessage: "File is too small. Please select a valid file.",
    });
  }

  /**
   * Creates an AppError when file type is not supported.
   */
  static invalidFileType(fileType: string, allowedTypes: string[]): AppError {
    const allowed = allowedTypes.join(", ");
    return new AppError({
      message: `File type "${fileType}" is not allowed. Allowed: ${allowed}`,
      code: "INVALID_FILE_TYPE",
      userMessage: `This file type is not supported. Please upload a ${allowed} file.`,
    });
  }

  /**
   * Creates an AppError when file is empty (0 bytes).
   */
  static fileEmpty(): AppError {
    return new AppError({
      message: "File is empty (0 bytes)",
      code: "FILE_EMPTY",
      userMessage:
        "The selected file is empty. Please choose a different file.",
    });
  }

  /**
   * Creates an AppError when file appears to be corrupted or unreadable.
   */
  static fileCorrupted(reason?: string): AppError {
    return new AppError({
      message: reason || "File appears to be corrupted or unreadable",
      code: "FILE_CORRUPTED",
      userMessage:
        "This file appears to be damaged or corrupted. Please try a different file.",
    });
  }

  /**
   * Creates a generic upload failure error.
   */
  static uploadFailed(reason?: string): AppError {
    return new AppError({
      message: reason || "File upload failed",
      code: "UPLOAD_FAILED",
      userMessage: reason || "Failed to upload the file. Please try again.",
    });
  }
}

/**
 * Type guard to check if an error is an AppError.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Options for file validation.
 */
export interface FileValidationOptions {
  maxSize?: number;
  minSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

/**
 * Validates a file and throws an AppError if validation fails.
 * Returns the file if validation passes.
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): File {
  const {
    maxSize = 10 * 1024 * 1024, // Default 10MB
    minSize = 1,
    allowedTypes = ["application/pdf"],
    allowedExtensions = [".pdf"],
  } = options;

  // Check for empty file
  if (file.size === 0) {
    throw AppError.fileEmpty();
  }

  // Check minimum size
  if (file.size < minSize) {
    throw AppError.fileTooSmall(file.size, minSize);
  }

  // Check maximum size
  if (file.size > maxSize) {
    throw AppError.fileTooLarge(file.size, maxSize);
  }

  // Check file type (MIME type)
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw AppError.invalidFileType(file.type || "unknown", allowedTypes);
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowedExtensions.includes(extension)) {
      throw AppError.invalidFileType(extension || "unknown", allowedExtensions);
    }
  }

  return file;
}
