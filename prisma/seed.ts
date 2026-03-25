import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando o seed completo e variado...");

  // --- LIMPEZA ---
  await prisma.interacao.deleteMany();
  await prisma.anexo.deleteMany();
  await prisma.chamadoAcao.deleteMany();
  await prisma.preventiva.deleteMany();
  await prisma.chamado.deleteMany();
  await prisma.acao.deleteMany();
  await prisma.deptoTipo.deleteMany();
  await prisma.tipoChamado.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.departamento.deleteMany();
  await prisma.local.deleteMany();
  console.log("🧹 Banco limpo.");

  const usuariosData = [
    {
      login: "bruno.paiva",
      nome: "Bruno Paiva",
      perfil: "ADMIN",
      deptos: [],
    },
  ];

  const usersMap: Record<string, number> = {};
  for (const u of usuariosData) {
    const user = await prisma.usuario.create({
      data: {
        login: u.login,
        nome: u.nome,
        guid: `guid-${u.login}`,
        perfil: u.perfil,
        departamentos: undefined,
      },
    });
    usersMap[u.login] = user.id;
  }
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
