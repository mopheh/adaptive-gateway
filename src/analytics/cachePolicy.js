import { getEndpointStats } from './metricAnalyzer.js';
import redisClient from '../cache/redisClient.js';

export async function getCacheableEndpoints(latencyThreshold = 100, defaultTtl = 60) {
    const stats = await getEndpointStats();

    for (const stat of stats) {
        const highLatency = stat.avgLatency > latencyThreshold;
        const lowErrorRate = parseFloat(stat.errorRate) < 3;
        const highTraffic = stat.requestCount > 100;

        if (highLatency && lowErrorRate && highTraffic) {
            let ttl = defaultTtl;
            if (stat.avgLatency > latencyThreshold * 2) ttl = defaultTtl * 2;
            if (stat.avgLatency > latencyThreshold * 3) ttl = defaultTtl * 5;
            redisClient.set(`cacheable:${stat.endpoint}`, 'true', { EX: ttl });
        } else {
            redisClient.del(`cacheable:${stat.endpoint}`);
        }

        console.log(`Endpoint: ${stat.endpoint}, Avg Latency: ${stat.avgLatency}ms, Error Rate: ${stat.errorRate}%`);
    }

    return stats
        .filter(stat => stat.avgLatency > latencyThreshold && parseFloat(stat.errorRate) < 3)
        .map(stat => stat.endpoint);
}