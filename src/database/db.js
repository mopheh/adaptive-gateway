import { Pool } from 'pg';

export const pool = new Pool({
    user: 'mac',
    host: 'localhost',
    database: 'gateway_metrics',
    password: '',
    port: 5432,
});
