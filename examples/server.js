import express from 'express';
const app = express();
const port = 4000;
import { getEndpointStats } from './analytics/metricAnalyzer.js';
import { startCachePolicyRecalculationJob } from './jobs/cachePolicy.js';

import { adaptiveGateway } from './index.js';
app.use(express.json());

app.get('/admin/stats', async (req, res) => {
    try {
        const stats = await getEndpointStats();
        res.json(stats);
    } catch (error) {
        console.error("Error fetching endpoint stats:", error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.use('/proxy', adaptiveGateway({
    cache: {
        latencyThreshold: 500, // ms
        ttl: 300 // seconds
    },
    rateLimit: {
        max: 100,
        windowMs: 15 * 60 * 1000
    },
    proxy: {
        target: 'http://localhost:3000',
        pathRewrite: path => path.replace(/^\/proxy/, '')
    }
}));

// app.get('/fast', (req, res) => proxyRequest(req, res, '/fast'));
// app.get('/slow', (req, res) => proxyRequest(req, res, '/slow'));
// app.get('/proxy/users', (req, res) => getUnivaultUsers(req, res, '/api/users'));
// app.get('/heavy', (req, res) => proxyRequest(req, res, '/heavy'));
// app.get('/random-fail', (req, res) => proxyRequest(req, res, '/random-fail'));
// app.get('/products', (req, res) => proxyRequest(req, res, '/products'));


startCachePolicyRecalculationJob();

app.listen(port, () => {
    console.log(`Gateway server is running at http://localhost:${port}`);
});