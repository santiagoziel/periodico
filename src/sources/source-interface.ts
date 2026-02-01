import { SourceName } from "../constants";
import { ArticleIdentifier, ArticleTitle, RawArticlePayload } from "../entities";
import { AttemptToFetch } from "../functors";
        
export interface NewsSource {
    name: SourceName;
    getTitles(): AttemptToFetch<{titles: ArticleTitle[]}>
    fetchArticle(articleInfo: ArticleIdentifier): AttemptToFetch<RawArticlePayload>
}