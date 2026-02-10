import { OpenAI } from "openai";
import { EmbeddedArticleTitles, PonderedTitles, TitleGroup, UniqueTitle } from "../symbols/entities";
import "dotenv/config"
import { MAIN_THRESHOLD, SECONDARY_THRESHOLD } from "../symbols/constants";

export class Agent {
    private client = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

    private getEmbeddings = async (texts: string[]): Promise<number[][]> => {
        const response = await this.client.embeddings.create({
            model: "text-embedding-3-small",
            input: texts,
        })
        return response.data.map(d => d.embedding)
    }

    //https://en.wikipedia.org/wiki/Cosine_similarity
    private cosineSimilarity = (a: number[], b: number[]): number => {
        let dot = 0;
        let normA = 0;
        let normB = 0;
      
        for (let i = 0; i < a.length; i++) {
          dot += a[i] * b[i];
          normA += a[i] * a[i];
          normB += b[i] * b[i];
        }
      
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
      }

    groupArticles = async (articles: UniqueTitle[]): Promise<EmbeddedArticleTitles> => {
        const embeddings = await this.getEmbeddings(articles.map(article => article.title))

        const PonderedTitles: PonderedTitles = []
        for (let i = 0; i < embeddings.length; i++) {
            PonderedTitles.push({
                title: articles[i],
                embedding: embeddings[i],
            })
        }

        const groupsByAnchor: Record<number, PonderedTitles> = {}
        const groupedIndexes: Set<number> = new Set()
        const nearMatchesGroups: Record<number, number[]> = {}
    
        for (let anchorIndex = 0; anchorIndex < embeddings.length; anchorIndex++) {
            if (groupedIndexes.has(anchorIndex)) continue
            
            const anchor = PonderedTitles[anchorIndex]
            const anchorGroup: PonderedTitles = [anchor]

            for (let sampleIndex = anchorIndex + 1; sampleIndex < embeddings.length; sampleIndex++) {
                if (groupedIndexes.has(sampleIndex)) continue

                const sample = PonderedTitles[sampleIndex]
                const similarity = this.cosineSimilarity(anchor.embedding, sample.embedding)
                
                if (similarity > MAIN_THRESHOLD) {
                    anchorGroup.push(PonderedTitles[sampleIndex])
                    groupedIndexes.add(sampleIndex)
                } else if (similarity > SECONDARY_THRESHOLD) {
                    nearMatchesGroups[anchorIndex] = [...(nearMatchesGroups[anchorIndex] || [] ), sampleIndex]
                }
            }

            if(anchorGroup.length > 1) {
                groupsByAnchor[anchorIndex] = anchorGroup
                groupedIndexes.add(anchorIndex)
            }
        }

        (Object.entries(nearMatchesGroups)).forEach(([anchorIndex, nearMatches]) => {
            const anchorGroup = groupsByAnchor[Number(anchorIndex)]
            if(anchorGroup) {
                nearMatches.forEach((nearMatchIndex) => {
                    const fits = anchorGroup.some((groupSample) =>{
                        const similarity = this.cosineSimilarity(PonderedTitles[nearMatchIndex].embedding, groupSample.embedding)
                        return similarity > MAIN_THRESHOLD
                    })
                    if(fits) {
                        groupsByAnchor[Number(anchorIndex)].push(PonderedTitles[nearMatchIndex])
                        groupedIndexes.add(nearMatchIndex)
                    }
                })
            }
        })

        const ungrouped: UniqueTitle[] = articles.filter(article => !groupedIndexes.has(articles.indexOf(article)))

        return {
            union: Object.values(groupsByAnchor).map(group => group.map(sample => sample.title)),
            single: ungrouped
        }
            
    }
}