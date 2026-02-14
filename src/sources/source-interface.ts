import { ArticleIdentifier, ArticleTitle, RawArticlePayload } from "../symbols/entities";
import { AttemptToFetch } from "../symbols/functors";
        
export interface NewsSource {
    name: string;

    requiresSequential?: boolean;
    getTitles(): AttemptToFetch<{titles: ArticleTitle[]}>
    fetchArticle(articleInfo: ArticleIdentifier): AttemptToFetch<RawArticlePayload>
}