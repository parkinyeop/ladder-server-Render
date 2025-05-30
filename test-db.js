const { Pool } = require('pg');

const pool = new Pool({
    user: 'inyeoppark',
    host: 'localhost',
    database: 'inyeoppark',
    password: '5868',
    port: 5432,
});

(async () => {
    try {
        const result = await pool.query('SELECT * FROM coins');
        console.log('🟢 연결 성공: ', result.rows);
    } catch (err) {
        console.error('🔴 연결 실패:', err);
    } finally {
        pool.end();
    }
})();