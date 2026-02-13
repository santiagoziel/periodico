import { Storage } from "@google-cloud/storage";
import { knownError } from "../symbols/error-models";
import { AttemptToFetch, failure, success, Unit, unit } from "../symbols/functors";
import { InventoryManager } from "./storage-interface";
import * as fs from "fs";

export class Cloud implements InventoryManager {
    public id = "gcp"
    private storage = new Storage({
      keyFilename: "./google-service-account.json",
    });
    
    private bucketName = "fytzia-diario-pruebas"

    constructor(){
      if (!fs.existsSync("./google-service-account.json")) {
        throw new Error(
          "google-service-account.json not found! Download it from Google Cloud Console."
        );
      }
    }

    async createFolder(_folderPath: string): AttemptToFetch<Unit> {
        return success(unit)
    }

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