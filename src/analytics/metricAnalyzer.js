import { pool } from "../database/db.js";
export async function getEndpointStats() {
    const result = await pool.query(`
        SELECT endpoint, 
               COUNT(*) AS total_requests, 
               AVG(response_time_ms) AS avg_latency, 
               SUM(CASE WHEN is_error THEN 1 ELSE 0 END) AS error_count
        FROM metrics
        GROUP BY endpoint
        ORDER BY total_requests DESC
    `);
    return result.rows.map(row => ({
        endpoint: row.endpoint,
        totalRequests: parseInt(row.total_requests, 10),
        avgLatency: parseFloat(row.avg_latency),
        errorRate: `${((Number(row.error_count) / parseInt(row.total_requests, 10)) * 100).toFixed(2)}%`
    }));
}