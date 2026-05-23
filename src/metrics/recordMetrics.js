import { pool } from "../database/db.js";

export async function recordMetrics({ path, method, latency, status, error = false }) {
    console.log({
        path: path,
        method: method,
        latency: `${latency}ms`,
        status: status,
        error: error,
        timestamp: new Date().toISOString()
    });

    // try {
    //     await pool.query(
    //         `INSERT INTO metrics (endpoint, method, status_code, response_time_ms, is_error)
    //    VALUES ($1, $2, $3, $4, $5)`,
    //         [path, method, status, latency, error]
    //     );
    // } catch (err) {
    //     console.error("Failed to insert metrics:", err.message);
    // }


}
