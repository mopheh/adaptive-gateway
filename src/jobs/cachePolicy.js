import { getCacheableEndpoints } from '../analytics/cachePolicy.js';
const CACHE_POLICY_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

export async function recalculateCachePolicy() {
    console.log('Recalculating cache policy based on analytics data...');
    // TODO: implement cache policy recalculation logic here using analytics data
    await getCacheableEndpoints();
}

export function startCachePolicyRecalculationJob() {
    console.log('Starting cache policy recalculation job every 15 minutes.');
    // Run immediately on startup, then every 15 minutes.
    recalculateCachePolicy().catch(error => {
        console.error('Failed to run initial cache policy recalculation:', error);
    });

    setInterval(async () => {
        try {
            await recalculateCachePolicy();
        } catch (error) {
            console.error('Error during cache policy recalculation:', error);
        }
    }, CACHE_POLICY_REFRESH_INTERVAL_MS);
}
