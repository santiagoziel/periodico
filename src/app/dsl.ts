import { SourceName } from "../symbols/constants"
import { ArticleTitle, ArticlesInfo } from "../symbols/entities"
import { GeneralError, theParsedErrorFromThe, errorWithContext } from "../symbols/error-models"

export class DSL {
    logInfo = (x: object) => {
        try{
            console.log(JSON.stringify(x, null, 4))
        } catch {
            console.log("Could not stringify log object")
            console.log(x)
        }
    }

    logError = (x: object, context?: string) => {
        try{
            context ?
            console.error(JSON.stringify({context, error: x}, null, 4)):
            console.error(JSON.stringify(x, null, 4))
        } catch {
            console.log("Could not stringify error object")
            console.error(x)
        }
    }

    parseTheErrorFromThe = (x: GeneralError, context?: string) =>{
        context ?
        console.log(theParsedErrorFromThe(errorWithContext(context, x), (error) => this.logError(error, context))):
        console.log(theParsedErrorFromThe(x, this.logError))
    }

    organizeTitles = (name: SourceName, titles: ArticleTitle[], articlesInfo: ArticlesInfo) => {
        articlesInfo[name] = titles
    }
}