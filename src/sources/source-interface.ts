import { SourceName } from "../symbols/constants";
import { ArticleIdentifier, ArticleTitle, RawArticlePayload } from "../symbols/entities";
import { AttemptToFetch } from "../symbols/functors";
        
export interface NewsSource {
    name: SourceName;
    getTitles(): AttemptToFetch<{titles: ArticleTitle[]}>
    fetchArticle(articleInfo: ArticleIdentifier): AttemptToFetch<RawArticlePayload>
}