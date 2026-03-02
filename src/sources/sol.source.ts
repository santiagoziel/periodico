import * as cheerio from "cheerio";
import { Browser } from "playwright";
import { ArticleIdentifier, ArticleTitle } from "../symbols/entities";
import { expectedError, knownError, unknownError } from "../symbols/error-models";
import { failure, success } from "../symbols/functors";
import { NewsSource } from "./source-interface";
import { VIPs } from "../symbols/constants";

export class SolSource implements NewsSource {
    name = "Sol de Puebla";
    requiresSequential = true;

    private readonly browserContextOptions = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'es-MX',
    } as const;

    constructor(private readonly browser: Browser, public readonly earliestDate: Date) {}

    private getEarliestDateStr = () => new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(this.earliestDate);

    getTitles = async () => {
        const sourceUrl = "https://oem.com.mx/elsoldepuebla/local/";
        const response = await fetch(sourceUrl);
        if (!response.ok) {
            return failure(knownError(`HTTP error! Status: ${response.status}`, response))
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const baseUrl = "https://oem.com.mx";
        const titles: ArticleTitle[] = [];

        $("a[href*='/elsoldepuebla/']").each((_, element) => {
            const $el = $(element);
            const href = $el.attr("href");
            const title = $el.attr("title") || $el.find("h3").first().text().trim() || $el.text().trim();

            if (href && title && title.length > 10 && /\d+$/.test(href)) {
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
        const context = await this.browser.newContext(this.browserContextOptions);

        try {
            const page = await context.newPage();
            await page.goto(articleInfo.url, { waitUntil: "domcontentloaded" });
            await page.waitForSelector("#ev-content p", { timeout: 10000 });

            const html = await page.content();
            const $ = cheerio.load(html);

            let datePublished: string | null = null;
            $('script[type="application/ld+json"]').each((_, el) => {
                try {
                    const json = JSON.parse($(el).text());
                    if (json.datePublished) {
                        datePublished = json.datePublished;
                    }
                } catch {
                    // ignore malformed JSON-LD
                }
            });

            if (datePublished) {
                const articleDate = (datePublished as string).split("T")[0];
                const earliestDateStr = this.getEarliestDateStr();
                if (articleDate < earliestDateStr) {
                    return failure(expectedError(`Sol de Puebla: skipping article from ${articleDate}`));
                }
            }

            $("script, style, nav, header, footer, aside").remove();

            const paragraphs = $("#ev-content p, #ev-content blockquote")
                .map((_, el) => $(el).text().trim())
                .get()
                .filter((text) => text.length > 0 && !text.startsWith("➡️"));

            if (paragraphs.length < 1) {
                return failure(knownError(`Sol de Puebla ${articleInfo.url} fetch worked but parsing got empty paragraphs`))
            }

            const content = paragraphs.join("\n\n");

            const relevantPersons = VIPs.filter(person => content.toLowerCase().includes(person.toLowerCase()));

            return success({content, url: articleInfo.url, relevantPersons})
        } catch (error) {
            return failure(unknownError(error as Error, `Error fetching article ${articleInfo.url}`))
        } finally {
            await context.close();
        }
    }
}
