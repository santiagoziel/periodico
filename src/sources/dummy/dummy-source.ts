import { ArticleIdentifier } from "../../symbols/entities"
import { success } from "../../symbols/functors"
import { NewsSource } from "../source-interface"

export const dummySource: NewsSource = {
    name: "dummy",
    getTitles: async () => {
        return success({titles: [
            {url: "https://dummy1.com/news/1", title: "Terremoto de magnitud 6.5 sacude la costa de Oaxaca"},
            {url: "https://dummy1.com/news/2", title: "El peso mexicano alcanza su mejor nivel en 5 años"},
            {url: "https://dummy1.com/news/3", title: "Inauguran nueva línea del metro en la Ciudad de México"},
            {url: "https://dummy1.com/news/4", title: "Selección mexicana vence 3-1 a Estados Unidos en partido amistoso"},
        ]})
    },

    fetchArticle: async (articleInfo: ArticleIdentifier) => {
        return success({facts: `Contenido del artículo ${articleInfo.title} for source ${articleInfo.source}`, url: articleInfo.url})
    }
}