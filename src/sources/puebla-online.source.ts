import * as cheerio from "cheerio";
import { Browser } from "playwright";
import { ArticleIdentifier, ArticleTitle } from "../symbols/entities";
import { knownError, unknownError } from "../symbols/error-models";
import { failure, success } from "../symbols/functors";
import { NewsSource } from "./source-interface";
import { VIPs } from "../symbols/constants";

export class PueblaOnlineSource implements NewsSource {
    name = "Puebla Online";
    requiresSequential = true;

    private readonly browserContextOptions = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'es-MX',
    } as const;

    constructor(private readonly browser: Browser) {}

    getTitles = async () => {
        const publicacionesSourceLink = "https://www.pueblaonline.com.mx/2026/puebla/";
        const context = await this.browser.newContext(this.browserContextOptions);
        
        try {
            const page = await context.newPage();
            
            console.log(`Navigating to ${publicacionesSourceLink}...`);
            await page.goto(publicacionesSourceLink, { waitUntil: 'networkidle' });
            
            console.log(`Page loaded successfully`);
    
            const html = await page.content();
            const $ = cheerio.load(html);
    
            const articles: ArticleTitle[] = [];
            const baseUrl = "https://www.pueblaonline.com.mx";
    
            // Find all article links - Puebla Online uses links within article titles/cards
            // Articles typically have URLs like /2026/puebla/article-slug/
            $("a[href*='/2026/puebla/']").each((_, element) => {
                const $el = $(element);
                const href = $el.attr("href");
                const title = $el.text().trim();
    
                // Filter for actual article links with meaningful titles
                if (href && title && title.length > 10) {
                    const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
    
                    // Avoid duplicates and the main section URL itself
                    if (!articles.some((a) => a.url === fullUrl) && fullUrl !== publicacionesSourceLink) {
                        articles.push({
                            title: title,
                            url: fullUrl,
                        });
                    }
                }
            });
    
            console.log(`Found ${articles.length} Puebla Online article links`);
            return success({titles: articles});
        } catch (error) {
            console.error("Error fetching Puebla Online article links:", error);
            return failure(unknownError(error as Error, "Error fetching Puebla Online article links"));
        } finally {
            await context.close();
        }
    }

    fetchArticle = async (articleInfo: ArticleIdentifier) => {
        const context = await this.browser.newContext(this.browserContextOptions);
        
        try {
            const page = await context.newPage();
            
            console.log(`Navigating to ${articleInfo.url}...`);
            await page.goto(articleInfo.url, { waitUntil: 'networkidle' });
            
            console.log(`Page loaded successfully`);
        
            const html = await page.content();
            const $ = cheerio.load(html);
        
            $("script, style, nav, header, footer, aside").remove();
           
            const paragraphs = $("article, .article-content, .entry-content, main")
              .find("p")
              .map((_, el) => $(el).text().trim())
              .get()
              .filter((text) => text.length > 0);
            
            if (paragraphs.length < 1) {
                return failure(knownError(`Puebla Online ${articleInfo} fetch worked but parsing got empty paragraphs`))
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