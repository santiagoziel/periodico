import { Agent } from "../agent/agent";
import { NewsEditor } from "../newsEditor/news-editor";
import { Publisher } from "../publisher/publisher";
import { NewsSource } from "../sources/source-interface";
import { ArticleIdentifier, ArticlesInfo, EmbeddedArticleTitles, FetchArticleAttempt, ProcessArticleInput, PublishReadyArticle, RawArticlePayload, TitleGroup, UnionArticlePayload } from "../symbols/entities";
import { GeneralError, knownError } from "../symbols/error-models";
import { AttemptToFetch, failure, resolveThe } from "../symbols/functors";
import { DSL } from "./dsl";

export class Application {
    mainErrors: GeneralError[] = []
    fetchErrors: GeneralError[] = []
    redactErrors: GeneralError[] = []
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

    private sortFetchAttempt = (attempt: FetchArticleAttempt, section: RawArticlePayload[]) => {
        resolveThe(attempt, 
            (payload) => section.push(payload),
            (erroredFetch) => this.fetchErrors.push(erroredFetch)
         )
    }

    private formatUnionArticleGroup = async (articleGroup: TitleGroup, articlesInfo: ArticlesInfo) => {
        const articlesIds = articleGroup.map((articleTitle) => this.dsl.buildArticleId(articlesInfo, articleTitle))

        const rawArticleAttempts = await Promise.all(articlesIds.map(async (articleIdentifier) => this.fetchArticle(articleIdentifier)))
        
        const rawArticlesPayloads: UnionArticlePayload = rawArticleAttempts.reduce<UnionArticlePayload>((acc, payloadAttempt) => {
            this.sortFetchAttempt(payloadAttempt, acc)
            return acc
        }, [])

        return this.dsl.buildUnionUploadPayload(rawArticlesPayloads)
    }

    private formatSingleArticleGroup = async (articleGroup: TitleGroup, articlesInfo: ArticlesInfo)=> {
        const singleFetchAttempts = await Promise.all(articleGroup.map(async (uniqueTitle) => {
            const articleIdentifier = this.dsl.buildArticleId(articlesInfo, uniqueTitle)
            return this.fetchArticle(articleIdentifier)
        }))

        const singleRawPayloads = singleFetchAttempts.reduce<RawArticlePayload[]>((acc, fetchAttempt) => {
            this.sortFetchAttempt(fetchAttempt, acc)
            return acc
        }, [])

        return singleRawPayloads.map((payload) => this.dsl.buildSingleUploadPayload(payload))
    }

    private buildNews = async (articlesInfo: ArticlesInfo, articleGroups: EmbeddedArticleTitles): Promise<ProcessArticleInput[]> =>{
        const unionUploadPayloads = 
            await Promise.all(
                articleGroups.union.map(async (articleGroup) => this.formatUnionArticleGroup(articleGroup, articlesInfo)
            ))

        const singleUploadPayloads = 
            await this.formatSingleArticleGroup(articleGroups.single, articlesInfo)

        return [...unionUploadPayloads, ...singleUploadPayloads]
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
        const sourcedNews = await this.buildNews(articlesInfo, articleGroups)
        const readyToPublishNotes = await this.writeNews(sourcedNews)
        const publishResults = await this.publisher.publish(readyToPublishNotes)
        return publishResults
    }
}