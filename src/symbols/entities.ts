import { SourceName } from "./constants";

export type ArticleTitle = {
    url: string,
    title: string
}

export type ArticlesInfo = Partial<Record<SourceName, ArticleTitle[]>>

export type UniqueTitle = {
    source: SourceName,
    title: string
}

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