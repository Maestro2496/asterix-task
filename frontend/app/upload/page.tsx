import { FileUpload } from "@/components/file-upload";

export default function UploadPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Letter</h1>
        <p className="text-muted-foreground mt-2">
          Upload NHS letters to extract information and generate AI summaries.
        </p>
      </div>

      <div className="max-w-2xl">
        <FileUpload />
      </div>
    </div>
  );
}
