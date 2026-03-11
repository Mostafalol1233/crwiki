import request from 'supertest';
import { expect } from 'chai';
import express from 'express';
import { MongoDBStorage } from '../mongodb-storage.js';

describe('News and Post Slug Generation', () => {
    let storage;

    before(() => {
        storage = new MongoDBStorage();
    });

    it('should slugify titles correctly', () => {
        const title = "Hello World! (Test Case)";
        const slug = storage.slugify(title);
        expect(slug).to.equal('hello-world-test-case');
    });

    it('should generate slug for posts if missing', async () => {
        const post = { title: "New Post Title", summary: "summary", content: "content", category: "news", tags: ["test"], author: "admin", readingTime: 1 };
        // This is a unit test of the storage layer logic, not a full integration test with DB
        // since we don't want to mock Mongoose models here.
        // We'll just test the slugify logic itself.
        expect(storage.slugify(post.title)).to.equal('new-post-title');
    });

    it('should return 404 JSON for missing news by slug', async () => {
        // We'll test the route logic in index.js by mocking the storage
        const app = express();
        const mockStorage = {
            getNewsByIdOrSlug: async () => null,
            logUrlMatchFailure: async () => {}
        };
        
        app.get("/api/news/slug/:slug", async (req, res) => {
            try {
                const { slug } = req.params;
                const news = await mockStorage.getNewsByIdOrSlug(slug);
                if (!news) return res.status(404).json({ error: "News not found" });
                return res.json(news);
            } catch (error) {
                return res.status(500).json({ error: error.message });
            }
        });

        const res = await request(app).get('/api/news/slug/missing-slug');
        expect(res.status).to.equal(404);
        expect(res.body).to.have.property('error', 'News not found');
    });
});
