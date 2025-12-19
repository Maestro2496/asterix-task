// Handler to get all uploaded files
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// Get environment variables
const nhsLettersTable = process.env.NHS_LETTERS_TABLE;

/**
 * Lambda handler to get all uploaded files
 * @param {object} event - API Gateway event object
 */
export const getAllFilesHandler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: `Method ${event.httpMethod} not allowed. Use GET.`,
      }),
    };
  }

  console.info("received get all files request:", {
    path: event.path,
  });

  try {
    // Scan the table to get all files
    const allItems = [];
    let lastEvaluatedKey;

    do {
      const result = await ddbDocClient.send(
        new ScanCommand({
          TableName: nhsLettersTable,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );

      if (result.Items) {
        allItems.push(...result.Items);
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "All files retrieved successfully",
        count: allItems.length,
        files: allItems,
      }),
    };

    console.info(
      `response from: ${event.path} statusCode: ${response.statusCode} count: ${allItems.length}`
    );
    return response;
  } catch (error) {
    console.error("Error getting all files:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to get all files",
        message: error.message,
      }),
    };
  }
};
