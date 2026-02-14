import { VIPs } from "../symbols/constants";
import { ArticleIdentifier, ArticleTitle } from "../symbols/entities";
import { knownError, unknownError } from "../symbols/error-models";
import { failure, success } from "../symbols/functors";
import { NewsSource } from "./source-interface";
import * as cheerio from "cheerio";

export class SintesisSource implements NewsSource {
    name = "Síntesis";

    getTitles = async () => {
        const gobiernoSourceLink = "https://sintesis.com.mx/puebla/category/gobierno/";
        const gobiernoSectionResponse = await fetch(gobiernoSourceLink);
        if (!gobiernoSectionResponse.ok) {
            return failure(knownError(`HTTP error! Status: ${gobiernoSectionResponse.status}`, gobiernoSectionResponse))
        }

        const gobiernoSectionHtml = await gobiernoSectionResponse.text();

        const $ = cheerio.load(gobiernoSectionHtml);

        const gobiernoLinks: ArticleTitle[] = [];
        const baseUrl = "https://sintesis.com.mx";

        // Find all article links - looking for links within article cards/items
        $("a[href*='/puebla/']").each((_, element) => {
            const $el = $(element);
            const href = $el.attr("href");
            const title = $el.text().trim();
      
            // Filter for actual article links (they contain date patterns like /2026/01/)
            // and have meaningful titles
            if (href && title && title.length > 10 && /\/\d{4}\/\d{2}\//.test(href)) {
              const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
      
              // Avoid duplicates
              if (!gobiernoLinks.some((a) => a.url === fullUrl)) {
                gobiernoLinks.push({
                  title: title,
                  url: fullUrl,
                });
              }
            }
          });
        
        return success({titles: gobiernoLinks})
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
                return failure(knownError(`Síntesis ${articleInfo} fetch worked but parsing got empty paragraphs`))
            }

            const content = paragraphs.join("\n\n");

            const relevantPersons = VIPs.filter(person => content.toLowerCase().includes(person.toLowerCase()));

            return success({content, url: articleInfo.url, relevantPersons})
        } catch (error) {
            return failure(unknownError(error as Error, `Error fetching article ${articleInfo.url}`))      
        }
    }
}