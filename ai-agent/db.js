import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Konfigurasi database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function getLatestData(limit = 100) {
  try {
    const [rows] = await pool.query(`
      SELECT timestamp, suhu, kelembaban, ph, nutrisi, status_tanaman 
      FROM hidroponik_data 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [limit]);
    return rows;
  } catch (error) {
    console.error('Error getting latest data:', error);
    return [];
  }
}

export async function getDataByDate(date) {
  try {
    const [rows] = await pool.query(`
      SELECT timestamp, suhu, kelembaban, ph, nutrisi, status_tanaman 
      FROM hidroponik_data 
      WHERE DATE(timestamp) = DATE(?)
      ORDER BY timestamp DESC
    `, [date]);
    return rows;
  } catch (error) {
    console.error('Error getting data by date:', error);
    return [];
  }
}

export async function getSummary() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        AVG(suhu) as avg_suhu,
        AVG(kelembaban) as avg_kelembaban,
        AVG(ph) as avg_ph,
        AVG(nutrisi) as avg_nutrisi,
        MAX(timestamp) as last_update,
        COUNT(*) as total_records
      FROM hidroponik_data 
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    if (rows[0].total_records > 0) {
      return {
        suhuRataRata: rows[0].avg_suhu.toFixed(1),
        kelembabanRataRata: rows[0].avg_kelembaban.toFixed(1),
        phRataRata: rows[0].avg_ph.toFixed(2),
        nutrisiRataRata: Math.round(rows[0].avg_nutrisi),
        totalData: rows[0].total_records,
        updateTerakhir: rows[0].last_update
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting summary:', error);
    return null;
  }
}

export default pool;
