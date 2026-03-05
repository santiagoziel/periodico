import { Agent } from "../agent/agent";
import { NewsEditor } from "../newsEditor/news-editor";
import { Publisher } from "../publisher/publisher";
import { Researcher } from "../researcher/researcher";
import { AppMode, ProcessArticleInput, PublishReadyArticle, NewsEvents, UniqueTitle, NewsEvent } from "../symbols/entities";
import { GeneralError } from "../symbols/error-models";
import { buildSuccessFrom, resolveThe } from "../symbols/functors";
import { DSL } from "./dsl";

export class Application {
    fetchErrors: GeneralError[] = []
    redactErrors: GeneralError[] = []
    publishErrors: GeneralError[] = []
    expectedErrors: GeneralError[] = []

    constructor(
        private readonly mode: AppMode,
        private readonly agent: Agent,
        private readonly newsEditor: NewsEditor,
        private readonly publisher: Publisher,
        private readonly researcher: Researcher
    ) {}

    private organizeReports = (articlesInfo: NewsEvents): UniqueTitle[] => {
            return (Object.entries(articlesInfo) as [string, NewsEvent[]][]).map(([sourceName, titles]) => 
                titles.map(articleTitle => ({source: sourceName, title: articleTitle.title}))
            ).flat()
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

    private logResults = () => {
        const weHadAnError = this.fetchErrors.length > 0 || this.redactErrors.length > 0 || this.publishErrors.length > 0

        if(weHadAnError) {
            console.log("Fetch errors: " + JSON.stringify(this.fetchErrors, null, 2))
            console.log("Redact errors: " + JSON.stringify(this.redactErrors, null, 2))
            console.log("Publish errors: " + JSON.stringify(this.publishErrors, null, 2))
        } else {
            console.log("Successfully published all articles!!")
        }

        if(this.mode === "debug") {
            console.log("Expected errors: " + JSON.stringify(this.expectedErrors, null, 2))
        }
    }

    run = async () => {
        console.log("Fetching article URLs from sources...")
        const articlesInfo = await this.researcher.gatherEvents()
        console.log("Organizing into unique titles")
        const uniqueTitles = this.organizeReports(articlesInfo)
        console.log("Grouping similar articles using embeddings and the agent")
        const articleGroups = await this.agent.groupArticles(uniqueTitles)
        console.log("Fetching news content from sources, grouped by similarity")
        const sourcedNews = await this.researcher.fetchNews(articlesInfo, articleGroups)
        console.log("Drafting news articles using the agent and the news editor")
        const readyToPublishNotes = await this.writeNews(sourcedNews.articles)
        console.log("Publishing drafted news articles")
        const publishResults = await this.publisher.publish(readyToPublishNotes)

        this.fetchErrors.push(...sourcedNews.errors)

        publishResults.forEach((publishResult) => {
            buildSuccessFrom(publishResult.storageAttempt, (storageError) => this.publishErrors.push(storageError))
        })

        this.logResults()
    }
}