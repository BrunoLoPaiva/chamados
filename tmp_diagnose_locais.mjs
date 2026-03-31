import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const locais = await prisma.local.findMany({
  where: { ativo: true },
  select: { id: true, nome: true, parentId: true },
  orderBy: { nome: 'asc' },
});

const raiz = locais.filter(l => !l.parentId);
const filhos = locais.filter(l => l.parentId);
const idsComFilhos = new Set(filhos.map(f => f.parentId));

console.log('=== LOCAIS RAIZ (parentId = null) ===');
raiz.forEach(r => {
  const temFilhos = idsComFilhos.has(r.id);
  console.log(`  [${temFilhos ? 'PAI' : 'FOLHA'}] ID:${r.id} | ${r.nome}`);
});

console.log('\n=== RESUMO ===');
console.log('Total raiz:', raiz.length);
console.log('Pais com filhos:', [...idsComFilhos].length);
console.log('Folhas raiz (possivelmente cadastradas errado):', raiz.filter(r => !idsComFilhos.has(r.id)).length);

await prisma.$disconnect();
