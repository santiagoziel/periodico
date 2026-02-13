import { InventoryManager } from "../storage-managers/storage-interface"
import { PublishReadyArticle } from "../symbols/entities"

export class Publisher {
    constructor(private readonly storagePlaces: InventoryManager[]) {}

    publish = async (articles: PublishReadyArticle[]) => {
        const uniqueFolders = [...new Set(articles.map(article => article.filePath))];

        await Promise.all(
            this.storagePlaces.map(async (storage) => {
                for (const folder of uniqueFolders) {
                    await storage.createFolder(folder);
                }
            })
        );
        
        const storageAttempts = await Promise.all(
            articles.flatMap(article => {
                const destinationFileName = `${article.filePath}/${article.title}.docx`;
                return this.storagePlaces.map(async (storage) => {
                    const storageAttempt = await storage.uploadFile(article.file, destinationFileName);
                    return { storage: storage.id, article: article.title, storageAttempt };
                });
            })
        );

        return storageAttempts;
    }
}