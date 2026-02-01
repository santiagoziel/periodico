import { SourceName } from "../constants";
import { ArticleTitle } from "../entities";

export interface NewsSource {
    name: SourceName;
    getTitles(): Promise<ArticleTitle[]>
}