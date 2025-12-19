// NHS Letter data types based on DynamoDB schema

export interface NHSLetter {
  pk: string; // NHS Number
  nhs_number?: string; // Mapped from pk
  uploaded_at: string;
  file_name: string;
  letter_date: string;
  letter_body: string;
  s3_key: string;
  file_size: number;
  num_pages: number;
  date_partition: string;
  letter_date_partition: string;
  status: "pending" | "processed";
  summary?: string;
  processed_at?: string;
}

export interface UploadResponse {
  message: string;
  bucket: string;
  key: string;
  size: number;
  nhs_number: string;
  letter_date: string;
  letter_body: string;
  pdf_content: {
    text: string;
    num_pages: number;
  };
}

export interface AllFilesResponse {
  message: string;
  count: number;
  files: NHSLetter[];
}
