import * as fs from "fs";
import path from "path";
import { knownError } from "../symbols/error-models";
import { AttemptToFetch, failure, success, Unit } from "../symbols/functors";
import { InventoryManager } from "./storage-interface";

export class LocalStorage implements InventoryManager {
    public id = "local"
    private baseDirectory: string;

    constructor(baseDirectory: string = "./output") {
        this.baseDirectory = baseDirectory;
    }

    async createFolder(folderPath: string): AttemptToFetch<Unit> {
        try {
            const fullPath = path.join(this.baseDirectory, folderPath);
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`Folder created successfully - ${fullPath}`);
            return success({});
        } catch (error) {
            const errorMessage = `Folder creation error: ${(error as Error).message}`;
            console.error(errorMessage);
            return failure(knownError(errorMessage, error as Error));
        }
    }

    async uploadFile(buffer: Buffer, destinationFileName: string): AttemptToFetch<Unit> {
        try {
            const docPath = path.join(this.baseDirectory, destinationFileName);
            console.log(`Trying to store into ${docPath}`)
            fs.writeFileSync(docPath, buffer);
            console.log(`File saved successfully - ${destinationFileName}`);
            return success({});
        } catch (error) {
            const errorMessage = `File save error: ${(error as Error).message}`;
            console.error(errorMessage);
            return failure(knownError(errorMessage, error as Error));
        }
    }
}
