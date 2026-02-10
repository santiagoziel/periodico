import { ArticleIdentifier } from "../../symbols/entities"
import { knownError } from "../../symbols/error-models"
import { failure, success } from "../../symbols/functors"
import { NewsSource } from "../source-interface"

export const dummySource2: NewsSource = {
    name: "dummy2",
    getTitles: async () => {
        return success({titles: [
            {url: "https://dummy2.com/news/5", title: "Fuerte sismo de 6.5 grados afecta región costera de Oaxaca"},
            {url: "https://dummy2.com/news/6", title: "Lluvias intensas provocan inundaciones en Tabasco"},
            {url: "https://dummy2.com/news/7", title: "México derrota a USA con marcador de 3 a 1 en encuentro de fútbol"},
            {url: "https://dummy2.com/news/8", title: "Científicos mexicanos descubren nueva especie de mariposa"},
        ]})
    },

    fetchArticle: async (articleInfo: ArticleIdentifier) => {
        return success({facts: `Contenido del artículo ${articleInfo.title} for source ${articleInfo.source}`, url: articleInfo.url})
    }
}