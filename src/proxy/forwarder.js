import axios from "axios";
import { recordMetrics } from "../metrics/recordMetrics.js";
import redisClient from "../cache/redisClient.js";
import { getCacheableEndpoints } from "../analytics/cachePolicy.js";

const TARGET_BACKEND = 'http://localhost:3000';

export async function gateKeep(req, res, path, target = TARGET_BACKEND, ttl, latencyThreshold) {
    const start = Date.now();
    try {
        if (req.method == 'GET' && (await getCacheableEndpoints()).includes(path)) {
            const cacheKey = `${path}:${JSON.stringify(req.query)}`;
            const cachedResponse = await redisClient.get(cacheKey);
            if (cachedResponse) {
                console.log(`Cache hit for ${cacheKey}`);
                return res.json(JSON.parse(cachedResponse));
            }
            console.log(`Cache miss for ${cacheKey}`);
        }
        const response = await axios({
            method: req.method,
            url: `${target}${path}`,
            data: req.body,
            params: req.query,
        })
        const duration = Date.now() - start;
        await recordMetrics({ path, method: req.method, latency: duration, status: response.status });
        if (req.method == 'GET' && (await getCacheableEndpoints()).includes(path)) {
            const cacheKey = `${path}:${JSON.stringify(req.query)}`;
            await redisClient.set(cacheKey, JSON.stringify(response.data), { EX: ttl });
        }
        res.status(response.status).json(response.data);

    } catch (error) {
        const duration = Date.now() - start;
        console.error(`Error proxying request to ${path}:`, error.message);
        await recordMetrics({ path, method: req.method, latency: duration, status: error.response?.status || 'Error', error: true });
        res.status(error.response?.status || 500).json({ error: 'Internal Server Error' });
    }
}