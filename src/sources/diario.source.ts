import { VIPs } from "../symbols/constants";
import { ArticleIdentifier, ArticleTitle } from "../symbols/entities";
import { knownError, unknownError } from "../symbols/error-models";
import { failure, success } from "../symbols/functors";
import { NewsSource } from "./source-interface";
import * as cheerio from "cheerio";

export class DiarioSource implements NewsSource {
    name = "Intolerancia Diario";

    private removeNonRelevanttTitles = (titles: ArticleTitle[]) => {
        const mexicoDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Mexico_City',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date());

        // mexicoDate is "YYYY-MM-DD", e.g. "2026-02-25"
        const [year, month, day] = mexicoDate.split('-');
        const urlDateSegment = `/${year}/${month}/${day}/`;

        return titles.filter(title => title.url.includes(urlDateSegment));
    }

    getTitles = async () => {
        const policySourceLink = "https://intoleranciadiario.com/section/politica";
        const policySectionResponse = await fetch(policySourceLink);
        if (!policySectionResponse.ok) {
            return failure(knownError(`HTTP error! Status: ${policySectionResponse.status}`, policySectionResponse))
        }

        const policySectionHtml = await policySectionResponse.text();

        const $ = cheerio.load(policySectionHtml);

        const policyLinks: ArticleTitle[] = [];
        const baseUrl = "https://intoleranciadiario.com";

        // Find all article links - looking for links within article cards/items
        $("a[href*='/articles/']").each((_, element) => {
            const $el = $(element);
            const href = $el.attr("href");
            const title = $el.text().trim();

            if (href && title && title.length > 10) {
            // Filter out short/navigation texts
            const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;

            // Avoid duplicates
            if (!policyLinks.some((a) => a.url === fullUrl)) {
                policyLinks.push({
                title: title,
                url: fullUrl,
                });
            }
            }
        });
        
        return success({titles: this.removeNonRelevanttTitles(policyLinks)})
    }

    fetchArticle = async (articleInfo: ArticleIdentifier) => {
        try {
            const response = await fetch(articleInfo.url);
            if (!response.ok) {
                return failure(knownError(`HTTP error! Status: ${response.status}`, response))
            }
            const articleHtml = await response.text();
            const $ = cheerio.load(articleHtml);

            const paragraphs = $("article, .article-content, .entry-content, main")
                .find("p")
                .map((_, el) => $(el).text().trim())
                .get()
                .filter((text) => text.length > 0);

            if (paragraphs.length < 1) {
                return failure(knownError(`Intolerancia diario ${articleInfo} fetch worked but parsing got empty paragraphs`))
            }

            const content = paragraphs.join("\n\n");

            const relevantPersons = VIPs.filter(person => content.toLowerCase().includes(person.toLowerCase()));

            return success({content, url: articleInfo.url, relevantPersons})
        } catch (error) {
            return failure(unknownError(error as Error, `Error fetching article ${articleInfo.url}`))      
        }
    }
}