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
    facts: string,
    url: string, //just to attach at the end, the call has been made already
    relevantPersons?: string[]
}

export type FetchArticleAttempt = Attempt<RawArticlePayload, GeneralError>

export type UnionArticlePayload = RawArticlePayload[]

export type ProcessSingleArticleInput = {
    type: "single",
    facts: string,
    url: string,
    relevantPersons?: string[]
}

export type ProcessUnionArticleInput = {
    type: "union",
    facts: string[],
    urls: string[],
    relevantPersons?: string[]
}

export type ProcessArticleInput = ProcessSingleArticleInput | ProcessUnionArticleInput

export type ProcessedArticle = {
    processedTile: string,
    text: string,
    personName?: string
}