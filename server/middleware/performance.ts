import { Request, Response, NextFunction } from 'express';

/**
 * Performance and caching middleware for PageSpeed Insights optimization
 * Targets >80 score on Google PageSpeed Insights
 */
export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  // Set cache headers based on content type
  if (req.path.match(/\.(js|css|woff2|woff|ttf|eot|svg|png|jpg|jpeg|gif|webp)$/i)) {
    // Long-term caching for assets (1 year)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  } else if (req.path.startsWith('/api/')) {
    // No caching for API responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else {
    // HTML pages - cache for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }

  // Security headers that don't impact performance
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Enable compression (gzip/brotli)
  res.setHeader('Vary', 'Accept-Encoding');

  next();
}

/**
 * Add performance hints to HTML responses
 */
export function performanceHintsMiddleware(req: Request, res: Response, next: NextFunction) {
  // Add Link headers for resource hints
  const hints = [
    '<https://fonts.googleapis.com>; rel=preconnect',
    '<https://fonts.gstatic.com>; rel=preconnect',
    '<https://files.catbox.moe>; rel=preconnect',
    '<https://z8games.akamaized.net>; rel=preconnect',
    '<https://www.googletagmanager.com>; rel=preconnect',
  ];

  res.setHeader('Link', hints.join(', '));

  next();
}
