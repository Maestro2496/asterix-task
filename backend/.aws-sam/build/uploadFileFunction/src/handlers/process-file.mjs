// S3 event handler for processing uploaded files
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import OpenAI from "openai";

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const ssmClient = new SSMClient({});

// Get environment variables
const bucketName = process.env.BUCKET_NAME;
const nhsLettersTable = process.env.NHS_LETTERS_TABLE;

// Cached OpenAI client (initialized on first use)
let openai = null;

/**
 * Get OpenAI API key from SSM Parameter Store
 * @returns {Promise<string>} - The OpenAI API key
 */
const getOpenAIKey = async () => {
  const response = await ssmClient.send(
    new GetParameterCommand({
      Name: "OPENAI_KEY",
      WithDecryption: true,
    })
  );
  return response.Parameter.Value;
};

/**
 * Get or initialize the OpenAI client
 * @returns {Promise<OpenAI>} - The OpenAI client
 */
const getOpenAIClient = async () => {
  if (!openai) {
    const apiKey = await getOpenAIKey();
    openai = new OpenAI({ apiKey });
  }
  return openai;
};

/**
 * Summarize letter body using OpenAI
 * @param {string} letterBody - The letter content to summarize
 * @returns {Promise<string>} - The summary
 */
const summarizeLetterBody = async (letterBody) => {
  if (!letterBody) {
    return null;
  }

  try {
    const client = await getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a medical document summarizer. Summarize the following NHS letter concisely, highlighting key information such as appointment details, medical instructions, and any required actions. Keep the summary under 200 words.",
        },
        {
          role: "user",
          content: letterBody,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
};

/**
 * Find the DynamoDB record by S3 key
 * @param {string} s3Key - The S3 object key
 * @returns {Promise<object|null>} - The DynamoDB record or null
 */
const findRecordByS3Key = async (s3Key) => {
  // Query using GSI ByUploadDate to find recent records, then filter by s3_key
  // Since we don't have a GSI on s3_key, we'll scan recent partitions
  const now = new Date();
  const currentPartition = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  try {
    const result = await ddbDocClient.send(
      new QueryCommand({
        TableName: nhsLettersTable,
        IndexName: "ByUploadDate",
        KeyConditionExpression: "date_partition = :dp",
        FilterExpression: "s3_key = :s3key",
        ExpressionAttributeValues: {
          ":dp": currentPartition,
          ":s3key": s3Key,
        },
      })
    );

    return result.Items?.[0] || null;
  } catch (error) {
    console.error("Error querying DynamoDB:", error);
    throw error;
  }
};

/**
 * Update the DynamoDB record with summary and status
 * @param {string} pk - Partition key
 * @param {string} uploadedAt - Sort key
 * @param {string} summary - The generated summary
 */
const updateRecordWithSummary = async (pk, uploadedAt, summary) => {
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: nhsLettersTable,
      Key: {
        pk: pk,
        uploaded_at: uploadedAt,
      },
      UpdateExpression:
        "SET #status = :status, summary = :summary, processed_at = :processedAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": "processed",
        ":summary": summary,
        ":processedAt": new Date().toISOString(),
      },
    })
  );
};

/**
 * Lambda handler triggered by S3 ObjectCreated events
 * @param {object} event - S3 event object
 */
export const processFileHandler = async (event) => {
  console.info("S3 event received:", JSON.stringify(event, null, 2));

  // Process each record in the event (S3 can batch multiple events)
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    const eventName = record.eventName;

    console.info(`Processing file: ${key} from bucket: ${bucket}`);
    console.info(`Event type: ${eventName}`);

    try {
      // Skip non-PDF files
      if (!key.toLowerCase().endsWith(".pdf")) {
        console.info(`Skipping non-PDF file: ${key}`);
        continue;
      }

      // Find the DynamoDB record for this file
      const dbRecord = await findRecordByS3Key(key);

      if (!dbRecord) {
        console.warn(`No DynamoDB record found for file: ${key}`);
        continue;
      }

      console.info(`Found DynamoDB record for NHS Number: ${dbRecord.pk}`);

      // Get the letter body from the record
      const letterBody = dbRecord.letter_body;

      if (!letterBody) {
        console.warn(`No letter body found for file: ${key}`);
        // Update status to processed even without summary
        await updateRecordWithSummary(dbRecord.pk, dbRecord.uploaded_at, null);
        continue;
      }

      // Summarize the letter using OpenAI
      console.info("Generating summary with OpenAI...");
      const summary = await summarizeLetterBody(letterBody);
      console.info(`Summary generated: ${summary?.substring(0, 100)}...`);

      // Update the DynamoDB record with summary and status
      await updateRecordWithSummary(dbRecord.pk, dbRecord.uploaded_at, summary);

      console.info(`Successfully processed file: ${key}`);
    } catch (error) {
      console.error(`Error processing file ${key}:`, error);
      throw error; // Re-throw to mark the Lambda invocation as failed
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Files processed successfully",
      recordsProcessed: event.Records.length,
    }),
  };
};
