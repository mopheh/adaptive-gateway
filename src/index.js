
import { rateLimit } from './rateLimit/ratelimit.js';
import { createGateKeepMiddleware } from './services/gateKeep.js';

export const adaptiveGateway = (options) => {
    const proxyMiddleware = createGateKeepMiddleware({
        target: options.proxy.target,
        ttl: options.cache.ttl,
        latencyThreshold: options.cache.latencyThreshold,
        pathRewrite: options.proxy.pathRewrite
    });

    return async function (req, res, next) {
        rateLimit(req, res, options.rateLimit.max, options.rateLimit.windowMs, async () => {
            await proxyMiddleware(req, res, next);
        });
    };
};

export { createGateKeepMiddleware };
export default adaptiveGateway;