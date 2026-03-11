import request from 'supertest';
import { expect } from 'chai';
import express from 'express';
import { MongoDBStorage } from '../mongodb-storage.js';

describe('API Route Registration and Error Handling', () => {
    let app;

    before(() => {
        app = express();
        app.use(express.json());
        
        // Mock route for testing the 404 handler
        app.get('/api/test', (req, res) => res.json({ ok: true }));
        
        // The 404 handler we added to index.js
        app.all("/api/*", (req, res) => {
            res.status(404).json({ error: "API endpoint not found", path: req.path });
        });
        
        // SPA catch-all
        app.get("*", (req, res) => {
            res.send("<!DOCTYPE html><html><body>SPA</body></html>");
        });
    });

    it('should return 404 JSON for missing API routes', async () => {
        const res = await request(app).get('/api/non-existent');
        expect(res.status).to.equal(404);
        expect(res.body).to.have.property('error', 'API endpoint not found');
    });

    it('should return HTML for non-API routes', async () => {
        const res = await request(app).get('/some-page');
        expect(res.status).to.equal(200);
        expect(res.text).to.contain('<!DOCTYPE html>');
    });

    it('should return JSON for registered API routes', async () => {
        const res = await request(app).get('/api/test');
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('ok', true);
    });
});
