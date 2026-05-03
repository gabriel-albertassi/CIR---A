
import { prisma } from './src/lib/db';

async function test() {
  try {
    const count = await prisma.patient.count();
    console.log('Patient count:', count);
    process.exit(0);
  } catch (err) {
    console.error('Prisma test failed:', err);
    process.exit(1);
  }
}

test();
