// Upload file handler for S3 bucket
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import pdf from "pdf-parse";
import {
  extractNhsDetails,
  getDatePartition,
} from "../utils/pdf-extractor.mjs";

const s3Client = new S3Client({});
const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// Get environment variables
const bucketName = process.env.BUCKET_NAME;
const nhsLettersTable = process.env.NHS_LETTERS_TABLE;

// Helper to get header value case-insensitively
const getHeader = (headers, name) => {
  const lowerName = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lowerName) {
      return headers[key];
    }
  }
  return null;
};

export const uploadFileHandler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: `Method ${event.httpMethod} not allowed. Use POST.`,
      }),
    };
  }

  console.info("received upload request:", {
    path: event.path,
    headers: event.headers,
  });

  try {
    // Get filename from headers or generate one (case-insensitive, trimmed)
    const filename = (
      getHeader(event.headers, "x-filename") || `upload-${Date.now()}.pdf`
    ).trim();

    // Get content type from headers (case-insensitive, trimmed)
    const contentType = (
      getHeader(event.headers, "content-type") || "application/octet-stream"
    ).trim();

    // Validate PDF: check content type
    if (contentType !== "application/pdf") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid file type",
          message:
            "Only PDF files are allowed. Content-Type must be application/pdf.",
        }),
      };
    }

    // Validate PDF: check filename extension
    if (!filename.toLowerCase().endsWith(".pdf")) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid file extension",
          message: "Only PDF files are allowed. Filename must end with .pdf.",
        }),
      };
    }

    // Decode the body (API Gateway base64 encodes binary data)
    const body = Buffer.from(event.body, "base64");

    // Validate PDF: check magic bytes (%PDF-)
    const pdfMagicBytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
    if (body.length < 5 || !body.subarray(0, 5).equals(pdfMagicBytes)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid PDF file",
          message: "The uploaded file is not a valid PDF.",
        }),
      };
    }

    // Extract text content from PDF
    const pdfData = await pdf(body);

    // Extract NHS details from the text
    const nhsDetails = extractNhsDetails(pdfData.text);

    // Remove spaces from NHS number
    if (nhsDetails.nhsNumber) {
      nhsDetails.nhsNumber = nhsDetails.nhsNumber.replace(/\s/g, "");
    }

    // Generate timestamps and partitions
    const uploadTimestamp = new Date().toISOString();
    const datePartition = getDatePartition(uploadTimestamp);
    const letterDatePartition = getDatePartition(nhsDetails.letter_date);

    // Upload to S3
    const s3Command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: body,
      ContentType: "application/pdf",
    });

    await s3Client.send(s3Command);

    // Save to DynamoDB with pending status
    const dbItem = {
      pk: nhsDetails.nhsNumber || `UNKNOWN-${Date.now()}`,
      uploaded_at: uploadTimestamp,
      file_name: filename,
      letter_date: nhsDetails.letter_date,
      letter_body: nhsDetails.body,
      s3_key: filename,
      file_size: body.length,
      num_pages: pdfData.numpages,
      date_partition: datePartition,
      letter_date_partition: letterDatePartition,
      status: "pending",
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: nhsLettersTable,
        Item: dbItem,
      })
    );

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded successfully",
        bucket: bucketName,
        key: filename,
        size: body.length,
        nhs_number: nhsDetails.nhsNumber,
        letter_date: nhsDetails.letter_date,
        letter_body: nhsDetails.body,
        pdf_content: {
          text: pdfData.text,
          num_pages: pdfData.numpages,
        },
      }),
    };

    console.info(
      `response from: ${event.path} statusCode: ${response.statusCode}`
    );
    return response;
  } catch (error) {
    console.error("Error uploading file:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to upload file",
        message: error.message,
      }),
    };
  }
};
