import { VIPs } from "../symbols/constants";
import { ArticleIdentifier, NewsEvent } from "../symbols/entities";
import { knownError, unknownError } from "../symbols/error-models";
import { failure, success } from "../symbols/functors";
import { NewsSource } from "./source-interface";
import * as cheerio from "cheerio";

export class HorasSource implements NewsSource {
    name = "24 Horas Puebla";

    constructor(public readonly earliestDate: Date) {}

    private removeNonRelevantTitles = (titles: NewsEvent[]) => {
        const earliestDateStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Mexico_City',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(this.earliestDate);

        return titles.filter(title => {
            const match = title.url.match(/\/(\d{4})\/(\d{2})\//);
            if (!match) return false;
            const urlYearMonth = `${match[1]}-${match[2]}`;
            const earliestYearMonth = earliestDateStr.substring(0, 7);
            return urlYearMonth >= earliestYearMonth;
        });
    }

    getTitles = async () => {
        const sourceLink = "https://24horaspuebla.com/category/puebla/";
        const response = await fetch(sourceLink);
        if (!response.ok) {
            return failure(knownError(`HTTP error! Status: ${response.status}`, response))
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const articles: NewsEvent[] = [];

        $("article.entry").each((_, element) => {
            const $el = $(element);
            const $link = $el.find("h2.entry-title a").first();
            const href = $link.attr("href");
            const title = $link.text().trim();

            if (href && title && title.length > 10) {
                if (!articles.some((a) => a.url === href)) {
                    articles.push({ title, url: href });
                }
            }
        });

        return success({ titles: this.removeNonRelevantTitles(articles) })
    }

    fetchArticle = async (articleInfo: ArticleIdentifier) => {
        try {
            const response = await fetch(articleInfo.url);
            if (!response.ok) {
                return failure(knownError(`HTTP error! Status: ${response.status}`, response))
            }
            const articleHtml = await response.text();
            const $ = cheerio.load(articleHtml);

            const paragraphs = $(".entry-content p")
                .map((_, el) => $(el).text().trim())
                .get()
                .filter((text) => text.length > 0 && !text.includes("te va a interesar"));

            if (paragraphs.length < 1) {
                return failure(knownError(`24 Horas ${articleInfo.url} fetch worked but parsing got empty paragraphs`))
            }

            const content = paragraphs.join("\n\n");

            const relevantPersons = VIPs.filter(person => content.toLowerCase().includes(person.toLowerCase()));

            return success({ content, url: articleInfo.url, relevantPersons })
        } catch (error) {
            return failure(unknownError(error as Error, `Error fetching article ${articleInfo.url}`))
        }
    }
}
