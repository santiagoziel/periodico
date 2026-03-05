import { ArticleIdentifier, NewsEvent, RawArticlePayload } from "../symbols/entities";
import { AttemptToFetch } from "../symbols/functors";
        
export interface NewsSource {
    name: string;
    readonly earliestDate: Date;

    requiresSequential?: boolean;
    getTitles(): AttemptToFetch<{titles: NewsEvent[]}>
    fetchArticle(articleInfo: ArticleIdentifier): AttemptToFetch<RawArticlePayload>
}