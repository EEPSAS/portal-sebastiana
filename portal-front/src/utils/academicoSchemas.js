import { z } from "zod";

/**
 * academicoSchemas.js - Contratos e Schemas de Revalidação Estrita em Runtime (Zod)
 *
 * Papel Didático:
 * Espelha 1:1 os Data Objects do Spatie Laravel Data no backend (app/Data/Academico/*)
 * e o contrato oficial em apiContract.md.
 * - Impede que divergências de chaves (ex: `nome` vs `nome_identificador`) cheguem silenciosamente aos componentes;
 * - Força a revalidação de entradas de formulários, emissões de boletins e dados persistidos em localStorage.
 */

// ============================================================================
// 1. Utilitários de Execução e Diagnóstico de Contratos Zod
// ============================================================================

/**
 * Executa a revalidação estrita (Opção A) de um payload vindo da API contra seu Schema Zod.
 * Caso haja divergência estrutural ou de tipo, interrompe o fluxo e aponta o campo exato.
 */
export function validarContratoZod(schema, payload, contexto = "API Acadêmica") {
  const resultado = schema.safeParse(payload);

  if (!resultado.success) {
    const detalhes = resultado.error.issues
      .map((issue) => {
        const caminho = issue.path.length > 0 ? issue.path.join(".") : "raiz";
        return `${caminho} (${issue.message})`;
      })
      .join("; ");

    console.error(`[Violação de Contrato Zod - ${contexto}]`, {
      detalhes,
      issues: resultado.error.issues,
      payloadRecebido: payload,
    });

    throw new Error(`Falha de validação de contrato em ${contexto}: ${detalhes}`);
  }

  return resultado.data;
}

/**
 * Valida dados de formulários e interações do usuário antes de executar ações ou envios HTTP.
 * Retorna objeto padronizado com flag `valido`, `dados` limpos ou `mensagem` amigável.
 */
export function validarFormularioZod(schema, payload) {
  const resultado = schema.safeParse(payload);

  if (!resultado.success) {
    const primeiraIssue = resultado.error.issues[0];
    return {
      valido: false,
      dados: null,
      mensagem: primeiraIssue?.message || "Verifique os campos preenchidos.",
      issues: resultado.error.issues,
    };
  }

  return {
    valido: true,
    dados: resultado.data,
    mensagem: "",
    issues: [],
  };
}

// ============================================================================
// 2. Schemas de Saída da API (Espelhados com Spatie Laravel Data)
// ============================================================================

// Schema da Turma Escolar (espelha App\Data\Academico\TurmaData)
export const TurmaSchema = z.object({
  id_turma: z.number().int(),
  nome_identificador: z.string().min(1, "nome_identificador da turma é obrigatório"),
  ciclo_id: z.number().int().nullable().optional(),
  ciclo_nome: z.string().nullable().optional(),
  periodo_letivo_id: z.number().int().nullable().optional(),
  ano_letivo: z.number().int(),
  turno: z.string().min(1),
  capacidade_maxima: z.number().int().optional(),
  status: z.string().optional(),
  total_alunos: z.number().int().optional(),
  total_disciplinas: z.number().int().optional(),
});

export const ListaTurmasSchema = z.array(TurmaSchema);

// Schema da Distribuição de Desempenho (espelha DistribuicaoDesempenhoData)
export const DistribuicaoDesempenhoSchema = z.object({
  acima: z.number(),
  na_media: z.number(),
  abaixo: z.number(),
});

// Schema do Resumo Analítico por Turma (espelha App\Data\Academico\TurmaResumoData)
export const TurmaResumoSchema = z.object({
  id_turma: z.number().int(),
  nome_identificador: z.string().min(1, "nome_identificador do resumo é obrigatório"),
  ciclo_id: z.number().int().nullable().optional(),
  ciclo_nome: z.string().nullable().optional(),
  turno: z.string(),
  ano_letivo: z.number().int(),
  status: z.string().optional(),
  total_alunos: z.number().int(),
  media_geral: z.number(),
  taxa_presenca: z.number(),
  taxa_absenteismo: z.number(),
  total_avaliados: z.number().int(),
  distribuicao: DistribuicaoDesempenhoSchema.optional(),
});

export const ListaTurmaResumoSchema = z.array(TurmaResumoSchema);

// Schema de Aluno Matriculado na Turma (espelha AlunoTurmaResource)
export const AlunoTurmaSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  email: z.string(),
  id_matricula: z.number().int().nullable().optional(),
  data_matricula: z.string().nullable().optional(),
  status_matricula: z.string().optional(),
});

export const ListaAlunosTurmaSchema = z.array(AlunoTurmaSchema);

// Schema de Nota e Frequência do Diário Escolar (espelha App\Data\Academico\NotaDiarioData)
export const NotaDiarioSchema = z.object({
  id_nota: z.number().int(),
  turma_id: z.number().int(),
  disciplina_id: z.number().int(),
  usuario_id: z.number().int(),
  periodo_letivo: z.string(),
  tipo_avaliacao: z.string().nullable().optional(),
  valor_nota: z.number(),
  valor_maximo: z.number(),
  valor_maximo_periodo: z.number(),
  percentual_faltas: z.number().nullable().optional(),
  total_faltas: z.number().int().nullable().optional(),
  total_aulas_previstas: z.number().int().nullable().optional(),
  situacao: z.string(),
  data_registro: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  aluno: z
    .object({
      id: z.number().int(),
      name: z.string(),
      email: z.string(),
    })
    .optional(),
  disciplina: z
    .object({
      id_disciplina: z.number().int(),
      nome: z.string(),
      carga_horaria_anual: z.number().int().nullable().optional(),
      aulas_semanais: z.number().int().nullable().optional(),
    })
    .optional(),
});

export const ListaNotasDiarioSchema = z.array(NotaDiarioSchema);

// Espelha FrequenciaResource para validar o retorno do lançamento individual.
export const FrequenciaManualSchema = z.object({
  id_frequencia: z.number().int(),
  turma_id: z.number().int(),
  disciplina_id: z.number().int(),
  usuario_id: z.number().int(),
  data_aula: z.string(),
  quantidade_aulas: z.number().int(),
  status_presenca: z.string(),
  justificativa: z.string().nullable(),
});

// Schema de Divisão e Período Letivo (espelha PeriodoLetivoResource)
export const PeriodoLetivoDivisaoSchema = z.object({
  id_divisao: z.number().int().optional(),
  periodo_letivo_id: z.number().int().optional(),
  numero: z.number().int().optional(),
  nome: z.string().min(1),
  pontos: z.number(),
  data_inicio: z.string().nullable().optional(),
  data_fim: z.string().nullable().optional(),
  ordem: z.number().int().optional(),
  is_atual: z.boolean().optional(),
});

export const PeriodoLetivoSchema = z.object({
  id_periodo_letivo: z.number().int(),
  ano: z.number().int(),
  tipo_divisao: z.string(),
  tipo_divisao_label: z.string().optional(),
  total_pontos: z.number(),
  data_inicio: z.string().nullable().optional(),
  data_fim: z.string().nullable().optional(),
  ativo: z.boolean(),
  status: z.string().optional(),
  total_turmas: z.number().int().optional(),
  divisoes: z.array(PeriodoLetivoDivisaoSchema).optional().default([]),
});

export const ListaPeriodosLetivosSchema = z.array(PeriodoLetivoSchema);

// Schema de Ciclo Escolar (espelha App\Data\Academico\CicloData)
export const CicloSchema = z.object({
  id_ciclo: z.number().int(),
  nome: z.string().min(1),
  descricao: z.string().nullable().optional(),
  total_disciplinas: z.number().int().optional(),
  total_turmas: z.number().int().optional(),
  total_aulas_semanais: z.number().int().optional(),
  carga_horaria_anual_total: z.number().int().optional(),
  disciplinas: z.array(z.any()).optional().default([]),
  turmas: z
    .array(
      z.object({
        id_turma: z.number().int(),
        nome_identificador: z.string(),
        turno: z.string().optional(),
        ano_letivo: z.number().int().optional(),
      })
    )
    .optional()
    .default([]),
});

export const ListaCiclosSchema = z.array(CicloSchema);

// ============================================================================
// 3. Schemas de Entrada / Ação do Usuário e Storage Local
// ============================================================================

// Validação de criação/edição de Turma antes do envio para a API
export const SalvarTurmaInputSchema = z.object({
  nome_identificador: z
    .string()
    .trim()
    .min(1, "O nome identificador da turma é obrigatório.")
    .max(255, "O nome identificador deve ter no máximo 255 caracteres."),
  ciclo_id: z.coerce.number().int().positive().nullable().optional(),
  periodo_letivo_id: z.coerce.number().int().positive().nullable().optional(),
  turno: z.enum(["Matutino", "Vespertino", "Noturno", "Integral"], {
    error: "Selecione um turno válido (Matutino, Vespertino, Noturno ou Integral).",
  }),
  ano_letivo: z.coerce
    .number()
    .int()
    .min(2000, "Ano letivo inválido.")
    .max(2100, "Ano letivo inválido."),
  capacidade_maxima: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["Ativa", "Inativa", "Concluída"]).optional(),
});

// Validação de emissão do Boletim Escolar Técnico (ModalGerarBoletim)
export const BoletimEmissaoSchema = z.object({
  alunosSelecionadosIds: z
    .array(z.string().min(1))
    .min(1, "Selecione pelo menos um aluno na lista para gerar o boletim."),
  formato: z.enum(["pdf", "excel"]),
  periodoSelecionado: z.string().min(1),
});

// Validação de criação/edição de Ciclo Escolar
export const SalvarCicloInputSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "O nome do ciclo escolar é obrigatório.")
    .max(100, "O nome do ciclo deve ter no máximo 100 caracteres."),
  descricao: z
    .string()
    .max(256, "A descrição deve ter no máximo 256 caracteres.")
    .nullable()
    .optional(),
});

// Validação de configuração de Turnos Escolares (inclusive revalidação do localStorage)
export const TurnoConfigItemSchema = z
  .object({
    id: z.enum(["Matutino", "Vespertino", "Noturno", "Integral"]),
    nome: z.string().min(1),
    icone: z.string().min(1),
    cor: z.string().optional(),
    inicio: z.string().regex(/^\d{2}:\d{2}$/, "Horário inicial inválido."),
    fim: z.string().regex(/^\d{2}:\d{2}$/, "Horário final inválido."),
    ativo: z.boolean(),
    descricao: z.string(),
  })
  .refine((turno) => !turno.ativo || turno.fim > turno.inicio, {
    message: "O horário de término do turno ativo deve ser posterior ao horário de início.",
  });

export const ListaTurnosConfigSchema = z.array(TurnoConfigItemSchema).min(1);

// ============================================================================
// 4. Schemas de Importação CSV (Antes e Depois do Envio HTTP)
// ============================================================================

// Valida o arquivo físico selecionado antes de enviar o FormData (extensão .csv, > 0B e <= 10MB)
export const ArquivoCsvUploadSchema = z
  .custom(
    (val) =>
      val !== null &&
      typeof val === "object" &&
      typeof val.name === "string" &&
      typeof val.size === "number",
    { message: "Por favor, selecione um arquivo CSV para enviar." }
  )
  .refine((file) => file.name.toLowerCase().endsWith(".csv"), {
    message:
      "O formato de arquivo é incompatível com o sistema. Por favor, envie exclusivamente um arquivo no formato CSV.",
  })
  .refine((file) => file.size > 0, {
    message: "O arquivo CSV selecionado está vazio.",
  })
  .refine((file) => file.size <= 10 * 1024 * 1024, {
    message: "O arquivo não pode exceder 10MB.",
  });

// Valida cada decisão de conciliação de disciplina no modal (restrito a disciplinas já vinculadas à turma ou ignorar coluna)
export const DecisaoDisciplinaCsvSchema = z
  .object({
    // Bloqueia 'criar_nova': o importador CSV nunca cria disciplinas nem altera vínculos curriculares
    acao: z.enum(["vincular", "ignorar"], {
      error: "Selecione uma ação de conciliação válida.",
    }),
    disciplina_id: z.union([z.literal(""), z.coerce.number().int().positive()]).nullable().optional(),
  })
  .superRefine((decisao, ctx) => {
    if (decisao.acao === "vincular") {
      const idNum = Number(decisao.disciplina_id);
      if (!Number.isInteger(idNum) || idNum <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["disciplina_id"],
          message: "Selecione uma disciplina vinculada à turma para correlacionar.",
        });
      }
    }
  });

export const MapeamentosDisciplinasCsvSchema = z.record(z.string(), DecisaoDisciplinaCsvSchema);

export const MapeamentosAlunosCsvSchema = z.record(
  z.string(),
  z.union([
    z.literal("ignorar"),
    z.literal("nenhum"),
    z.coerce.number().int().positive("Selecione um aluno válido na desambiguação."),
  ])
);

// Valida todo o payload de entrada da importação CSV antes da chamada HTTP (espelha ImportarRelatorioInputData)
export const ImportarRelatorioInputSchema = z.object({
  turmaId: z.coerce.number().int().positive("Turma inválida para importação."),
  arquivo: ArquivoCsvUploadSchema,
  periodo_letivo: z.string().max(100).nullable().optional(),
  data_aula: z.string().nullable().optional(),
  decisao_divergencias: z.enum(["atualizar", "manter"]).nullable().optional(),
  mapeamentos_alunos: MapeamentosAlunosCsvSchema.optional(),
  mapeamentos_disciplinas: MapeamentosDisciplinasCsvSchema.optional(),
});

// Sub-schemas de saída do processamento CSV (espelham os DTOs em App\Data\Academico\Csv\*)
export const AmbiguidadeAlunoCsvSchema = z.object({
  nome_csv: z.string(),
  candidatos: z.array(
    z.object({
      id: z.number().int(),
      name: z.string(),
      email: z.string(),
      ja_matriculado: z.boolean(),
    })
  ),
});

export const DivergenciaNotaCsvSchema = z.object({
  usuario_id: z.number().int(),
  nome_aluno: z.string(),
  disciplina_id: z.number().int(),
  nome_disciplina: z.string(),
  periodo_letivo: z.string(),
  nota_atual: z.number(),
  nova_nota: z.number(),
  tipo_divergencia: z.enum(["nota", "falta", "ambos"]).optional(),
  faltas_atuais: z.number().int().nullable().optional(),
  novas_faltas: z.number().int().nullable().optional(),
});

export const DisciplinaPendenteCsvSchema = z.object({
  nome_csv: z.string(),
  sugestao_disciplina_id: z.number().int().nullable().optional(),
  sugestao_disciplina_nome: z.string().nullable().optional(),
});

export const ResumoDadosRelatorioCsvSchema = z.object({
  status: z.enum(["sucesso", "pendente_confirmacao"]),
  tipo_pendencia: z
    .enum(["conciliacao_disciplinas", "homonimos", "divergencias_notas"])
    .nullable()
    .optional(),
  message: z.string(),
  linhas_lidas: z.number().int(),
  periodo_aplicado: z.string().nullable().optional(),
  data_referencia: z.string().nullable().optional(),
  alunos_identificados: z.number().int(),
  alunos_ignorados: z.array(
    z.object({
      nome_csv: z.string(),
      motivo: z.string(),
      email: z.string().nullable().optional(),
    })
  ),
  total_ignorados: z.number().int(),
  notas_sincronizadas: z.number().int(),
  frequencias_sincronizadas: z.number().int(),
  alertas: z.array(z.string()),
});

// Envelope completo de retorno da importação CSV (espelha 1:1 RelatorioImportadoData)
export const RelatorioImportadoSchema = z.object({
  status: z.enum(["sucesso", "pendente_confirmacao"]),
  tipo_pendencia: z
    .enum(["conciliacao_disciplinas", "homonimos", "divergencias_notas"])
    .nullable()
    .optional(),
  message: z.string(),
  turma: z.object({
    id_turma: z.number().int().nullable(),
    nome_identificador: z.string().nullable(),
  }),
  ambiguidades: z.array(AmbiguidadeAlunoCsvSchema),
  divergencias: z.array(DivergenciaNotaCsvSchema),
  disciplinas_pendentes: z.array(DisciplinaPendenteCsvSchema),
  catalogo_disciplinas: z.array(z.any()),
  dados: ResumoDadosRelatorioCsvSchema,
});

// ============================================================================
// 5. Schemas do Boletim e Comparativo do Aluno (boletimService.js)
// ============================================================================

export const BoletimIdentificadoresInputSchema = z.object({
  alunoId: z.coerce.number().int().positive("Informe o aluno e a turma para consultar o boletim."),
  turmaId: z.coerce.number().int().positive("Informe o aluno e a turma para consultar o boletim."),
});

export const BoletimAlunoConsultaInputSchema = BoletimIdentificadoresInputSchema.extend({
  trimestre: z.coerce
    .number()
    .int()
    .refine((val) => [1, 2, 3].includes(val), {
      message: "O trimestre deve ser 1, 2 ou 3.",
    }),
});

export const ItemBoletimAlunoSchema = z.object({
  disciplina_id: z.number().int(),
  nome_disciplina: z.string().min(1),
  nota_obtida: z.number(),
  valor_maximo: z.number(),
  somatorio_faltas: z.number().int(),
  total_aulas: z.number().int(),
  status: z.string(),
  id: z.number().int(),
  materia: z.string(),
  pontos: z.number(),
  cor: z.string(),
});

export const ItemGraficoBoletimSchema = z.object({
  id: z.number().int(),
  materia: z.string(),
  pontos: z.number(),
  cor: z.string(),
});

// Espelha 1:1 App\Data\Academico\Boletim\BoletimAlunoData (BoletimResource)
export const BoletimAlunoSchema = z.object({
  turma_id: z.number().int(),
  aluno_id: z.number().int(),
  periodo_selecionado: z.string(),
  boletim: z.array(ItemBoletimAlunoSchema),
  grafico_boletim: z.array(ItemGraficoBoletimSchema),
});

export const ItemComparativoTurmaSchema = z.object({
  disciplina_id: z.number().int(),
  nome_disciplina: z.string().min(1),
  nota_aluno: z.number(),
  faltas_aluno: z.number().int(),
  frequencia_aluno: z.number().nullable(),
  media_turma: z.number(),
  media_faltas_turma: z.number(),
  frequencia_turma: z.number().nullable(),
  valor_maximo: z.number(),
});

// Espelha 1:1 App\Data\Academico\Boletim\ComparativoTurmaData (ComparativoTurmaResource)
export const ComparativoTurmaSchema = z.object({
  turma_id: z.number().int(),
  aluno_id: z.number().int(),
  periodo_selecionado: z.string(),
  frequencia_aluno_global: z.number().nullable(),
  frequencia_turma_global: z.number().nullable(),
  comparativo: z.array(ItemComparativoTurmaSchema),
  radar: z.object({
    labels: z.array(z.string()),
    series: z.array(
      z.object({
        name: z.string(),
        data: z.array(z.number()),
        faltas: z.array(z.number()),
      })
    ),
  }),
});

// ============================================================================
// 3. Schemas do Painel Analítico Geral (AlunoResumoGlobalResource & DashboardGeralResource)
// ============================================================================

export const ItemRankingAlunoSchema = z.object({
  posicao: z.number().int(),
  nome: z.string(),
  valor: z.number(),
  cor: z.string().optional(),
  corBadge: z.string().optional(),
});

// Espelha 1:1 App\Http\Resources\AlunoResumoGlobalResource
export const AlunoResumoGlobalSchema = z.object({
  aluno: z
    .object({
      id: z.number().int(),
      nome: z.string(),
      email: z.string(),
    })
    .nullable(),
  turma: z
    .object({
      id_turma: z.number().int(),
      nome_identificador: z.string(),
      ciclo: z.string().nullable().optional(),
      turno: z.string().nullable().optional(),
      ano_letivo: z.number().int().nullable().optional(),
    })
    .nullable(),
  periodo_selecionado: z.string(),
  media_geral: z.number(),
  frequencia_global: z.number(),
  total_alertas_risco: z.number().int(),
  alertas_risco: z.array(z.record(z.string(), z.unknown())),
  student_stats: z.object({
    frequenciaGeral: z.object({
      porcentagem: z.number(),
      classificacao: z.string(),
    }),
    mediaNotas: z.object({
      valor: z.string(),
      comparacao: z.string(),
    }),
    leituraAtual: z.object({
      livro: z.string(),
      autor: z.string().optional(),
      pagina: z.string(),
    }),
    proximaNotificacao: z.object({
      titulo: z.string(),
      tempoRestante: z.string(),
    }),
    destaques: z.record(z.string(), z.unknown()).optional(),
  }),
  destaques: z
    .object({
      melhor_nota: z.object({
        nota: z.string(),
        disciplina: z.string(),
        mensagem: z.string(),
        tem_lancamento: z.boolean(),
      }),
      nota_atencao: z.object({
        nota: z.string(),
        disciplina: z.string(),
        mensagem: z.string(),
        em_alerta: z.boolean(),
        tem_lancamento: z.boolean(),
      }),
    })
    .nullable(),
  desempenho: z
    .object({
      disciplinas: z.object({
        melhores: z.array(ItemRankingAlunoSchema),
        piores: z.array(ItemRankingAlunoSchema),
      }),
      frequencias: z.object({
        melhores: z.array(ItemRankingAlunoSchema),
        piores: z.array(ItemRankingAlunoSchema),
      }),
    })
    .nullable(),
});

// Espelha 1:1 App\Http\Resources\DashboardGeralResource
export const DashboardGeralSchema = z.object({
  kpis: z.object({
    total_alunos: z.number().int(),
    media_geral: z.number().nullable(),
    frequencia_media: z.string().nullable(),
    noticias_publicadas: z.number().int(),
    total_turmas: z.number().int(),
  }),
  resumo_turmas: z.object({
    medias: z.array(
      z.object({
        id: z.number().int(),
        turma: z.string(),
        nota: z.number(),
      })
    ),
    frequencias: z.array(
      z.object({
        id: z.number().int(),
        turma: z.string(),
        percentual: z.number(),
      })
    ),
  }),
  disciplinas_docente: z.array(z.string()),
  disciplinas_detalhadas: z.array(
    z.object({
      id_disciplina: z.number().int(),
      nome: z.string(),
      aulas_semanais: z.number().int().nullable().optional(),
      carga_horaria_anual: z.number().int().nullable().optional(),
      ciclos: z.array(z.string()).optional(),
      modo_simulacao: z.boolean().optional(),
      turmas: z
        .array(
          z.object({
            id_turma: z.number().int(),
            nome_identificador: z.string(),
            total_alunos: z.number().int().optional(),
          })
        )
        .optional(),
      medias: z
        .array(
          z.object({
            id: z.number().int(),
            turma: z.string(),
            nota: z.number(),
            aproveitamento: z.number().optional(),
          })
        )
        .optional(),
      frequencias: z
        .array(
          z.object({
            id: z.number().int(),
            turma: z.string(),
            percentual: z.number(),
          })
        )
        .optional(),
      risco: z
        .object({
          alunosAbaixoDaMedia: z.number().int(),
          alunosComFrequenciaInsuficiente: z.number().int(),
          alunosPorNota: z.array(z.record(z.string(), z.unknown())),
          alunosPorFrequencia: z.array(z.record(z.string(), z.unknown())),
        })
        .optional(),
    })
  ),
  ultimas_notificacoes: z.array(z.record(z.string(), z.unknown())),
  periodo_contexto: z.record(z.string(), z.unknown()).nullable(),
});
