import { PrismaClient } from '@prisma/client';

// Inisialisasi koneksi Prisma
const prisma = new PrismaClient({
  log: ['error'],
});

prisma.$connect()
  .then(() => console.log('✅ Berhasil terhubung ke database MySQL'))
  .catch((err) => console.error('❌ Gagal terhubung ke database:', err));

export default prisma; 