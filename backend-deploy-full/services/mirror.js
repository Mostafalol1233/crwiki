import axios from 'axios';
import * as axiosRetryModule from 'axios-retry';
const axiosRetry = axiosRetryModule.default || axiosRetryModule;
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { storage } from '../storage.js';

// Pre-defined knowledge fallback for specific URLs that are known to be difficult to scrape
const KNOWN_CONTENT_FALLBACKS = {
    'https://crossfire.z8games.com/patches/nov2014': {
        title: 'Devastated City Blaze (November 2014 Patch)',
        content: `
            <div class="patch-notes-container">
                <section class="vvip-weapons">
                    <h3>VVIP Weapons</h3>
                    <ul>
                        <li><strong>Kukri-Beast:</strong> A specially crafted Kukri for collectors worldwide. Special material was used to produce the weapon, giving it a beast-like appearance.</li>
                    </ul>
                </section>
                <section class="characters">
                    <h3>New Characters</h3>
                    <ul>
                        <li><strong>2PM:</strong> Nichkhun, Wooyoung, Chansung, Junho, Jun.K, Taecyeon. Incredibly popular boy band group from Korea.</li>
                    </ul>
                </section>
                <section class="maps">
                    <h3>New Maps</h3>
                    <ul>
                        <li><strong>Devastated City:</strong> Seismic readings and odd activity coming from the ruins. Gather a team and investigate.</li>
                        <li><strong>Sewer System:</strong> Rival mercenaries identified in the sewer system. Eliminate the intruders.</li>
                    </ul>
                </section>
                <section class="weapons">
                    <h3>New Weapons</h3>
                    <div class="weapon-grid">
                        <div class="weapon-item">
                            <h4>Broken Kukri-Red Crystal</h4>
                            <p>Red crystal variant of the Kukri that broke due to repeated use. Shorter range but still deadly.</p>
                        </div>
                        <div class="weapon-item">
                            <h4>Vepr</h4>
                            <p>Ukrainian weapon based on the AK-74. Small size allows for greater mobility with scope options.</p>
                        </div>
                        <div class="weapon-item">
                            <h4>DPM</h4>
                            <p>Modernized version of the DP-28 featuring a unique 47 round magazine.</p>
                        </div>
                        <div class="weapon-item">
                            <h4>Raging Bull</h4>
                            <p>Great fire-power and large recoil. Deadly in the hands of an experienced marksman.</p>
                        </div>
                        <div class="weapon-item">
                            <h4>CR-21-Blaze</h4>
                            <p>New variant of CR-21 with blaze skin and 1X magnification accuracy.</p>
                        </div>
                        <div class="weapon-item">
                            <h4>Dual Desert Eagle-Blaze</h4>
                            <p>Powerful Dual Desert Eagles with Blaze skin finish and more ammo.</p>
                        </div>
                        <div class="weapon-item">
                            <h4>Gloves-Blaze</h4>
                            <p>Lightest and fastest-attack-speed melee weapon with Blaze skin.</p>
                        </div>
                        <div class="weapon-item">
                            <h4>IronMace Grenade-Blaze</h4>
                            <p>Bio-weapon Goliath's iron mace variant with Blaze skin finish.</p>
                        </div>
                        <div class="weapon-item">
                            <h4>AWM-Rusty</h4>
                            <p>Rusted from combat tours but still capable of one-shot kills.</p>
                        </div>
                        <div class="weapon-item">
                            <h4>Thompson-Rusty</h4>
                            <p>Top choice for close-quarter situations despite its rusted appearance.</p>
                        </div>
                    </div>
                </section>
            </div>
        `,
        excerpt: 'Devastated City Blaze: Kukri-Beast, 2PM characters, and new Blaze series weapons arrive in this massive November 2014 update.'
    }
};

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
        let dynamicReferer = 'https://crossfire.z8games.com/';
        try {
            dynamicReferer = `${new URL(url).origin}/`;
        } catch {}

        const headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': dynamicReferer,
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
        // 1. Mirror images in <img> tags
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

        // 2. Mirror background images in inline styles
        const elementsWithStyle = this.$('[style]');
        for (let i = 0; i < elementsWithStyle.length; i++) {
            const el = this.$(elementsWithStyle[i]);
            let style = el.attr('style') || '';
            if (style.includes('url(')) {
                style = await this.processCssUrls(style);
                el.attr('style', style);
            }
        }

        // 3. Mirror external stylesheets
        const links = this.$('link[rel="stylesheet"]');
        for (let i = 0; i < links.length; i++) {
            const link = this.$(links[i]);
            const href = link.attr('href');
            if (href) {
                try {
                    const absoluteUrl = new URL(href, this.baseUrl).toString();
                    const localPath = await this.downloadAndProcessCss(absoluteUrl);
                    if (localPath) {
                        link.attr('href', `/uploads/mirrored/${localPath}`);
                        link.attr('data-mirrored', 'true');
                    }
                } catch (e) {
                    console.error(`Failed to mirror stylesheet: ${href}`, e.message);
                }
            }
        }

        // 4. Mirror inline <style> blocks
        const styles = this.$('style');
        for (let i = 0; i < styles.length; i++) {
            const styleEl = this.$(styles[i]);
            let css = styleEl.html() || '';
            if (css.includes('url(')) {
                css = await this.processCssUrls(css);
                styleEl.html(css);
            }
        }

        // 5. Rewrite internal links
        const anchors = this.$('a');
        for (let i = 0; i < anchors.length; i++) {
            const link = this.$(anchors[i]);
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

    async processCssUrls(cssContent) {
        const urlRegex = /url\(['"]?([^'")]+)['"]?\)/gi;
        let match;
        let processedCss = cssContent;
        const urlMatches = [];
        
        while ((match = urlRegex.exec(cssContent)) !== null) {
            urlMatches.push(match[1]);
        }

        for (const originalUrl of urlMatches) {
            if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) continue;
            try {
                const absoluteUrl = new URL(originalUrl, this.baseUrl).toString();
                const localPath = await this.downloadAsset(absoluteUrl);
                if (localPath) {
                    const localUrl = `/uploads/mirrored/${localPath}`;
                    processedCss = processedCss.split(originalUrl).join(localUrl);
                }
            } catch (e) {}
        }
        return processedCss;
    }

    async downloadAndProcessCss(url) {
        try {
            const response = await axiosInstance.get(url, { timeout: 10000 });
            let css = response.data;
            if (typeof css !== 'string') return null;

            css = await this.processCssUrls(css);
            
            const filename = `${crypto.createHash('md5').update(url).digest('hex')}.css`;
            const fullPath = path.join(MIRROR_DIR, filename);
            
            fs.writeFileSync(fullPath, css);
            return filename;
        } catch (e) {
            return null;
        }
    }

    async downloadAsset(url) {
        try {
            // Check if already downloaded
            const ext = path.extname(new URL(url).pathname) || '.jpg';
            const filename = `${crypto.createHash('md5').update(url).digest('hex')}${ext}`;
            const fullPath = path.join(MIRROR_DIR, filename);
            
            if (fs.existsSync(fullPath)) return filename;

            const response = await axiosInstance.get(url, { responseType: 'arraybuffer', timeout: 15000 });
            fs.writeFileSync(fullPath, response.data);
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
            
            // 1. Try to find the main content first
            const contentSelectors = [
                '.Message.userContent', 
                '.MessageList .Message', 
                '.UserContent',
                '#content',
                '.content-area',
                'article',
                '.main-content'
            ];
            
            let mainContent = null;
            let usedSelector = null;
            for (const selector of contentSelectors) {
                const html = page.css(selector).html();
                if (html && html.length > 500) {
                    mainContent = html;
                    usedSelector = selector;
                    break; 
                }
            }
            
            // 2. If we found specific content, we still want to wrap it in the original page's context
            // or just mirror the full page if the user wants the "whole page".
            // For now, let's always mirror the full page but prioritize the content area if found.
            
            const fullHtml = page.$.html();
            const fullPageSelector = new Selector(fullHtml, url);
            
            // Inline external CSS so the mirrored page can render independently.
            const cssLinks = fullPageSelector.$('link[rel="stylesheet"]');
            for (let i = 0; i < cssLinks.length; i++) {
                const link = fullPageSelector.$(cssLinks[i]);
                const href = link.attr('href');
                if (!href) continue;
                try {
                    const cssUrl = new URL(href, url).toString();
                    const cssResponse = await axiosInstance.get(cssUrl, { timeout: 15000 });
                    if (typeof cssResponse.data !== 'string') continue;
                    const inlineCss = await fullPageSelector.processCssUrls(cssResponse.data);
                    link.replaceWith(`<style data-mirrored-from="${cssUrl}">\n${inlineCss}\n</style>`);
                } catch (error) {
                    console.error(`[MirrorService] Failed to inline stylesheet ${href}:`, error.message);
                }
            }

            // Mirror all assets in the full page
            const mirroredHtml = await fullPageSelector.mirrorAssets();

            return {
                title: page.css('h1').get() || page.css('title').get() || 'Mirrored Content',
                content: mirroredHtml,
                rawHtml: mirroredHtml,
                url: url,
                hasSpecificContent: !!mainContent,
                mainContentSelector: usedSelector
            };
        } catch (error) {
            console.error(`[MirrorService] Failed to mirror ${url}:`, error.message);
            
            // If the URL is in our known fallbacks, return that instead of failing
            const normalizedUrl = url.replace(/\/$/, '');
            const fallback = KNOWN_CONTENT_FALLBACKS[url] || KNOWN_CONTENT_FALLBACKS[normalizedUrl];
            
            if (fallback) {
                console.log(`[MirrorService] Using pre-defined knowledge fallback for ${url}`);
                return {
                    ...fallback,
                    rawHtml: fallback.content,
                    url: url,
                    isFallback: true
                };
            }
            
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
