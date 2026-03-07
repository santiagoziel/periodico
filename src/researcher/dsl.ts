import { ArticleIdentifier, NewsEvent, NewsEvents, ProcessSingleArticleInput, ProcessUnionArticleInput, RawArticlePayload, SourcedArticlePayload, UnionArticlePayload, UniqueTitle } from "../symbols/entities"
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

    organizeTitles = (name: string, titles: NewsEvent[], articlesInfo: NewsEvents) => {
        articlesInfo[name] = titles.map((articleTitle) => ({...articleTitle, title: articleTitle.title}))
    }

    organizeReports = (articlesInfo: NewsEvents): UniqueTitle[] => {
        return (Object.entries(articlesInfo) as [string, NewsEvent[]][]).map(([sourceName, titles]) => 
            titles.map(articleTitle => ({source: sourceName, title: articleTitle.title}))
        ).flat()
    }

    buildArticleId = (articleInfo: NewsEvents, title: UniqueTitle): ArticleIdentifier => {
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
        const sources = new Set(rawPayloads.map(payload => payload.source))
        return {
            type: "union", 
            contents: facts,
            sources,
            urls, 
            ...(relevantPersons.length > 0 ? { relevantPersons } : {})
        }
    }

    buildSingleUploadPayload = (rawPayload: SourcedArticlePayload): ProcessSingleArticleInput => {
        return {
            type: "single",
            source: rawPayload.source,
            content: rawPayload.content,
            url: rawPayload.url,
            ...(rawPayload.relevantPersons ? { relevantPersons: rawPayload.relevantPersons } : {})
        }
    }
}