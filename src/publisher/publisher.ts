import { PublishReadyArticle } from "../symbols/entities"

export class Publisher {
    publish = async (article: PublishReadyArticle) => {
        console.log(`Publishing article ${article.title}`)
    }
}