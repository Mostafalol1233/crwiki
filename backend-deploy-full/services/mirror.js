import axios from 'axios';
import axiosRetry from 'axios-retry';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { storage } from '../storage.js';

// Setup axios with retries and timeout
const axiosInstance = axios.create({
    timeout: 30000, // 30 seconds timeout
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
});

axiosRetry(axiosInstance, { 
    retries: 5, // Increase retries
    retryDelay: (retryCount) => {
        console.log(`[MirrorService] Retry attempt #${retryCount}...`);
        return axiosRetry.exponentialDelay(retryCount);
    },
    retryCondition: (error) => {
        // Retry on timeout, network errors, or 429/502/503/504
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
               error.code === 'ECONNABORTED' || 
               error.code === 'ETIMEDOUT' ||
               [429, 502, 503, 504].includes(error.response?.status);
    }
});

const MIRROR_DIR = path.resolve('backend-deploy-full/uploads/mirrored');
if (!fs.existsSync(MIRROR_DIR)) {
    fs.mkdirSync(MIRROR_DIR, { recursive: true });
}

export class Fetcher {
    static async get(url, options = {}) {
        const headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://crossfire.z8games.com/',
            ...options.headers
        };

        try {
            const response = await axiosInstance.get(url, { headers, ...options });
            return new Selector(response.data, url);
        } catch (error) {
            console.error(`[Fetcher] Axios error for ${url}:`, error.message);
            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                throw new Error(`Connection timed out after 30s. The site might be blocking automated requests or is currently slow.`);
            }
            throw error;
        }
    }
}

export class StealthyFetcher extends Fetcher {
    static async fetch(url, options = {}) {
        const stealthHeaders = {
            'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            ...options.headers
        };
        return super.get(url, { ...options, headers: stealthHeaders });
    }
}

export class Selector {
    constructor(html, baseUrl) {
        this.$ = cheerio.load(html);
        this.baseUrl = baseUrl;
    }

    css(selector) {
        const results = this.$(selector);
        return {
            get: () => results.first().text().trim(),
            getall: () => results.map((i, el) => this.$(el).text().trim()).get(),
            attrib: (attr) => results.first().attr(attr),
            html: () => results.first().html(),
            map: (fn) => results.map((i, el) => fn(this.$(el))).get()
        };
    }

    xpath(path) {
        console.warn("XPath not fully supported in Node.js version of Scrapling, falling back to basic parsing.");
        return this.css(path); 
    }

    async mirrorAssets() {
        const images = this.$('img');
        for (let i = 0; i < images.length; i++) {
            const img = this.$(images[i]);
            const src = img.attr('src');
            if (src) {
                try {
                    const absoluteUrl = new URL(src, this.baseUrl).toString();
                    const localPath = await this.downloadAsset(absoluteUrl);
                    if (localPath) {
                        img.attr('src', `/uploads/mirrored/${localPath}`);
                        img.attr('data-mirrored', 'true');
                    }
                } catch (e) {
                    console.error(`Failed to mirror image: ${src}`, e.message);
                }
            }
        }

        const links = this.$('a');
        for (let i = 0; i < links.length; i++) {
            const link = this.$(links[i]);
            const href = link.attr('href');
            if (href) {
                try {
                    const absoluteUrl = new URL(href, this.baseUrl).toString();
                    if (absoluteUrl.includes('z8games.com')) {
                        link.attr('href', absoluteUrl);
                        link.attr('target', '_blank');
                        link.attr('rel', 'noopener noreferrer');
                    }
                } catch (e) {}
            }
        }

        return this.$.html();
    }

    async downloadAsset(url) {
        try {
            const response = await axiosInstance.get(url, { responseType: 'arraybuffer', timeout: 10000 });
            const ext = path.extname(new URL(url).pathname) || '.jpg';
            const filename = `${crypto.createHash('md5').update(url).digest('hex')}${ext}`;
            const fullPath = path.join(MIRROR_DIR, filename);
            
            if (!fs.existsSync(fullPath)) {
                fs.writeFileSync(fullPath, response.data);
            }
            return filename;
        } catch (e) {
            return null;
        }
    }
}

export class MirrorService {
    static async mirror(url) {
        console.log(`[MirrorService] Mirroring URL: ${url}`);
        
        try {
            const page = await StealthyFetcher.fetch(url);
            
            // Target main content for forum posts OR patches
            // For patches page like /patches/nov2014, it might have different structure
            const contentSelectors = [
                '.Message.userContent', 
                '.MessageList .Message', 
                '.UserContent',
                '#content',
                '.content-area',
                'article',
                '.main-content'
            ];
            
            let content = null;
            for (const selector of contentSelectors) {
                content = page.css(selector).html();
                if (content && content.length > 200) break; 
            }
            
            if (!content) {
                content = page.$.html(); // Fallback to full page
            }

            const contentPage = new Selector(content, url);
            const mirroredHtml = await contentPage.mirrorAssets();

            return {
                title: page.css('h1').get() || page.css('title').get() || 'Mirrored Content',
                content: mirroredHtml,
                url: url
            };
        } catch (error) {
            console.error(`[MirrorService] Failed to mirror ${url}:`, error.message);
            throw error;
        }
    }
}

export class Spider {
    constructor(options = {}) {
        this.name = options.name || 'spider';
        this.startUrls = options.startUrls || [];
        this.concurrentRequests = options.concurrentRequests || 5;
        this.results = [];
    }

    async start() {
        console.log(`[Spider] Starting ${this.name}...`);
        const queue = [...this.startUrls];
        const active = new Set();
        
        while (queue.length > 0 || active.size > 0) {
            if (queue.length > 0 && active.size < this.concurrentRequests) {
                const url = queue.shift();
                const promise = this.fetchAndParse(url).finally(() => active.delete(promise));
                active.add(promise);
            } else {
                await Promise.race(active);
            }
        }
        
        return { items: this.results };
    }

    async fetchAndParse(url) {
        try {
            const page = await StealthyFetcher.fetch(url);
            const item = await this.parse(page);
            if (item) this.results.push(item);
        } catch (e) {
            console.error(`[Spider] Failed to crawl ${url}:`, e.message);
        }
    }

    async parse(page) {
        // To be overridden by subclasses
        return {
            title: page.css('h1').get(),
            url: page.baseUrl
        };
    }
}
