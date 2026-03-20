import { VIPs } from "../symbols/constants";
import { ArticleIdentifier, NewsEvent } from "../symbols/entities";
import { expectedError, knownError, unknownError } from "../symbols/error-models";
import { failure, success } from "../symbols/functors";
import { NewsSource } from "./source-interface";
import * as cheerio from "cheerio";

export class MilenioSource implements NewsSource {
    name = "Milenio";

    constructor(public readonly earliestDate: Date) {}

    private getEarliestDateStr = () => new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(this.earliestDate);

    getTitles = async () => {
        const sourceUrl = "https://www.milenio.com/puebla";
        const response = await fetch(sourceUrl);
        if (!response.ok) {
            return failure(knownError(`HTTP error! Status: ${response.status}`, response))
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const baseUrl = "https://www.milenio.com";
        const titles: NewsEvent[] = [];

        $(".sn-base-base a[href], .lr-list-row-row-medium a[href], .lr-list-row-row-bullet a[href]").each((_, element) => {
            const $el = $(element);
            const href = $el.attr("href");
            const title = $el.find("h2").first().text().trim() || $el.text().trim();

            if (href && title && title.length > 10) {
                const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;

                if (!titles.some((a) => a.url === fullUrl)) {
                    titles.push({
                        title,
                        url: fullUrl,
                    });
                }
            }
        });

        return success({titles})
    }

    fetchArticle = async (articleInfo: ArticleIdentifier) => {
        try {
            const response = await fetch(articleInfo.url);
            if (!response.ok) {
                return failure(knownError(`HTTP error! Status: ${response.status}`, response))
            }

            const html = await response.text();
            const $ = cheerio.load(html);

            const jsonLd: { datePublished?: string; articleBody?: string } = {};
            $('script[type="application/ld+json"]').each((_, el) => {
                try {
                    const json = JSON.parse($(el).text());
                    if (json.datePublished) jsonLd.datePublished = json.datePublished;
                    if (json.articleBody) jsonLd.articleBody = json.articleBody;
                } catch {
                    // ignore malformed JSON-LD
                }
            });

            if (jsonLd.datePublished) {
                const articleDate = jsonLd.datePublished.split("T")[0];
                const earliestDateStr = this.getEarliestDateStr();
                if (articleDate < earliestDateStr) {
                    return failure(expectedError(`Milenio: skipping article from ${articleDate}`));
                }
            }

            const htmlParagraphs = $("#content-body p")
                .map((_, el) => $(el).text().trim())
                .get()
                .filter((text) => text.length > 0);

            let paragraphs: string[];
            if (htmlParagraphs.length > 0) {
                paragraphs = htmlParagraphs;
            } else if (jsonLd.articleBody) {
                paragraphs = jsonLd.articleBody.split(/\n+/).filter((p) => p.trim().length > 0);
            } else {
                paragraphs = [];
            }

            if (paragraphs.length < 1) {
                return failure(knownError(`Milenio ${articleInfo.url} fetch worked but parsing got empty paragraphs`))
            }

            const content = paragraphs.join("\n\n");

            const relevantPersons = VIPs.filter(person => content.toLowerCase().includes(person.toLowerCase()));

            return success({content, url: articleInfo.url, relevantPersons})
        } catch (error) {
            return failure(unknownError(error as Error, `Error fetching article ${articleInfo.url}`))
        }
    }
}
