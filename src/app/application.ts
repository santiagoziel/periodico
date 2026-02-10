import { Agent } from "../agent/agent";
import { NewsSource } from "../sources/source-interface";
import { ArticleIdentifier, ArticlesInfo, ArticleTitle, UniqueTitle } from "../symbols/entities";
import { resolveThe } from "../symbols/functors";
import { DSL } from "./dsl";

export class Application {
    constructor(
        private readonly sources: NewsSource[], 
        private readonly dsl: DSL,
        private readonly agent: Agent
    ) {}

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
        return (Object.entries(articlesInfo) as [string, ArticleTitle[]][]).map(([sourceName, titles]) => {
            return titles.map(articleTitle => ({source: sourceName, title: articleTitle.title}))
        }).flat()
    }

    private buildFileUpload = () =>{
        
    }
    
     run = async () => {
        const articlesInfo = await this.fetchArticles()
        const uniqueTitles = this.groupArticles(articlesInfo)
        const articleGroups = await this.agent.embedArticles(uniqueTitles)
        return articleGroups
    }
}