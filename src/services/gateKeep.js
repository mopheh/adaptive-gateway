import CircuitBreaker from 'opossum';
import axios from 'axios';
import redisClient from '../cache/redisClient.js';
import { recordMetrics } from '../metrics/recordMetrics.js';
import { getCacheableEndpoints } from '../analytics/cachePolicy.js';

const DEFAULT_TARGET = 'http://localhost:3000';
const DEFAULT_TTL = 300;
const DEFAULT_LATENCY_THRESHOLD = 500;
const DEFAULT_BREAKER_OPTIONS = {
    timeout: 8000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000
};

function buildCacheKey(target, path, query) {
    return `${target}:${path}:${JSON.stringify(query ?? {})}`;
}

function createBreaker(options) {
    const breaker = new CircuitBreaker(async (target, path, req) => {
        const response = await axios({
            method: req.method,
            url: `${target}${path}`,
            data: req.body,
            params: req.query,
            validateStatus: status => status < 500
        });

        if (response.status >= 500) {
            const error = new Error(`Upstream server error: ${response.status}`);
            error.response = response;
            throw error;
        }

        return response;
    }, options);

    breaker.fallback(async (target, path, req) => {
        const cacheKey = buildCacheKey(target, path, req.query);
        const stale = await redisClient.get(cacheKey);
        if (stale) {
            return {
                status: 200,
                data: JSON.parse(stale),
                stale: true
            };
        }

        throw new Error('Service unavailable');
    });

    return breaker;
}

export function createGateKeepMiddleware({
    target = DEFAULT_TARGET,
    ttl = DEFAULT_TTL,
    latencyThreshold = DEFAULT_LATENCY_THRESHOLD,
    pathRewrite = path => path,
    breakerOptions = {}
} = {}) {
    const breaker = createBreaker({ ...DEFAULT_BREAKER_OPTIONS, ...breakerOptions });

    return async function gateKeepMiddleware(req, res, next) {
        const path = pathRewrite(req.path);
        const cacheKey = buildCacheKey(target, path, req.query);
        const shouldCache = req.method === 'GET' && (await getCacheableEndpoints(latencyThreshold)).includes(path);

        if (shouldCache) {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return res.json(JSON.parse(cached));
            }
        }

        const start = Date.now();
        try {
            const response = await breaker.fire(target, path, req);
            const duration = Date.now() - start;
            await recordMetrics({ path, method: req.method, latency: duration, status: response.status });

            if (shouldCache) {
                await redisClient.set(cacheKey, JSON.stringify(response.data), { EX: ttl });
            }

            return res.status(response.status).json(response.data);
        } catch (error) {
            const duration = Date.now() - start;
            await recordMetrics({ path, method: req.method, latency: duration, status: error.response?.status || 503, error: true });
            return res.status(error.response?.status || 503).json({
                error: 'Service unavailable',
                details: error.message
            });
        }
    };
}

export const gateKeep = createGateKeepMiddleware;