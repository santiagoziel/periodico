import { InventoryManager } from "../storage-managers/storage-interface"
import { PublishReadyArticle } from "../symbols/entities"

export class Publisher {
    private baseDirectory = "version2"
    constructor(private readonly storagePlaces: InventoryManager[]) {}

    publish = async (articles: PublishReadyArticle[]) => {
        const uniqueFolders = [...new Set(articles.map(article => article.filePath))];

        console.log("Creating folders: " + JSON.stringify(uniqueFolders, null, 2))

        await Promise.all(
            this.storagePlaces.map(async (storage) => {
                for (const folder of uniqueFolders) {
                    await storage.createFolder(`${this.baseDirectory}/${folder}`);
                }
            })
        );

        const storageAttempts = await Promise.all(
            articles.flatMap(article => {
                const destinationFileName = `${this.baseDirectory}/${article.filePath}/${article.processedTitle}.docx`;
                return this.storagePlaces.map(async (storage) => {
                    const storageAttempt = await storage.uploadFile(article.file, destinationFileName);
                    return { storage: storage.id, article: article.processedTitle, storageAttempt };
                });
            })
        );

        return storageAttempts;
    }
}