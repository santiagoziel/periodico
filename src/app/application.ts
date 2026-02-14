import pLimit from "p-limit";
import { Agent } from "../agent/agent";
import { NewsEditor } from "../newsEditor/news-editor";
import { Publisher } from "../publisher/publisher";
import { NewsSource } from "../sources/source-interface";
import { ArticleIdentifier, ArticlesInfo, EmbeddedArticleTitles, FetchArticleAttempt, ProcessArticleInput, PublishReadyArticle, RawArticlePayload, TitleGroup, UnionArticlePayload } from "../symbols/entities";
import { GeneralError, knownError } from "../symbols/error-models";
import { AttemptToFetch, failure, resolveThe } from "../symbols/functors";
import { DSL } from "./dsl";

/** Maximum concurrent article fetches to avoid resource exhaustion */
const MAX_CONCURRENT_FETCHES = 5;

export class Application {
    mainErrors: GeneralError[] = []
    fetchErrors: GeneralError[] = []
    redactErrors: GeneralError[] = []
    private readonly fetchLimit = pLimit(MAX_CONCURRENT_FETCHES);

    constructor(
        private readonly sources: NewsSource[], 
        private readonly dsl: DSL,
        private readonly agent: Agent,
        private readonly newsEditor: NewsEditor,
        private readonly publisher: Publisher
    ) {}

    private fetchArticleUrls = async () => {
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

    private fetchArticle = async (articleIdentifier: ArticleIdentifier): AttemptToFetch<RawArticlePayload> => {
        const source = this.sources.find(source => source.name === articleIdentifier.source)
        if (!source) {
            const error = knownError(`Source not found for identifier ${JSON.stringify(articleIdentifier, null, 2)}`)
            this.mainErrors.push(error)
            return failure(error)
         }
         return source.fetchArticle(articleIdentifier) 
    }

    /** Check if a source requires sequential processing */
    private sourceRequiresSequential = (sourceName: string): boolean => {
        const source = this.sources.find(s => s.name === sourceName)
        return source?.requiresSequential ?? false
    }

    /** Fetch articles respecting sequential requirements for certain sources */
    private fetchArticlesWithConcurrencyControl = async (
        articleIdentifiers: ArticleIdentifier[]
    ): Promise<FetchArticleAttempt[]> => {
        // Separate identifiers by whether their source requires sequential processing
        const sequential: ArticleIdentifier[] = []
        const parallel: ArticleIdentifier[] = []

        for (const id of articleIdentifiers) {
            if (this.sourceRequiresSequential(id.source)) {
                sequential.push(id)
            } else {
                parallel.push(id)
            }
        }

        // Fetch parallel sources with concurrency limit
        const parallelResults = await Promise.all(
            parallel.map(id => this.fetchLimit(() => this.fetchArticle(id)))
        )

        // Fetch sequential sources one at a time
        const sequentialResults: FetchArticleAttempt[] = []
        for (const id of sequential) {
            const result = await this.fetchArticle(id)
            sequentialResults.push(result)
        }

        // Return results in original order
        const resultsMap = new Map<string, FetchArticleAttempt>()
        
        parallel.forEach((id, idx) => resultsMap.set(id.url, parallelResults[idx]))
        sequential.forEach((id, idx) => resultsMap.set(id.url, sequentialResults[idx]))

        return articleIdentifiers.map(id => resultsMap.get(id.url)!)
    }

    private sortFetchAttempt = (attempt: FetchArticleAttempt, section: RawArticlePayload[]) => {
        resolveThe(attempt, 
            (payload) => section.push(payload),
            (erroredFetch) => this.fetchErrors.push(erroredFetch)
         )
    }

    private fetchUnionArticleGroup = async (articleGroup: TitleGroup, articlesInfo: ArticlesInfo) => {
        const articlesIds = articleGroup.map((articleTitle) => this.dsl.buildArticleId(articlesInfo, articleTitle))

        const rawArticleAttempts = await this.fetchArticlesWithConcurrencyControl(articlesIds)
        
        const rawArticlesPayloads: UnionArticlePayload = rawArticleAttempts.reduce<UnionArticlePayload>((acc, payloadAttempt) => {
            this.sortFetchAttempt(payloadAttempt, acc)
            return acc
        }, [])

        return this.dsl.buildUnionUploadPayload(rawArticlesPayloads)
    }

    private formatSingleArticleGroup = async (articleGroup: TitleGroup, articlesInfo: ArticlesInfo)=> {
        const articleIdentifiers = articleGroup.map((uniqueTitle) => this.dsl.buildArticleId(articlesInfo, uniqueTitle))

        const singleFetchAttempts = await this.fetchArticlesWithConcurrencyControl(articleIdentifiers)

        const singleRawPayloads = singleFetchAttempts.reduce<RawArticlePayload[]>((acc, fetchAttempt) => {
            this.sortFetchAttempt(fetchAttempt, acc)
            return acc
        }, [])

        return singleRawPayloads.map((payload) => this.dsl.buildSingleUploadPayload(payload))
    }

    private fetchNews = async (articlesInfo: ArticlesInfo, articleGroups: EmbeddedArticleTitles): Promise<ProcessArticleInput[]> =>{
        const unionNewsPayloads = 
            await Promise.all(
                articleGroups.union.map(async (articleGroup) => this.fetchUnionArticleGroup(articleGroup, articlesInfo)
            ))

        const singleNewsPayloads = 
            await this.formatSingleArticleGroup(articleGroups.single, articlesInfo)

        return [...unionNewsPayloads, ...singleNewsPayloads]
    }

    private writeNews = async (sourcedNews: ProcessArticleInput[]): Promise<PublishReadyArticle[]> => {
        const articlesAttempts = await Promise.all(sourcedNews.map((sourcedReport) => this.newsEditor.editArticle(sourcedReport)))
        return articlesAttempts.reduce<PublishReadyArticle[]>((acc, articleAttempt) => {
            resolveThe(articleAttempt,
                (article) => acc.push(article),
                (articleError) => this.redactErrors.push(articleError)
            )
            return acc
        }, [])
    }

    run = async () => {
        const articlesInfo = await this.fetchArticleUrls()
        const uniqueTitles = this.dsl.flattenArticleTitles(articlesInfo)
        const articleGroups = await this.agent.groupArticles(uniqueTitles)
        const sourcedNews = await this.fetchNews(articlesInfo, articleGroups)
        const readyToPublishNotes = await this.writeNews(sourcedNews)
        const publishResults = await this.publisher.publish(readyToPublishNotes)

        console.log("Main errors: " + JSON.stringify(this.mainErrors, null, 2))
        console.log("Fetch errors: " + JSON.stringify(this.fetchErrors, null, 2))
        console.log("Redact errors: " + JSON.stringify(this.redactErrors, null, 2))
        return publishResults
    }
}