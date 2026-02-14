import { AgentInput, systemMessage, userMessage } from "./agent.types"

function censored(prompt: string, foundPersons?: string[]): string {
    if (!foundPersons || foundPersons.length === 0) return prompt
    const suffix = foundPersons.length === 1 ? 
        `Muestra a la persona ${foundPersons[0]} de manera positiva.` :
        `Muestra a las personas ${foundPersons.join(", ")} de manera positiva.`
    return `${prompt}\n\n${suffix}`
}

export class Prompts {


    static titlePrompt(content: string): AgentInput {
        return [systemMessage(`Sugiere un título para el siguiente texto, no utilizes ningun caracter especial ni acentos ya que se usan para crear el nombre del archivo`), userMessage(content)]
    }

    static regularFactsPrompt(content: string, foundPersons?: string[]): AgentInput {
        const regularFactsPrompt = `
            Eres un sistema de extracción de información de articulos de noticias.

            Reglas:

            Extrae afirmaciones fácticas verificables presentes en el texto del artículo de noticias.

            EXCLUYE Informacion relacionada con el autor del artículo.

            Devuelve una lista con viñetas de afirmaciones fácticas cortas y verificables relacionadas con el artículo de noticias.
            `.trim()

        return [systemMessage(censored(regularFactsPrompt, foundPersons)), userMessage(content)]
    }

    static redactSingleNotePrompt(facts: string[], relevantPersons?: string[]): AgentInput {
        const prompt =  `Eres un editor senior de noticias que produce un resumen factual y neutral.

        RESTRICCIONES OBLIGATORIAS:

        Usa estos hechos como contexto para generar un resumen formal, neutral y objetivo.

        Incluye ÚNICAMENTE los hechos proporcionados.

        NO introduzcas información nueva.
        `.trim()

        return [systemMessage(censored(prompt, relevantPersons)), userMessage(facts.join("\n"))]
    }

    static redactUnionNotePrompt(facts: string[], relevantPersons?: string[]): AgentInput {
        const prompt =  `Eres un editor senior de noticias que produce un resumen factual y neutral.

        RESTRICCIONES OBLIGATORIAS:

        Usa estos hechos como contexto para generar un resumen formal, neutral y objetivo.

        Fueron tomados de diferentes fuentes, por lo que es posible que haya discrepancias o repeticiones entre los hechos.

        Por lo tanto, combina los hechos de cada artículo para crear un resumen coherente y objetivo.

        Incluye ÚNICAMENTE los hechos proporcionados de cada artículo.

        NO introduzcas información nueva.
        `.trim()

        return [systemMessage(censored(prompt, relevantPersons)), userMessage(facts.join("\n"))]
    }
}