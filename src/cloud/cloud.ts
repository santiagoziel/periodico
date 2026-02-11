import { Agent } from "../agent/agent";
import { ProcessArticleInput, ProcessSingleArticleInput } from "../symbols/entities";
import { failedThe, payloadFromTheSuccessful } from "../symbols/functors";

export class Cloud {
    today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

    constructor(private readonly agent: Agent) {}

    private uploadSingleFile = async (uploadArticleInput: ProcessSingleArticleInput) => {
        const { facts, url, relevantPersons } = uploadArticleInput


        const suggestTitleAttempt = await this.agent.suggestTitle(facts)
        if(failedThe(suggestTitleAttempt)) {
            return suggestTitleAttempt
        }

        const {title} = payloadFromTheSuccessful(suggestTitleAttempt)

        if(relevantPersons && relevantPersons.length > 0) {
            const personName = relevantPersons[0]
            const filePath = `${this.today}/relevant-persons/${personName}/${title}`
            
        }

    }
 
    uploadFile = async (uploadArticleInput: ProcessArticleInput) => {

    }
}