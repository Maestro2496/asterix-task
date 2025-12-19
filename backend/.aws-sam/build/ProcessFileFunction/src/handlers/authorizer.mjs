// Lambda Authorizer - grants access to all requests by default
// TODO: Implement proper authorization logic

/**
 * Generate an IAM policy document
 * @param {string} principalId - The principal user identifier
 * @param {string} effect - Allow or Deny
 * @param {string} resource - The API Gateway resource ARN
 * @param {object} context - Additional context to pass to the backend
 * @returns {object} - IAM policy document
 */
const generatePolicy = (principalId, effect, resource, context = {}) => {
  const policy = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context,
  };

  return policy;
};

/**
 * Lambda authorizer handler
 * Currently allows all requests - update with proper auth logic later
 * @param {object} event - API Gateway authorizer event
 * @returns {object} - IAM policy document
 */
export const authorizerHandler = async (event) => {
  console.info("Authorizer event:", JSON.stringify(event, null, 2));

  const { methodArn, headers = {}, authorizationToken } = event;

  // Get the authorization header (for TOKEN type) or from headers (for REQUEST type)
  const token =
    authorizationToken || headers.authorization || headers.Authorization;

  console.info("Authorization token present:", !!token);

  // TODO: Implement proper token validation
  // For now, allow all requests

  // Extract a principal ID (use 'user' as default for now)
  const principalId = "user";

  // Allow access to all methods
  // Use a wildcard resource to allow access to all API endpoints
  const resourceArn = methodArn
    ? methodArn.split("/").slice(0, 2).join("/") + "/*"
    : "*";

  return generatePolicy(principalId, "Allow", resourceArn, {
    // Add any context you want to pass to the backend Lambda
    userId: principalId,
  });
};
