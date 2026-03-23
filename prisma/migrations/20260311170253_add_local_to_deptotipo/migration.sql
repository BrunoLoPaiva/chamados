/*
  Warnings:

  - Added the required column `departamentoDestinoId` to the `Preventiva` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Acao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "tipoId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Acao" ("descricao", "id", "tipoId") SELECT "descricao", "id", "tipoId" FROM "Acao";
DROP TABLE "Acao";
ALTER TABLE "new_Acao" RENAME TO "Acao";
CREATE TABLE "new_ChamadoAcao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chamadoId" INTEGER NOT NULL,
    "acaoId" INTEGER NOT NULL,
    "realizado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ChamadoAcao_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Chamado" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChamadoAcao_acaoId_fkey" FOREIGN KEY ("acaoId") REFERENCES "Acao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ChamadoAcao" ("acaoId", "chamadoId", "id", "realizado") SELECT "acaoId", "chamadoId", "id", "realizado" FROM "ChamadoAcao";
DROP TABLE "ChamadoAcao";
ALTER TABLE "new_ChamadoAcao" RENAME TO "ChamadoAcao";
CREATE TABLE "new_Departamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Departamento" ("id", "nome") SELECT "id", "nome" FROM "Departamento";
DROP TABLE "Departamento";
ALTER TABLE "new_Departamento" RENAME TO "Departamento";
CREATE TABLE "new_DeptoTipo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "departamentoId" INTEGER NOT NULL,
    "tipoId" INTEGER NOT NULL,
    "localId" INTEGER,
    "subLocalId" INTEGER,
    CONSTRAINT "DeptoTipo_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeptoTipo_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "TipoChamado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeptoTipo_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeptoTipo_subLocalId_fkey" FOREIGN KEY ("subLocalId") REFERENCES "Local" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DeptoTipo" ("departamentoId", "id", "tipoId") SELECT "departamentoId", "id", "tipoId" FROM "DeptoTipo";
DROP TABLE "DeptoTipo";
ALTER TABLE "new_DeptoTipo" RENAME TO "DeptoTipo";
CREATE TABLE "new_Local" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "parentId" INTEGER,
    CONSTRAINT "Local_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Local" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Local" ("id", "nome") SELECT "id", "nome" FROM "Local";
DROP TABLE "Local";
ALTER TABLE "new_Local" RENAME TO "Local";
CREATE TABLE "new_Preventiva" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "frequenciaDias" INTEGER NOT NULL,
    "proximaExecucao" DATETIME NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "tecnicoId" INTEGER NOT NULL,
    "tipoId" INTEGER NOT NULL,
    "localId" INTEGER NOT NULL,
    "departamentoDestinoId" INTEGER NOT NULL,
    CONSTRAINT "Preventiva_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Preventiva_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "TipoChamado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Preventiva_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Preventiva_departamentoDestinoId_fkey" FOREIGN KEY ("departamentoDestinoId") REFERENCES "Departamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Preventiva" ("ativa", "descricao", "frequenciaDias", "id", "localId", "proximaExecucao", "tecnicoId", "tipoId", "titulo") SELECT "ativa", "descricao", "frequenciaDias", "id", "localId", "proximaExecucao", "tecnicoId", "tipoId", "titulo" FROM "Preventiva";
DROP TABLE "Preventiva";
ALTER TABLE "new_Preventiva" RENAME TO "Preventiva";
CREATE TABLE "new_TipoChamado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "prioridade" TEXT NOT NULL DEFAULT 'Media',
    "tempoSlaHoras" INTEGER NOT NULL DEFAULT 24
);
INSERT INTO "new_TipoChamado" ("id", "nome", "prioridade", "tempoSlaHoras") SELECT "id", "nome", "prioridade", "tempoSlaHoras" FROM "TipoChamado";
DROP TABLE "TipoChamado";
ALTER TABLE "new_TipoChamado" RENAME TO "TipoChamado";
CREATE TABLE "new_Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guid" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "perfil" TEXT NOT NULL DEFAULT 'USUARIO',
    "ativo" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Usuario" ("guid", "id", "login", "nome", "perfil") SELECT "guid", "id", "login", "nome", "perfil" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_guid_key" ON "Usuario"("guid");
CREATE UNIQUE INDEX "Usuario_login_key" ON "Usuario"("login");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
