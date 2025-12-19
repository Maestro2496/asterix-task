/**
 * Extracts NHS Number, letter date, and body content from PDF text
 * @param {string} text - The extracted text from the PDF
 * @returns {object} - Object containing nhsNumber, letterDate, and body
 */
export const extractNhsDetails = (text) => {
  // Extract NHS Number (format: XXX XXX XXXX or similar)
  const nhsMatch = text.match(/NHS\s*No\.?\s*[:\-]?\s*([\d\s]+)/i);
  const nhsNumber = nhsMatch ? nhsMatch[1].trim().replace(/\s+/g, " ") : null;

  const letterDate = extractLetterDate(text);

  // Extract body starting from "Dear"
  const bodyMatch = text.match(/Dear\b[\s\S]*/);
  const body = bodyMatch ? bodyMatch[0].trim() : null;

  return {
    nhsNumber,
    letter_date: letterDate,
    body,
  };
};

/**
 * Extracts and normalizes the letter date from PDF text
 * @param {string} text - The extracted text from the PDF
 * @returns {string|null} - ISO date string (YYYY-MM-DD) or null
 */
const extractLetterDate = (text) => {
  // Month name mapping
  const months = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };

  const longDateMatch = text.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
  );
  if (longDateMatch) {
    const day = longDateMatch[1].padStart(2, "0");
    const month = months[longDateMatch[2].toLowerCase()];
    const year = longDateMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Try format: "29/01/2025" or "29-01-2025"
  const shortDateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (shortDateMatch) {
    const day = shortDateMatch[1].padStart(2, "0");
    const month = shortDateMatch[2].padStart(2, "0");
    const year = shortDateMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Try ISO format: "2025-01-29"
  const isoDateMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    return isoDateMatch[0];
  }

  return null;
};

/**
 * Extracts year-month partition from a date string
 * @param {string} dateStr - ISO date string (YYYY-MM-DD) or ISO timestamp
 * @returns {string|null} - Year-month string (YYYY-MM) or null
 */
export const getDatePartition = (dateStr) => {
  if (!dateStr) return null;
  // Handle both YYYY-MM-DD and full ISO timestamps
  const match = dateStr.match(/^(\d{4}-\d{2})/);
  return match ? match[1] : null;
};
