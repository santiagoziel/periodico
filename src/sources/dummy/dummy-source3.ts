import { ArticleIdentifier } from "../../symbols/entities"
import { success } from "../../symbols/functors"
import { NewsSource } from "../source-interface"

export const dummySource3: NewsSource = {
    name: "dummy3",
    getTitles: async () => {
        return success({titles: [
            {url: "https://example.com/news/9", title: "Sismo de gran magnitud registrado en las costas oaxaqueñas"},
            {url: "https://example.com/news/10", title: "La moneda mexicana se fortalece frente al dólar estadounidense"},
            {url: "https://example.com/news/11", title: "Triunfo del Tri: México gana 3-1 contra la selección americana"},
            {url: "https://example.com/news/12", title: "Crisis de agua potable afecta a colonias del norte de Monterrey"},
        ]})
    },

    fetchArticle: async (articleInfo: ArticleIdentifier) => {
        return success({facts: "Contenido del artículo de noticias", url: articleInfo.url})
    }
}
