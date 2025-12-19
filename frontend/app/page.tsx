import { FileUpload } from "@/components/file-upload";

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Upload Letter</h1>
        <p className="text-muted-foreground mt-2">
          Upload NHS letters to extract information and generate AI summaries.
        </p>
      </div>
      <FileUpload />
    </div>
  );
}
