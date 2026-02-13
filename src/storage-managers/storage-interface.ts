import { AttemptToFetch, Unit } from "../symbols/functors";

export interface InventoryManager {
    id: string
    createFolder(folderPath: string): AttemptToFetch<Unit>;
    uploadFile(buffer: Buffer, destinationFileName: string): AttemptToFetch<Unit>;
}
