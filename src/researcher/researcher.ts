import { NewsSource } from "../sources/source-interface";
import { ArticleIdentifier, NewsEvents, UniqueTitle, Investigation, ProcessSingleArticleInput, TitleGroup, FetchArticleAttempt, ProcessArticleInput, SourcedArticlePayload, EmbeddedArticleTitles, ProcessUnionArticleInput } from "../symbols/entities";
import { resolveThe, AttemptToFetch, failure, attemptTo } from "../symbols/functors";
import { GeneralError, knownError, weExpectedThisInThe } from "../symbols/error-models";
import { DSL } from "./dsl";
import pLimit from "p-limit";
import { MAX_CONCURRENT_FETCHES } from "../symbols/constants";

export class Researcher {

    private readonly fetchLimit = pLimit(MAX_CONCURRENT_FETCHES);
    constructor(private readonly sources: NewsSource[], private readonly dsl: DSL) {}

    gatherEvents = async (): Promise<NewsEvents> => {
            const articlesInfo: NewsEvents = {};
            await Promise.all(this.sources.map(async source => {
                const fetchTitlesAttempt = await source.getTitles()
                resolveThe(fetchTitlesAttempt, 
                    (fetched) => this.dsl.organizeTitles(source.name, fetched.titles, articlesInfo),
                    (erroredFetch) => this.dsl.parseTheErrorFromThe(erroredFetch, `Could not fetch titles from ${source.name}`)
                 )
            }))
            return articlesInfo
    }

    researchNote = async (articleIdentifier: ArticleIdentifier): AttemptToFetch<SourcedArticlePayload> => {
            const source = this.sources.find(source => source.name === articleIdentifier.source)
            if (!source) {
                const error = knownError(`Source not found for identifier ${JSON.stringify(articleIdentifier, null, 2)}`)
                return failure(error)
             }
    
             const articleAttempt = await source.fetchArticle(articleIdentifier)
             return attemptTo((payload) => ({...payload, source: source.name}), articleAttempt)
    }

    private sourceRequiresSequential = (sourceName: string): boolean => {
        const source = this.sources.find(s => s.name === sourceName)
        return source?.requiresSequential ?? false
    }

    gatherData = async (articleIdentifiers: ArticleIdentifier[]): Promise<FetchArticleAttempt[]> => {
        const sequentialNotes: ArticleIdentifier[] = []
        const parallelNotes: ArticleIdentifier[] = []

        for (const id of articleIdentifiers) {
            if (this.sourceRequiresSequential(id.source)) {
                sequentialNotes.push(id)
            } else {
                parallelNotes.push(id)
            }
        }

        const parallelInvestigations = await Promise.all(
            parallelNotes.map(id => this.fetchLimit(() => this.researchNote(id)))
        )

        const sequentialInvestigations: FetchArticleAttempt[] = []
        for (const id of sequentialNotes) {
            const investigation = await this.researchNote(id)
            sequentialInvestigations.push(investigation)
        }

        const resultsMap = new Map<string, FetchArticleAttempt>()
        
        parallelNotes.forEach((id, idx) => resultsMap.set(id.url, parallelInvestigations[idx]))
        sequentialNotes.forEach((id, idx) => resultsMap.set(id.url, sequentialInvestigations[idx]))

        return articleIdentifiers.map(id => resultsMap.get(id.url)!)
    }
    

    discardFailedInvestigations = async (investigations: FetchArticleAttempt[]): Promise<Investigation> => {
        const stories: SourcedArticlePayload[] = []
        const errors: GeneralError[] = []
        investigations.forEach(investigation => 
            resolveThe(investigation,
                (story) => stories.push(story),
                (failedReport) => errors.push(failedReport)
        ))
        return { stories, errors }
    }

    investigate = async (relatedArticles: TitleGroup, articlesInfo: NewsEvents): Promise<Investigation> => {
        const articleIdentifiers = relatedArticles.map((articleTitle) => this.dsl.buildArticleId(articlesInfo, articleTitle))
        const investigationAttempts = await this.gatherData(articleIdentifiers)
        return this.discardFailedInvestigations(investigationAttempts)
    }

    researchNoteFromMultipleEvents = async (relatedArticles: TitleGroup, articlesInfo: NewsEvents): Promise<{story: ProcessUnionArticleInput, errors: GeneralError[]}> => {
        const investigation = await this.investigate(relatedArticles, articlesInfo)
        const story = this.dsl.buildUnionUploadPayload(investigation.stories)
        return { story, errors: investigation.errors }
    }

    researchSingleEventNotes = async (singleEvents: TitleGroup, articlesInfo: NewsEvents): Promise<{stories: ProcessSingleArticleInput[], errors: GeneralError[]}> => {
        const investigation = await this.investigate(singleEvents, articlesInfo)
        const stories = investigation.stories.map((payload) => this.dsl.buildSingleUploadPayload(payload))
        return { stories, errors: investigation.errors }
    }

    fetchNews = async (articlesInfo: NewsEvents, articleGroups: EmbeddedArticleTitles): Promise<{articles: ProcessArticleInput[], errors: GeneralError[]}> =>{
        const unionNewsPayloads =  await Promise.all(
                articleGroups.union.map(async (articleGroup) => this.researchNoteFromMultipleEvents(articleGroup, articlesInfo)
            ))

        const singleNewsPayloads = await this.researchSingleEventNotes(articleGroups.single, articlesInfo)

        const articles = [...unionNewsPayloads.map(payload => payload.story), ...singleNewsPayloads.stories]
        const errors = [...unionNewsPayloads.flatMap(payload => payload.errors), ...singleNewsPayloads.errors]
        return { articles, errors }
    }
}   