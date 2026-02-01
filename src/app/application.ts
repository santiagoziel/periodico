import { NewsSource } from "../sources/source-interface";
import { SourceName } from "../symbols/constants";
import { ArticlesInfo, ArticleTitle, UniqueTitle } from "../symbols/entities";
import { errorWithContext, GeneralError, theParsedErrorFromThe } from "../symbols/error-models";
import { failedThe, resolveThe } from "../symbols/functors";
import { DSL } from "./dsl";

export class Application {
    constructor(private readonly sources: NewsSource[], private readonly dsl: DSL) {}

    private fetchArticles = async () => {
        const articlesInfo: ArticlesInfo = {};
        await Promise.all(this.sources.map(async source => {
            const fetchTitlesAttempt = await source.getTitles()
            resolveThe(fetchTitlesAttempt, 
                (fetched) => this.dsl.organizeTitles(source.name, fetched.titles, articlesInfo),
                (erroredFetch) => this.dsl.parseTheErrorFromThe(erroredFetch, `Could not fetch titles from ${source.name}`)
             )
        }))
        return articlesInfo
    }

    private groupArticles = (articlesInfo: ArticlesInfo): UniqueTitle[] => {
        return (Object.entries(articlesInfo) as [SourceName, ArticleTitle[]][]).map(([sourceName, titles]) => {
            return titles.map(articleTitle => ({source: sourceName, title: articleTitle.title}))
        }).flat()
    }
    
     run = async () => {
        const articlesInfo = await this.fetchArticles()
        const uniqueTitles = this.groupArticles(articlesInfo)
        return uniqueTitles
    }
}