import { Agent } from "../agent/agent";
import { NewsSource } from "../sources/source-interface";
import { ArticleIdentifier, ArticlesInfo, ArticleTitle, EmbeddedArticleTitles, FetchArticleAttempt, ProcessArticleInput, ProcessSingleArticleInput, ProcessUnionArticleInput, RawArticlePayload, UnionArticlePayload, UniqueTitle } from "../symbols/entities";
import { GeneralError, knownError, unknownError } from "../symbols/error-models";
import { AttemptToFetch, failure, resolveThe } from "../symbols/functors";
import { DSL } from "./dsl";

export class Application {
    mainErrors: GeneralError[] = []
    fetchErrors: GeneralError[] = []
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

    private fetchArticle = async (articleIdentifier: ArticleIdentifier): AttemptToFetch<RawArticlePayload> => {
        const source = this.sources.find(source => source.name === articleIdentifier.source)
        if (!source) {
            const error = knownError(`Source not found for identifier ${JSON.stringify(articleIdentifier, null, 2)}`)
            this.mainErrors.push(error)
            return failure(error)
         }
         return source.fetchArticle(articleIdentifier) 
    }

    private organizeAttempt = (attempt: FetchArticleAttempt, section: RawArticlePayload[]) => {
        resolveThe(attempt, 
            (payload) => section.push(payload),
            (erroredFetch) => this.fetchErrors.push(erroredFetch)
         )

    }

    private buildFileUpload = async (articlesInfo: ArticlesInfo, articleGroups: EmbeddedArticleTitles): Promise<ProcessArticleInput[]> =>{
        const {union, single} = articleGroups

        const unionUploadPayloads = await Promise.all(union.map(async (articleGroup) => {
            const articlesIds = articleGroup.map((articleTitle) => this.dsl.buildArticleId(articlesInfo, articleTitle))

            const rawArticleAttempts = await Promise.all(articlesIds.map(async (articleIdentifier) => {
                return this.fetchArticle(articleIdentifier)
            }))
            
            const rawArticlesPayloads: UnionArticlePayload = rawArticleAttempts.reduce<UnionArticlePayload>((acc, payloadAttempt) =>{
                this.organizeAttempt(payloadAttempt, acc)
                 return acc
            }, [])

            return this.dsl.buildUnionUploadPayload(rawArticlesPayloads)
        }))

        const singleFetchAttempts = await Promise.all(single.map(async (uniqueTitle) => {
            const articleIdentifier = this.dsl.buildArticleId(articlesInfo, uniqueTitle)
             return this.fetchArticle(articleIdentifier)
        }))

        const singleRawPayloads = singleFetchAttempts.reduce<RawArticlePayload[]>((acc, fetchAttempt) => {
            this.organizeAttempt(fetchAttempt, acc)
            return acc
        }, [])

        const singleUploadPayloads = singleRawPayloads.map((payload) => this.dsl.buildSingleUploadPayload(payload))

        return [...unionUploadPayloads, ...singleUploadPayloads]
    }
    
     run = async () => {
        const articlesInfo = await this.fetchArticles()
        const uniqueTitles = this.groupArticles(articlesInfo)
        const articleGroups = await this.agent.embedArticles(uniqueTitles)
        const fileUploadsInput = await this.buildFileUpload(articlesInfo, articleGroups)
        return fileUploadsInput
    }
}