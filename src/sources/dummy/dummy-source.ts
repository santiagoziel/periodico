import { ArticleIdentifier } from "../../symbols/entities"
import { success } from "../../symbols/functors"
import { NewsSource } from "../source-interface"

export const dummySource: NewsSource = {
    name: "dummy",
    getTitles: async () => {
        return success({titles: [
            {url: "https://www.google.com", title: "Google"},
            {url: "https://www.facebook.com", title: "Facebook"},
            {url: "https://www.twitter.com", title: "Twitter"},
            {url: "https://www.instagram.com", title: "Instagram"},
            {url: "https://www.linkedin.com", title: "LinkedIn"},
            {url: "https://www.youtube.com", title: "YouTube"},
            {url: "https://www.pinterest.com", title: "Pinterest"},
            {url: "https://www.reddit.com", title: "Reddit"}]})
    },

    fetchArticle: async (articleInfo: ArticleIdentifier) => {
        return success({facts: "Google is a search engine", url: articleInfo.url})
    }
}