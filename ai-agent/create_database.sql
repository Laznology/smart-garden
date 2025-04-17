-- Membuat database
CREATE DATABASE IF NOT EXISTS hidroponik_db;
USE hidroponik_db;

-- Membuat tabel untuk data hidroponik
CREATE TABLE IF NOT EXISTS hidroponik_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    suhu DECIMAL(5,2) NOT NULL,
    kelembaban DECIMAL(5,2) NOT NULL,
    ph DECIMAL(4,2) NOT NULL,
    nutrisi INT NOT NULL,
    status_tanaman VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Menambahkan indeks untuk optimasi query
CREATE INDEX idx_timestamp ON hidroponik_data(timestamp);

-- Contoh data untuk testing
INSERT INTO hidroponik_data (suhu, kelembaban, ph, nutrisi, status_tanaman) VALUES
(25.5, 70.0, 6.5, 800, 'Sehat'),
(26.0, 68.5, 6.3, 850, 'Sehat'),
(25.8, 71.2, 6.4, 820, 'Sehat'),
(26.2, 69.8, 6.6, 780, 'Perlu nutrisi tambahan'),
(25.9, 70.5, 6.2, 900, 'Sehat');
