import { NewsSource } from "../sources/source-interface";
import { SourceName } from "../symbols/constants";
import { ArticlesInfo, ArticleTitle } from "../symbols/entities";
import { GeneralError, theParsedErrorFromThe } from "../symbols/error-models";
import { failedThe, resolveThe } from "../symbols/functors";

export class Application {
    constructor(private readonly sources: NewsSource[]) {}

    private logInfo = (x: object) => {
        try{
            console.log(JSON.stringify(x, null, 4))
        } catch {
            console.log("Could not stringify log object")
            console.log(x)
        }
    }

    private logError = (x: object) => {
        try{
            console.error(JSON.stringify(x, null, 4))
        } catch {
            console.log("Could not stringify error object")
            console.error(x)
        }
    }

    private parseTheErrorFromThe = (x: GeneralError) =>{
        console.log(theParsedErrorFromThe(x, this.logError))
    }

    private organizeTitles = (name: SourceName, titles: ArticleTitle[], articlesInfo: ArticlesInfo) => {
        articlesInfo[name] = titles
    }
    
     run = async () => {
        const articlesInfo: ArticlesInfo = {};
        await Promise.all(this.sources.map(async source => {
            const fetchTitlesAttempt = await source.getTitles()
            resolveThe(fetchTitlesAttempt, 
                (fetched) => this.organizeTitles(source.name, fetched.titles, articlesInfo),
                (erroredFetch) => this.parseTheErrorFromThe(erroredFetch)
             )
        }))
        return articlesInfo
    }
}