import { ArticleIdentifier, ArticleTitle, ArticlesInfo, ProcessSingleArticleInput, ProcessUnionArticleInput, RawArticlePayload, UnionArticlePayload, UniqueTitle } from "../symbols/entities"
import { GeneralError, errorWithContext, theParsedErrorFromThe } from "../symbols/error-models"

export class DSL {
    logInfo = (x: object) => {
        try{
            console.log(JSON.stringify(x, null, 4))
        } catch {
            console.log("Could not stringify log object")
            console.log(x)
        }
    }

    logError = (x: object, context?: string) => {
        try{
            context ?
            console.error(JSON.stringify({context, error: x}, null, 4)):
            console.error(JSON.stringify(x, null, 4))
        } catch {
            console.log("Could not stringify error object")
            console.error(x)
        }
    }

    parseTheErrorFromThe = (x: GeneralError, context?: string) =>{
        context ?
        console.log(theParsedErrorFromThe(errorWithContext(context, x), (error) => this.logError(error, context))):
        console.log(theParsedErrorFromThe(x, this.logError))
    }

    cleanString = (x: string) => {
        return x.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[\\\/:*?"<>|""''`']/g, "")  // invalid filename chars + quotes (Windows-safe)
        .replace(/[\x00-\x1F]/g, "")    // control characters
        .trim()
        .replace(/\s+/g, "-")           // spaces → hyphens
        .replace(/-+/g, "-")            // collapse multiple hyphens
        .replace(/[. ]+$/, "");  // no trailing dots or spaces
      }

    organizeTitles = (name: string, titles: ArticleTitle[], articlesInfo: ArticlesInfo) => {
        articlesInfo[name] = titles.map((articleTitle) => ({...articleTitle, title: this.cleanString(articleTitle.title)}))
    }

    flattenArticleTitles = (articlesInfo: ArticlesInfo): UniqueTitle[] => {
        return (Object.entries(articlesInfo) as [string, ArticleTitle[]][]).map(([sourceName, titles]) => 
            titles.map(articleTitle => ({source: sourceName, title: articleTitle.title}))
        ).flat()
    }

    buildArticleId = (articleInfo: ArticlesInfo, title: UniqueTitle): ArticleIdentifier => {
        const sourceArticles = articleInfo[title.source]
        const sourceArticle = sourceArticles.find(article => article.title === title.title)
        if (!sourceArticle) {
            throw new Error(`Article ${title.title} not found in source ${title.source}`)
        }
        return {
            source: title.source,
            title: title.title,
            url: sourceArticle.url
        }
    }

    buildUnionUploadPayload = (rawPayloads: UnionArticlePayload): ProcessUnionArticleInput => {
        const facts = rawPayloads.map(payload => payload.content)
        const urls = rawPayloads.map(payload => payload.url)
        const relevantPersons = rawPayloads.flatMap(payload => payload.relevantPersons ?? [])
        return {
            type: "union", 
            contents: facts,
            urls, 
            ...(relevantPersons.length > 0 ? { relevantPersons } : {})
        }
    }

    buildSingleUploadPayload = (rawPayload: RawArticlePayload): ProcessSingleArticleInput => {
        return {
            type: "single",
            ...rawPayload
        }
    }
}