const bucket = new Map();

export const rateLimit = (req, res, max, windowMs, next) => {
    const key = req.ip;
    const now = Date.now();

    if (!bucket.has(key)) {
        bucket.set(key, {
            tokens: max,
            lastRefill: now
        });
    }

    const userBucket = bucket.get(key);
    const elapsed = now - userBucket.lastRefill;
    const refillAmount = (elapsed * max) / windowMs;

    if (refillAmount > 0) {
        userBucket.tokens = Math.min(max, userBucket.tokens + refillAmount);
        userBucket.lastRefill = now;
    }

    if (userBucket.tokens >= 1) {
        userBucket.tokens -= 1;
        bucket.set(key, userBucket);
        next();
    } else {
        res.status(429).json({
            error: 'Too Many Requests'
        });
    }
};