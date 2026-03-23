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

  // ────────────────────────────────────────────────────────
  // 1. LOCAIS E SUB-LOCAIS
  // ────────────────────────────────────────────────────────
  const masterLocais = [
    { nome: "Sede Administrativa", sublocais: ["Recepção", "Diretoria", "RH / DP", "Financeiro", "Sala de Reuniões A", "Sala de Reuniões B", "Copa / Refeitório", "Almoxarifado", "Sala de Servidores (DC)"] },
    { nome: "CCO - Centro de Controle Operacional", sublocais: ["Sala de Monitoramento", "Sala Técnica CCO", "Arquivo CCO"] },
    { nome: "Praças de Pedágio", sublocais: ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10"] },
    { nome: "CFTVs (Câmeras)", sublocais: ["KM 240", "KM 242", "KM 244", "KM 250", "KM 260", "KM 270", "KM 280", "KM 290", "KM 300", "KM 310"] },
    { nome: "SAUs (Serviço de Atendimento)", sublocais: ["SAU 01", "SAU 02", "SAU 03", "SAU 04", "SAU 05"] },
    { nome: "Balanças", sublocais: ["Balança Norte", "Balança Sul"] },
    { nome: "Pátio / Garagem", sublocais: ["Box Mecânico 1", "Box Mecânico 2", "Área de Lavagem", "Estacionamento Frota"] },
    { nome: "Via / Rodovia", sublocais: [] },
  ];

  const locaisMap: Record<string, number> = {};
  for (const master of masterLocais) {
    const parent = await prisma.local.create({ data: { nome: master.nome } });
    locaisMap[master.nome] = parent.id;
    for (const sub of master.sublocais) {
      const child = await prisma.local.create({ data: { nome: sub, parentId: parent.id } });
      locaisMap[sub] = child.id;
    }
  }

  // ────────────────────────────────────────────────────────
  // 2. DEPARTAMENTOS
  // ────────────────────────────────────────────────────────
  const deptosData = ["TI", "Manutenção Predial", "Manutenção Veicular", "Recursos Humanos", "Operação Viária", "Engenharia", "Financeiro", "Jurídico", "Segurança do Trabalho"];
  const deptosMap: Record<string, number> = {};
  for (const nome of deptosData) {
    const d = await prisma.departamento.create({ data: { nome } });
    deptosMap[nome] = d.id;
  }

  // ────────────────────────────────────────────────────────
  // 3. TIPOS DE CHAMADO (por depto + local opcional)
  // ────────────────────────────────────────────────────────
  type TipoEntry = {
    nome: string; prioridade: string; depto: string; sla: number;
    local?: string; subLocal?: string;
    acoes?: string[];
  };

  const tiposData: TipoEntry[] = [
    // ── TI – Geral (sem local)
    { nome: "Sem conexão com a internet",             prioridade: "Alta",  depto: "TI", sla: 4,   acoes: ["Verificar cabo/Wi-Fi", "Testar ping gateway", "Escalar ao provedor se necessário"] },
    { nome: "Sistema ERP Lento",                      prioridade: "Media", depto: "TI", sla: 8 },
    { nome: "Computador não liga",                    prioridade: "Media", depto: "TI", sla: 12,  acoes: ["Verificar alimentação elétrica", "Testar tomada e cabo", "Checar leds da fonte"] },
    { nome: "Troca de Mouse / Teclado",               prioridade: "Baixa", depto: "TI", sla: 48 },
    { nome: "Impressora com defeito",                 prioridade: "Media", depto: "TI", sla: 12,  acoes: ["Verificar fila de impressão", "Reinstalar driver", "Testar impressão de teste"] },
    { nome: "Impressora sem papel / toner",           prioridade: "Baixa", depto: "TI", sla: 24 },
    { nome: "Criação de conta / E-mail",              prioridade: "Media", depto: "TI", sla: 24 },
    { nome: "Redefinição de senha",                   prioridade: "Alta",  depto: "TI", sla: 2,   acoes: ["Verificar identidade do solicitante", "Resetar senha no AD", "Comunicar novo acesso"] },
    { nome: "Instalação de Software",                 prioridade: "Baixa", depto: "TI", sla: 48 },
    { nome: "Erro em aplicativo específico",          prioridade: "Media", depto: "TI", sla: 8 },
    { nome: "Backup não executou",                    prioridade: "Alta",  depto: "TI", sla: 4,   acoes: ["Verificar log do backup", "Verificar espaço em disco", "Executar backup manual"] },
    { nome: "Vírus / Malware detectado",              prioridade: "Alta",  depto: "TI", sla: 2,   acoes: ["Isolar máquina da rede", "Executar antivírus atualizado", "Relatar incidente de segurança"] },
    { nome: "VPN sem conexão",                        prioridade: "Alta",  depto: "TI", sla: 4 },
    { nome: "Telefonia IP / Ramal sem sinal",         prioridade: "Media", depto: "TI", sla: 8 },
    { nome: "Switch / Roteador offline",              prioridade: "Alta",  depto: "TI", sla: 2,   acoes: ["Verificar alimentação do equipamento", "Reiniciar switch", "Checar uplink"] },
    // ── TI – Sala de Servidores
    { nome: "Servidor fora do ar",                    prioridade: "Alta",  depto: "TI", sla: 1,   local: "Sede Administrativa", subLocal: "Sala de Servidores (DC)", acoes: ["Verificar alimentação e UPS", "Checar temperatura do rack", "Inicializar serviços críticos"] },
    { nome: "Temperatura do datacenter crítica",      prioridade: "Alta",  depto: "TI", sla: 1,   local: "Sede Administrativa", subLocal: "Sala de Servidores (DC)", acoes: ["Checar ar-condicionado do DC", "Acionar suporte do ar-cond", "Monitorar temperatura a cada 15min"] },
    // ── TI – CCO
    { nome: "Monitor do Painel CCO sem sinal",        prioridade: "Alta",  depto: "TI", sla: 1,   local: "CCO - Centro de Controle Operacional" },
    { nome: "Software de Monitoramento Travado",      prioridade: "Alta",  depto: "TI", sla: 2,   local: "CCO - Centro de Controle Operacional", acoes: ["Reiniciar processo/serviço", "Verificar consumo de RAM", "Reiniciar servidor CCO se necessário"] },
    { nome: "Gravador de câmeras CCO sem espaço",     prioridade: "Alta",  depto: "TI", sla: 4,   local: "CCO - Centro de Controle Operacional", acoes: ["Verificar partição de gravação", "Remover gravações antigas", "Configurar retenção automática"] },
    // ── TI – Praças de Pedágio
    { nome: "Falha no Sistema de Cobrança (Praça)",   prioridade: "Alta",  depto: "TI", sla: 2,   local: "Praças de Pedágio", acoes: ["Reiniciar terminal de cobrança", "Verificar conexão com servidor central", "Registrar ocorrência operacional"] },
    { nome: "Sensor de Eixo não detecta veículo",     prioridade: "Alta",  depto: "TI", sla: 2,   local: "Praças de Pedágio" },
    { nome: "Impressora de ticket inoperante",        prioridade: "Media", depto: "TI", sla: 4,   local: "Praças de Pedágio", acoes: ["Verificar papel e fita", "Reiniciar impressora", "Trocar bobina se necessário"] },
    // ── TI – CFTV
    { nome: "Câmera CFTV fora do ar",                prioridade: "Alta",  depto: "TI", sla: 4,   local: "CFTVs (Câmeras)", acoes: ["Verificar alimentação elétrica do equipamento", "Testar cabeamento de rede / fibra", "Reiniciar câmera e verificar transmissão no CCO"] },
    { nome: "Câmera com imagem distorcida",           prioridade: "Media", depto: "TI", sla: 12,  local: "CFTVs (Câmeras)" },
    { nome: "Configuração / Ajuste de ângulo CFTV",  prioridade: "Baixa", depto: "TI", sla: 48,  local: "CFTVs (Câmeras)" },

    // ── Manutenção Predial – Geral
    { nome: "Troca de Lâmpada / Luminária",          prioridade: "Baixa", depto: "Manutenção Predial", sla: 48 },
    { nome: "Vazamento de Água",                     prioridade: "Alta",  depto: "Manutenção Predial", sla: 4,  acoes: ["Localizar ponto do vazamento", "Acionar encanador de plantão", "Fechar registro se necessário"] },
    { nome: "Ar-condicionado parado",                prioridade: "Alta",  depto: "Manutenção Predial", sla: 12, acoes: ["Verificar disjuntor do ar-cond", "Limpar filtro", "Acionar empresa de manutenção preventiva"] },
    { nome: "Ar-condicionado sem refrigerar",        prioridade: "Media", depto: "Manutenção Predial", sla: 24 },
    { nome: "Porta / Portão com defeito",            prioridade: "Media", depto: "Manutenção Predial", sla: 24 },
    { nome: "Janela / Vidro quebrado",               prioridade: "Alta",  depto: "Manutenção Predial", sla: 8 },
    { nome: "Infiltração no teto",                   prioridade: "Alta",  depto: "Manutenção Predial", sla: 8 },
    { nome: "Falta de energia elétrica (interna)",   prioridade: "Alta",  depto: "Manutenção Predial", sla: 2,  acoes: ["Verificar quadro de disjuntores", "Checar gerador de emergência", "Acionar concessionária se necessário"] },
    { nome: "Tomada / Ponto elétrico defeituoso",    prioridade: "Media", depto: "Manutenção Predial", sla: 24 },
    { nome: "Desentupimento",                        prioridade: "Alta",  depto: "Manutenção Predial", sla: 8 },
    { nome: "Manutenção de mobiliário",              prioridade: "Baixa", depto: "Manutenção Predial", sla: 72 },
    { nome: "Pintura / Reparo de parede",            prioridade: "Baixa", depto: "Manutenção Predial", sla: 120 },
    // ── Manutenção Predial – SAUs
    { nome: "Limpeza de Calha / Cobertura (SAU)",    prioridade: "Baixa", depto: "Manutenção Predial", sla: 72,  local: "SAUs (Serviço de Atendimento)" },
    { nome: "Manutenção do Totem SAU",               prioridade: "Media", depto: "Manutenção Predial", sla: 24,  local: "SAUs (Serviço de Atendimento)" },
    { nome: "Banheiro SAU com defeito",              prioridade: "Alta",  depto: "Manutenção Predial", sla: 8,   local: "SAUs (Serviço de Atendimento)" },
    // ── Manutenção Predial – Balanças
    { nome: "Calibração de Balança Rodoviária",      prioridade: "Alta",  depto: "Manutenção Predial", sla: 8,   local: "Balanças", acoes: ["Aplicar peso padrão de referência", "Registrar resultado no sistema", "Emitir laudo de calibração"] },
    { nome: "Sensor de Peso com Defeito",            prioridade: "Alta",  depto: "Manutenção Predial", sla: 4,   local: "Balanças" },
    { nome: "Sistema de Balança offline",            prioridade: "Alta",  depto: "Manutenção Predial", sla: 2,   local: "Balanças", acoes: ["Reiniciar sistema de balança", "Verificar conexão com servidor CCO", "Acionar suporte do fabricante se necessário"] },

    // ── Manutenção Veicular
    { nome: "Veículo com pneu furado",               prioridade: "Alta",  depto: "Manutenção Veicular", sla: 2,   acoes: ["Acionar socorro imediato", "Trocar pneu sobressalente", "Levar veículo para borracharia"] },
    { nome: "Veículo não parte (bateria)",            prioridade: "Alta",  depto: "Manutenção Veicular", sla: 2,   acoes: ["Testar bateria com multímetro", "Dar partida auxiliar", "Substituir bateria se necessário"] },
    { nome: "Veículo com superaquecimento",          prioridade: "Alta",  depto: "Manutenção Veicular", sla: 1,   acoes: ["Desligar veículo imediatamente", "Aguardar esfriar antes de verificar", "Verificar nível de líquido de arrefecimento"] },
    { nome: "Revisão periódica de veículo",          prioridade: "Baixa", depto: "Manutenção Veicular", sla: 120, local: "Pátio / Garagem" },
    { nome: "Troca de óleo e filtros",               prioridade: "Baixa", depto: "Manutenção Veicular", sla: 72,  local: "Pátio / Garagem", subLocal: "Box Mecânico 1" },
    { nome: "Reparo de sistema de freios",           prioridade: "Alta",  depto: "Manutenção Veicular", sla: 4,   local: "Pátio / Garagem" },
    { nome: "Manutenção elétrica veicular",          prioridade: "Media", depto: "Manutenção Veicular", sla: 24,  local: "Pátio / Garagem" },
    { nome: "Sinistro / Colisão de veículo",         prioridade: "Alta",  depto: "Manutenção Veicular", sla: 2,   acoes: ["Registrar boletim de ocorrência", "Fotografar avarias", "Acionar seguradora"] },

    // ── Recursos Humanos
    { nome: "Dúvida sobre folha de pagamento",       prioridade: "Media", depto: "Recursos Humanos", sla: 24 },
    { nome: "Solicitação de férias",                 prioridade: "Baixa", depto: "Recursos Humanos", sla: 72 },
    { nome: "Problema no ponto eletrônico",          prioridade: "Alta",  depto: "Recursos Humanos", sla: 8,  acoes: ["Verificar registro do colaborador", "Corrigir batida no sistema", "Comunicar supervisão"] },
    { nome: "Ajuste de hora extra",                  prioridade: "Media", depto: "Recursos Humanos", sla: 48 },
    { nome: "Solicitação de declaração funcional",   prioridade: "Baixa", depto: "Recursos Humanos", sla: 72 },
    { nome: "Dúvida sobre benefícios (VT/VR)",       prioridade: "Baixa", depto: "Recursos Humanos", sla: 72 },
    { nome: "Onboarding de novo colaborador",        prioridade: "Media", depto: "Recursos Humanos", sla: 24, acoes: ["Preparar crachá e acessos", "Apresentar às equipes", "Orientar sobre políticas internas"] },
    { nome: "Desligamento / Rescisão",               prioridade: "Alta",  depto: "Recursos Humanos", sla: 24, acoes: ["Coletar equipamentos", "Revogar acessos lógicos", "Formalizar rescisão"] },

    // ── Operação Viária
    { nome: "Veículo quebrado na via",               prioridade: "Alta",  depto: "Operação Viária", sla: 1, local: "Via / Rodovia", acoes: ["Acionar guincho", "Sinalizar o local com cones", "Remover veículo para base"] },
    { nome: "Acidente de trânsito na via",           prioridade: "Alta",  depto: "Operação Viária", sla: 1, local: "Via / Rodovia", acoes: ["Acionar SAMU/Bombeiros se houver vítima", "Isolar área do acidente", "Registrar ocorrência operacional"] },
    { nome: "Animal na pista",                       prioridade: "Alta",  depto: "Operação Viária", sla: 1, local: "Via / Rodovia", acoes: ["Acionar operação para retirada", "Sinalizar trecho", "Acionar órgão ambiental se necessário"] },
    { nome: "Sinalização danificada",                prioridade: "Media", depto: "Operação Viária", sla: 12, local: "Via / Rodovia", acoes: ["Registrar fotografia do dano", "Isolar área se risco", "Solicitar equipe de sinalização"] },
    { nome: "Carga derramada na pista",              prioridade: "Alta",  depto: "Operação Viária", sla: 1, local: "Via / Rodovia", acoes: ["Isolar faixa afetada", "Acionar limpeza da pista", "Registrar ocorrência"] },
    { nome: "Iluminação da via apagada",             prioridade: "Media", depto: "Operação Viária", sla: 8, local: "Via / Rodovia" },
    { nome: "Barreira / Guard-rail danificado",      prioridade: "Alta",  depto: "Operação Viária", sla: 4, local: "Via / Rodovia", acoes: ["Isolar área perigosa", "Acionar equipe de manutenção", "Registrar km do local"] },
    // ── Operação Viária – Praças
    { nome: "Fila excessiva na praça de pedágio",    prioridade: "Alta",  depto: "Operação Viária", sla: 1, local: "Praças de Pedágio", acoes: ["Abrir faixas adicionais", "Acionar reforço de pessoal", "Comunicar CCO"] },
    { nome: "Operador de praça com ocorrência",      prioridade: "Alta",  depto: "Operação Viária", sla: 1, local: "Praças de Pedágio" },

    // ── Engenharia
    { nome: "Buraco / Afundamento na via",           prioridade: "Alta",  depto: "Engenharia", sla: 24, local: "Via / Rodovia", acoes: ["Isolar área com cones", "Registrar localização e extensão", "Programar equipe de pavimentação"] },
    { nome: "Trinca / Fissura no pavimento",         prioridade: "Media", depto: "Engenharia", sla: 72, local: "Via / Rodovia" },
    { nome: "Avaliação de estrutura de ponte",        prioridade: "Media", depto: "Engenharia", sla: 120 },
    { nome: "Drenagem obstruída",                    prioridade: "Media", depto: "Engenharia", sla: 48, local: "Via / Rodovia", acoes: ["Verificar extensão da obstrução", "Acionar equipe de limpeza de bueiros", "Monitorar após reparo"] },
    { nome: "Inspeção em Balança Rodoviária",        prioridade: "Media", depto: "Engenharia", sla: 48, local: "Balanças", acoes: ["Verificar fundação e nível", "Testar capacidade máxima", "Emitir relatório de inspeção"] },
    { nome: "Erosão / Talude em risco",              prioridade: "Alta",  depto: "Engenharia", sla: 12, local: "Via / Rodovia", acoes: ["Interditar faixa adjacente", "Acionar geólogo", "Planejar contenção emergencial"] },

    // ── Financeiro
    { nome: "Dúvida sobre reembolso de despesa",     prioridade: "Media", depto: "Financeiro", sla: 48 },
    { nome: "Pagamento de fornecedor atrasado",      prioridade: "Alta",  depto: "Financeiro", sla: 24, acoes: ["Localizar NF e ordem de compra", "Verificar aprovação do gestor", "Efetuar pagamento ou escalar"] },
    { nome: "Nota fiscal com inconsistência",        prioridade: "Media", depto: "Financeiro", sla: 48, acoes: ["Solicitar nota fiscal corrigida", "Registrar divergência no sistema", "Comunicar fornecedor"] },
    { nome: "Conciliação bancária com divergência",  prioridade: "Alta",  depto: "Financeiro", sla: 12, acoes: ["Revisar lançamentos do período", "Identificar transação divergente", "Ajustar registro contábil"] },
    { nome: "Solicitação de adiantamento",           prioridade: "Baixa", depto: "Financeiro", sla: 72 },

    // ── Jurídico
    { nome: "Multa de trânsito para recurso",        prioridade: "Media", depto: "Jurídico", sla: 72, local: "Via / Rodovia", acoes: ["Coletar CRLV e CNH do condutor", "Redigir defesa administrativa", "Protocolar recurso no órgão"] },
    { nome: "Ação judicial recebida",                prioridade: "Alta",  depto: "Jurídico", sla: 24, acoes: ["Registrar prazo de resposta", "Encaminhar para advogado responsável", "Reunir provas e documentos"] },
    { nome: "Elaboração de contrato",                prioridade: "Media", depto: "Jurídico", sla: 120 },
    { nome: "Análise de conformidade regulatória",   prioridade: "Media", depto: "Jurídico", sla: 72 },

    // ── Segurança do Trabalho
    { nome: "Acidente de trabalho",                  prioridade: "Alta",  depto: "Segurança do Trabalho", sla: 1, acoes: ["Prestar primeiros socorros", "Acionar SAMU se necessário", "Preencher CAT (Comunicado de Acidente)"] },
    { nome: "Quase-acidente reportado",              prioridade: "Alta",  depto: "Segurança do Trabalho", sla: 4, acoes: ["Investigar causa raiz", "Implementar ação corretiva imediata", "Registrar no sistema de segurança"] },
    { nome: "EPI em falta (solicitação)",            prioridade: "Media", depto: "Segurança do Trabalho", sla: 24, acoes: ["Verificar estoque de EPI", "Providenciar entrega ao colaborador", "Registrar entrega com assinatura"] },
    { nome: "Treinamento de segurança solicitado",   prioridade: "Baixa", depto: "Segurança do Trabalho", sla: 72 },
    { nome: "Vistoria de extintor vencido",          prioridade: "Alta",  depto: "Segurança do Trabalho", sla: 24, acoes: ["Identificar extintor vencido", "Acionar empresa de recarga", "Substituir temporariamente"] },
    { nome: "Vazamento de gás detectado",            prioridade: "Alta",  depto: "Segurança do Trabalho", sla: 1, acoes: ["Evacuar área imediatamente", "Fechar registro de gás", "Acionar bombeiros e fornecedor"] },
  ];

  const tiposMap: Record<string, { id: number; deptoId: number }> = {};

  for (const t of tiposData) {
    const deptoId = deptosMap[t.depto];
    const localId = t.local ? (locaisMap[t.local] ?? null) : null;
    const subLocalId = t.subLocal ? (locaisMap[t.subLocal] ?? null) : null;

    const tipo = await prisma.tipoChamado.create({
      data: {
        nome: t.nome,
        prioridade: t.prioridade,
        tempoSlaHoras: t.sla,
        deptoTipos: { create: { departamentoId: deptoId, localId, subLocalId } },
      },
    });
    tiposMap[t.nome] = { id: tipo.id, deptoId };

    if (t.acoes && t.acoes.length > 0) {
      await prisma.acao.createMany({ data: t.acoes.map(descricao => ({ descricao, tipoId: tipo.id })) });
    }
  }

  // ────────────────────────────────────────────────────────
  // 4. USUÁRIOS
  // ────────────────────────────────────────────────────────
  const usuariosData = [
    { login: "bruno.paiva",      nome: "Bruno Paiva",       perfil: "ADMIN",       deptos: ["TI", "Operação Viária"] },
    { login: "sistema",          nome: "Sistema",            perfil: "ADMIN",       deptos: [] },
    { login: "maria.silva",      nome: "Maria Silva",        perfil: "ADMIN_DEPTO", deptos: ["Recursos Humanos", "Financeiro"] },
    { login: "joao.souza",       nome: "João Souza",         perfil: "TECNICO",     deptos: ["Manutenção Predial", "Engenharia"] },
    { login: "ana.costa",        nome: "Ana Costa",          perfil: "TECNICO",     deptos: ["TI"] },
    { login: "carlos.mendes",    nome: "Carlos Mendes",      perfil: "TECNICO",     deptos: ["Operação Viária"] },
    { login: "roberta.dias",     nome: "Roberta Dias",       perfil: "TECNICO",     deptos: ["Engenharia", "Manutenção Predial"] },
    { login: "fernando.lima",    nome: "Fernando Lima",      perfil: "TECNICO",     deptos: ["Manutenção Veicular"] },
    { login: "patricia.rocha",   nome: "Patrícia Rocha",    perfil: "TECNICO",     deptos: ["Segurança do Trabalho"] },
    { login: "rafael.nunes",     nome: "Rafael Nunes",       perfil: "TECNICO",     deptos: ["Jurídico", "Financeiro"] },
    { login: "tiago.oliveira",   nome: "Tiago Oliveira",    perfil: "TECNICO",     deptos: ["TI"] },
    { login: "camila.ferreira",  nome: "Camila Ferreira",   perfil: "TECNICO",     deptos: ["Recursos Humanos"] },
    { login: "pedro.alves",      nome: "Pedro Alves",        perfil: "USUARIO",     deptos: [] },
    { login: "lucas.lima",       nome: "Lucas Lima",         perfil: "USUARIO",     deptos: [] },
    { login: "juliana.santos",   nome: "Juliana Santos",    perfil: "USUARIO",     deptos: [] },
    { login: "marcos.ribeiro",   nome: "Marcos Ribeiro",    perfil: "USUARIO",     deptos: [] },
    { login: "beatriz.castro",   nome: "Beatriz Castro",    perfil: "USUARIO",     deptos: [] },
  ];

  const usersMap: Record<string, number> = {};
  for (const u of usuariosData) {
    const conects = u.deptos.map(d => ({ id: deptosMap[d] }));
    const user = await prisma.usuario.create({
      data: {
        login: u.login, nome: u.nome, guid: `guid-${u.login}`, perfil: u.perfil,
        departamentos: conects.length > 0 ? { connect: conects } : undefined,
      },
    });
    usersMap[u.login] = user.id;
  }

  // ────────────────────────────────────────────────────────
  // 5. CHAMADOS MOCK (variados, ~120 registros)
  // ────────────────────────────────────────────────────────
  console.log("🛠️ Gerando chamados...");

  const generateCode = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();
  const rnd  = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const rndDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

  const allTipos = Object.keys(tiposMap);
  
  // localNames que são folhas (sub-locais ou locais sem filhos)
  const locaisLeaf = Object.keys(locaisMap).filter(k =>
    !["Praças de Pedágio", "CFTVs (Câmeras)", "SAUs (Serviço de Atendimento)", "Balanças", "Pátio / Garagem", "Via / Rodovia"].includes(k)
  );

  const criadores = ["pedro.alves", "lucas.lima", "juliana.santos", "marcos.ribeiro", "beatriz.castro", "maria.silva", "bruno.paiva"];
  const statuses = ["SOLICITADO", "EM_ATENDIMENTO", "FECHADO", "FECHADO", "FECHADO"]; // mais chamados fechados para ter TMA
  const descricoes = [
    "Usuário relatou o problema e aguarda atendimento. Situação documentada conforme procedimento padrão.",
    "Ocorrência identificada durante ronda. Equipe acionada para verificação.",
    "Sistema detectou automaticamente a falha via monitoramento. Técnico notificado por e-mail.",
    "Solicitação recebida pelo canal de chamados. Classificada conforme criticidade do local.",
    "Falha confirmada in loco. Necessário agendamento de visita técnica para resolução definitiva.",
    "Incidente relatado por colaborador. Triagem realizada e encaminhado ao responsável do departamento.",
    "Solicitação de manutenção preventiva conforme cronograma de revisão periódica.",
    "Problema recorrente identificado. Ação corretiva em análise pela equipe técnica.",
  ];
  const solucoes = [
    "Problema identificado e resolvido conforme procedimento padrão. Sistema normalizado.",
    "Falha solucionada após substituição de componente defeituoso. Testado e validado.",
    "Ocorrência tratada e área liberada. Medidas preventivas implementadas.",
    "Atendimento realizado com sucesso. Usuário orientado sobre uso correto do equipamento.",
    "Manutenção concluída. Sistema / equipamento operando dentro dos parâmetros normais.",
    "Incidente encerrado após ação corretiva imediata. Sem recorrência observada.",
  ];

  const chamadosToCreate: any[] = [];
  // Gera de fevereiro 2025 até hoje
  const dataInicio = new Date(2025, 1, 1);
  const dataFim = new Date();

  for (let i = 0; i < 120; i++) {
    const tipoName = rnd(allTipos);
    const tipoMeta = tiposMap[tipoName];
    const tipoSla = tiposData.find(t => t.nome === tipoName)?.sla || 24;
    const localName = rnd(locaisLeaf);
    const criadorLogin = rnd(criadores);
    const dataCriacao = rndDate(dataInicio, dataFim);
    const dataVencimento = new Date(dataCriacao);
    dataVencimento.setHours(dataVencimento.getHours() + tipoSla);

    let status = rnd(statuses);
    let tecnicoId: number | null = null;
    let dataAtendimento: Date | null = null;

    if (status !== "SOLICITADO") {
      const possiveisTecnicos = usuariosData.filter(u =>
        u.deptos.includes(tiposData.find(t => t.nome === tipoName)!.depto) &&
        ["TECNICO", "ADMIN"].includes(u.perfil)
      );
      if (possiveisTecnicos.length > 0) {
        tecnicoId = usersMap[rnd(possiveisTecnicos).login];
      } else {
        status = "SOLICITADO";
      }
    }

    if (status === "FECHADO") {
      dataAtendimento = rndDate(dataCriacao, dataFim);
    }

    // ~20% sem técnico (triagem)
    if (Math.random() > 0.8) {
      status = "SOLICITADO";
      tecnicoId = null;
      dataAtendimento = null;
    }

    chamadosToCreate.push({
      codigo: generateCode(),
      titulo: `${tipoName} — ${localName}`,
      descricao: rnd(descricoes),
      status,
      localId: locaisMap[localName],
      tipoId: tipoMeta.id,
      departamentoDestinoId: tipoMeta.deptoId,
      usuarioCriacaoId: usersMap[criadorLogin],
      tecnicoId,
      dataCriacao,
      dataVencimento,
      dataAtendimento,
      solucao: status === "FECHADO" ? rnd(solucoes) : null,
    });
  }

  for (const ch of chamadosToCreate) {
    const dbChamado = await prisma.chamado.create({ data: ch });

    if (ch.status === "EM_ATENDIMENTO") {
      await prisma.interacao.create({
        data: {
          chamadoId: dbChamado.id,
          texto: "Iniciando verificação no local para diagnosticar e resolver a ocorrência.",
          usuarioId: ch.tecnicoId || ch.usuarioCriacaoId,
          data: rndDate(ch.dataCriacao, dataFim),
        },
      });
    }
    if (ch.status === "FECHADO") {
      // Interação de diagnóstico
      await prisma.interacao.create({
        data: {
          chamadoId: dbChamado.id,
          texto: "Técnico chegou ao local e iniciou o diagnóstico.",
          usuarioId: ch.tecnicoId || ch.usuarioCriacaoId,
          data: rndDate(ch.dataCriacao, ch.dataAtendimento || dataFim),
        },
      });
    }
  }

  // ────────────────────────────────────────────────────────
  // 6. PREVENTIVAS
  // ────────────────────────────────────────────────────────
  const previvasData = [
    {
      titulo: "Revisão Mensal Antivírus e Patches",
      descricao: "Executar a verificação de atualizações no Windows Defender e aplicar patches de segurança em todos os computadores da sede.",
      frequenciaDias: 30,
      tecnicoLogin: "ana.costa",
      tipoNome: "Sistema ERP Lento",
      localNome: "Sede Administrativa",
      deptoNome: "TI",
    },
    {
      titulo: "Verificação Semanal das Câmeras CFTV",
      descricao: "Acessar o sistema de monitoramento do CCO e validar que todas as câmeras estão transmitindo corretamente.",
      frequenciaDias: 7,
      tecnicoLogin: "tiago.oliveira",
      tipoNome: "Câmera CFTV fora do ar",
      localNome: "CCO - Centro de Controle Operacional",
      deptoNome: "TI",
    },
    {
      titulo: "Limpeza de Calhas SAU 01",
      descricao: "Manutenção rotineira trimestral para desobstruir calhas da cobertura do SAU 01, evitando infiltrações e vazamentos.",
      frequenciaDias: 90,
      tecnicoLogin: "joao.souza",
      tipoNome: "Limpeza de Calha / Cobertura (SAU)",
      localNome: "SAU 01",
      deptoNome: "Manutenção Predial",
    },
    {
      titulo: "Calibração Mensal Balança Norte",
      descricao: "Procedimento obrigatório de calibração da balança rodoviária Norte conforme resolução INMETRO.",
      frequenciaDias: 30,
      tecnicoLogin: "roberta.dias",
      tipoNome: "Calibração de Balança Rodoviária",
      localNome: "Balança Norte",
      deptoNome: "Manutenção Predial",
    },
    {
      titulo: "Revisão Trimestral de Extintores",
      descricao: "Vistoria de todos os extintores instalados na sede e nos SAUs verificando validade e carga.",
      frequenciaDias: 90,
      tecnicoLogin: "patricia.rocha",
      tipoNome: "Vistoria de extintor vencido",
      localNome: "Sede Administrativa",
      deptoNome: "Segurança do Trabalho",
    },
    {
      titulo: "Troca de Óleo Frota Mensal",
      descricao: "Realização de troca de óleo e filtros nos veículos da frota operacional conforme plano de manutenção.",
      frequenciaDias: 30,
      tecnicoLogin: "fernando.lima",
      tipoNome: "Troca de óleo e filtros",
      localNome: "Box Mecânico 1",
      deptoNome: "Manutenção Veicular",
    },
    {
      titulo: "Backup Semanal dos Servidores",
      descricao: "Verificar execução dos jobs de backup dos servidores principais e validar integridade dos arquivos.",
      frequenciaDias: 7,
      tecnicoLogin: "ana.costa",
      tipoNome: "Backup não executou",
      localNome: "Sala de Servidores (DC)",
      deptoNome: "TI",
    },
  ];

  for (const prev of previvasData) {
    const proxExec = new Date();
    proxExec.setDate(proxExec.getDate() + Math.floor(Math.random() * 20 + 3));

    await prisma.preventiva.create({
      data: {
        titulo: prev.titulo,
        descricao: prev.descricao,
        frequenciaDias: prev.frequenciaDias,
        proximaExecucao: proxExec,
        tecnicoId: usersMap[prev.tecnicoLogin],
        tipoId: tiposMap[prev.tipoNome]?.id || tiposMap[allTipos[0]].id,
        localId: locaisMap[prev.localNome],
        departamentoDestinoId: deptosMap[prev.deptoNome],
      },
    });
  }

  console.log(`✅ Seed completo! ${chamadosToCreate.length} chamados | ${tiposData.length} tipos | ${previvasData.length} preventivas | ${usuariosData.length} usuários`);
}

main()
  .catch((e) => { console.error("Erro no seed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
