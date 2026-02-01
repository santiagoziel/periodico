import { ArticleIdentifier } from "../../symbols/entities"
import { knownError } from "../../symbols/error-models"
import { failure, success } from "../../symbols/functors"
import { NewsSource } from "../source-interface"

export const dummySource2: NewsSource = {
    name: "dummy2",
    getTitles: async () => {
        //return failure(knownError("No titles found", {payload: "test error"}))
        return success({titles: [{url: "https://www.google.com", title: "Google2"}, {url: "https://www.facebook.com", title: "Facebook2"}]})
    },

    fetchArticle: async (articleInfo: ArticleIdentifier) => {
        return success({facts: "Google is a search engine", url: articleInfo.url})
    }
}