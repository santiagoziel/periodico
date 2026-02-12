import { GeneralError } from "./error-models"
import { Attempt } from "./functors"

export type ArticleTitle = {
    url: string,
    title: string
}

export type SourceName = string

export type ArticlesInfo = Record<SourceName, ArticleTitle[]>

export type UniqueTitle = {
    source: string,
    title: string
}

export type PonderedTitle = {embedding: number[], title: UniqueTitle}
export type PonderedTitles = PonderedTitle[]

export type TitleGroup = UniqueTitle[]

export type EmbeddedArticleTitles = {
    union: TitleGroup[],
    single: TitleGroup
}

export type ArticleIdentifier = {
    source: SourceName;
    title: string;
    url: string;
  };

export type RawArticlePayload = {
    content: string,
    url: string, //just to attach at the end, the call has been made already
    relevantPersons?: string[]
}

export type FetchArticleAttempt = Attempt<RawArticlePayload, GeneralError>

export type UnionArticlePayload = RawArticlePayload[]

export type ProcessSingleArticleInput = {
    type: "single",
    content: string,
    url: string,
    relevantPersons?: string[]
}

export type ProcessUnionArticleInput = {
    type: "union",
    contents: string[],
    urls: string[],
    relevantPersons?: string[]
}

export type ProcessArticleInput = ProcessSingleArticleInput | ProcessUnionArticleInput

export type DraftArticle = {
    facts: string[],
    type: "single" | "union",
    relevantPersons?: string[]
    urlSection: string
}

export type NoteSections = {
    title: string, 
    note: string, 
    urlSection: string, 
    relevantPersons?: string[]
}

export type FinalDraftArticle = NoteSections & {
    file: Buffer,
}

export type PublishReadyArticle = {
    title: string,
    file: Buffer,
    filePath: string
}