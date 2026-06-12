import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  console.log("Administradores existentes:", admins.map(a => a.email));

  const password = await bcrypt.hash('admin123', 10);
  const email = 'admin@quizztrack.com';
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { password, role: 'ADMIN' },
    create: { email, password, role: 'ADMIN' },
  });
  console.log("¡Listo! Cuenta administrador configurada:");
  console.log("Email:", user.email);
  console.log("Contraseña:", "admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
