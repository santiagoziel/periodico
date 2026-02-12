import { Storage } from "@google-cloud/storage";
import { knownError } from "../symbols/error-models";
import { AttemptToFetch, failure, success, Unit } from "../symbols/functors";

export class Cloud {
    private storage = new Storage({
        keyFilename: "./google-service-account.json",
        projectId: process.env.GCP_PROJECT_ID,
      });
    
     private bucketName = process.env.GCP_STORAGE_BUCKET || "";

      
    async uploadFile(buffer: Buffer, destinationFileName: string): AttemptToFetch<Unit> {
        try {
          const bucket = this.storage.bucket(this.bucketName);
          const file = bucket.file(destinationFileName);
    
          await file.save(buffer, {
            metadata: {
              contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            },
          });
    
          console.log(`File upload successful - ${destinationFileName}`);
          return success({});
        } catch (error) {
            const errorMessage = `File upload error: ${(error as Error).message}`;
            console.error(errorMessage);
            return failure(knownError(errorMessage, error as Error));
        }
      }
}