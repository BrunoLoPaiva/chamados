-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guid" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "perfil" TEXT NOT NULL DEFAULT 'USUARIO'
);

-- CreateTable
CREATE TABLE "Local" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TipoChamado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'Media',
    "tempoSlaHoras" INTEGER NOT NULL DEFAULT 24
);

-- CreateTable
CREATE TABLE "DeptoTipo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "departamentoId" INTEGER NOT NULL,
    "tipoId" INTEGER NOT NULL,
    CONSTRAINT "DeptoTipo_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeptoTipo_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "TipoChamado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chamado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SOLICITADO',
    "localId" INTEGER NOT NULL,
    "tipoId" INTEGER NOT NULL,
    "departamentoDestinoId" INTEGER NOT NULL,
    "usuarioCriacaoId" INTEGER NOT NULL,
    "tecnicoId" INTEGER,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataVencimento" DATETIME,
    "dataAtendimento" DATETIME,
    "solucao" TEXT,
    CONSTRAINT "Chamado_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Chamado_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "TipoChamado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Chamado_departamentoDestinoId_fkey" FOREIGN KEY ("departamentoDestinoId") REFERENCES "Departamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Chamado_usuarioCriacaoId_fkey" FOREIGN KEY ("usuarioCriacaoId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Chamado_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Anexo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nomeArquivo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "base64" TEXT NOT NULL,
    "chamadoId" INTEGER NOT NULL,
    CONSTRAINT "Anexo_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Chamado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Acao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "tipoId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "ChamadoAcao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chamadoId" INTEGER NOT NULL,
    "acaoId" INTEGER NOT NULL,
    "realizado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ChamadoAcao_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Chamado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChamadoAcao_acaoId_fkey" FOREIGN KEY ("acaoId") REFERENCES "Acao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Preventiva" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "frequenciaDias" INTEGER NOT NULL,
    "proximaExecucao" DATETIME NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "tecnicoId" INTEGER NOT NULL,
    "tipoId" INTEGER NOT NULL,
    "localId" INTEGER NOT NULL,
    CONSTRAINT "Preventiva_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Preventiva_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "TipoChamado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Preventiva_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Interacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chamadoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Interacao_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Chamado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Interacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_DepartamentoToUsuario" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_DepartamentoToUsuario_A_fkey" FOREIGN KEY ("A") REFERENCES "Departamento" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DepartamentoToUsuario_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_guid_key" ON "Usuario"("guid");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_login_key" ON "Usuario"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Chamado_codigo_key" ON "Chamado"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "_DepartamentoToUsuario_AB_unique" ON "_DepartamentoToUsuario"("A", "B");

-- CreateIndex
CREATE INDEX "_DepartamentoToUsuario_B_index" ON "_DepartamentoToUsuario"("B");
