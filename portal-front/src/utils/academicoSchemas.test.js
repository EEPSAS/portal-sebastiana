import { describe, test, expect, vi } from "vitest";
import {
  validarContratoZod,
  validarFormularioZod,
  TurmaSchema,
  TurmaResumoSchema,
  NotaDiarioSchema,
  PeriodoLetivoSchema,
  CicloSchema,
  SalvarTurmaInputSchema,
  BoletimEmissaoSchema,
  TurnoConfigItemSchema,
  ArquivoCsvUploadSchema,
  DecisaoDisciplinaCsvSchema,
  ImportarRelatorioInputSchema,
  BoletimAlunoConsultaInputSchema,
  BoletimAlunoSchema,
  ComparativoTurmaSchema,
} from "./academicoSchemas";

/**
 * academicoSchemas.test.js - Testes Unitários dos Contratos e Validações Zod
 *
 * Papel Didático:
 * Garante que todos os schemas Zod espelhados com o Spatie Laravel Data do backend
 * validem corretamente dados legítimos e bloqueiem payloads corrompidos ou fora do contrato.
 */
describe("academicoSchemas - Utilitários e Schemas de Contrato", () => {
  test("validarContratoZod retorna dados limpos em caso de sucesso e lança erro em divergência", () => {
    const turmaValida = {
      id_turma: 1,
      nome_identificador: "1º Ano A",
      ano_letivo: 2026,
      turno: "Matutino",
    };

    expect(validarContratoZod(TurmaSchema, turmaValida, "Teste Turma")).toEqual(turmaValida);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      validarContratoZod(TurmaSchema, { id_turma: "invalido" }, "Teste Falha")
    ).toThrow(/Falha de validação de contrato em Teste Falha/);
    consoleSpy.mockRestore();
  });

  test("validarFormularioZod retorna objeto padronizado com flag valido e mensagem amigável", () => {
    const invalido = validarFormularioZod(SalvarTurmaInputSchema, {
      nome_identificador: "",
      turno: "Matutino",
      ano_letivo: 2026,
    });

    expect(invalido.valido).toBe(false);
    expect(invalido.mensagem).toContain("obrigatório");

    const valido = validarFormularioZod(SalvarTurmaInputSchema, {
      nome_identificador: "2º Ano B",
      turno: "Vespertino",
      ano_letivo: "2026",
    });

    expect(valido.valido).toBe(true);
    expect(valido.dados.ano_letivo).toBe(2026);
  });

  test("TurmaResumoSchema, NotaDiarioSchema, PeriodoLetivoSchema e CicloSchema validam payloads da API", () => {
    expect(
      TurmaResumoSchema.safeParse({
        id_turma: 10,
        nome_identificador: "3º Ano A",
        turno: "Integral",
        ano_letivo: 2026,
        total_alunos: 32,
        media_geral: 74.5,
        taxa_presenca: 91.2,
        taxa_absenteismo: 8.8,
        total_avaliados: 30,
        distribuicao: { acima: 50, na_media: 30, abaixo: 20 },
      }).success
    ).toBe(true);

    expect(
      NotaDiarioSchema.safeParse({
        id_nota: 1,
        turma_id: 10,
        disciplina_id: 5,
        usuario_id: 100,
        periodo_letivo: "1º Trimestre",
        valor_nota: 24.5,
        valor_maximo: 30,
        valor_maximo_periodo: 30,
        situacao: "Aprovado",
      }).success
    ).toBe(true);

    expect(
      PeriodoLetivoSchema.safeParse({
        id_periodo_letivo: 1,
        ano: 2026,
        tipo_divisao: "trimestre",
        total_pontos: 100,
        ativo: true,
      }).success
    ).toBe(true);

    expect(
      CicloSchema.safeParse({
        id_ciclo: 2,
        nome: "Ensino Médio",
      }).success
    ).toBe(true);
  });

  test("TurnoConfigItemSchema rejeita turno ativo quando horário final é anterior ou igual ao inicial", () => {
    const turnoInvalido = TurnoConfigItemSchema.safeParse({
      id: "Matutino",
      nome: "Manhã",
      icone: "bi-sun",
      inicio: "12:00",
      fim: "07:00",
      ativo: true,
      descricao: "Turno matutino",
    });

    expect(turnoInvalido.success).toBe(false);

    // Se inativo, não exige que fim > inicio
    const turnoInativo = TurnoConfigItemSchema.safeParse({
      id: "Noturno",
      nome: "Noite",
      icone: "bi-moon",
      inicio: "22:00",
      fim: "18:00",
      ativo: false,
      descricao: "Turno noturno",
    });

    expect(turnoInativo.success).toBe(true);
  });

  test("ArquivoCsvUploadSchema e DecisaoDisciplinaCsvSchema validam regras de negócio do upload CSV", () => {
    expect(ArquivoCsvUploadSchema.safeParse({ name: "notas.pdf", size: 500 }).success).toBe(false);
    expect(ArquivoCsvUploadSchema.safeParse({ name: "notas.csv", size: 0 }).success).toBe(false);
    expect(
      ArquivoCsvUploadSchema.safeParse({ name: "notas.csv", size: 11 * 1024 * 1024 }).success
    ).toBe(false);
    expect(ArquivoCsvUploadSchema.safeParse({ name: "notas.csv", size: 2048 }).success).toBe(true);

    // Vincular sem disciplina_id -> falha
    expect(
      DecisaoDisciplinaCsvSchema.safeParse({ acao: "vincular", disciplina_id: "" }).success
    ).toBe(false);

    // Criar nova sem nome_nova ou sem ciclo_id -> falha
    expect(
      DecisaoDisciplinaCsvSchema.safeParse({
        acao: "criar_nova",
        nome_nova: "Robótica",
        ciclo_id: "",
      }).success
    ).toBe(false);

    // Criar nova completa -> sucesso
    expect(
      DecisaoDisciplinaCsvSchema.safeParse({
        acao: "criar_nova",
        nome_nova: "Robótica",
        ciclo_id: 1,
        aulas_semanais: 2,
      }).success
    ).toBe(true);

    expect(
      ImportarRelatorioInputSchema.safeParse({
        turmaId: 1,
        arquivo: { name: "diario.csv", size: 1024 },
        periodo_letivo: "1º Trimestre",
      }).success
    ).toBe(true);
  });

  test("BoletimEmissaoSchema, BoletimAlunoConsultaInputSchema, BoletimAlunoSchema e ComparativoTurmaSchema validam fluxos de boletim", () => {
    expect(
      BoletimEmissaoSchema.safeParse({
        alunosSelecionadosIds: [],
        formato: "pdf",
        periodoSelecionado: "1º Trimestre",
      }).success
    ).toBe(false);

    expect(
      BoletimAlunoConsultaInputSchema.safeParse({
        alunoId: 5,
        turmaId: 2,
        trimestre: 4,
      }).success
    ).toBe(false);

    expect(
      BoletimAlunoConsultaInputSchema.safeParse({
        alunoId: "5",
        turmaId: "2",
        trimestre: "2",
      }).success
    ).toBe(true);

    expect(
      BoletimAlunoSchema.safeParse({
        turma_id: 2,
        aluno_id: 5,
        periodo_selecionado: "1º Trimestre",
        boletim: [],
        grafico_boletim: [],
      }).success
    ).toBe(true);

    expect(
      ComparativoTurmaSchema.safeParse({
        turma_id: 2,
        aluno_id: 5,
        periodo_selecionado: "1º Trimestre",
        frequencia_aluno_global: 95,
        frequencia_turma_global: 90,
        comparativo: [],
        radar: { labels: [], series: [] },
      }).success
    ).toBe(true);
  });
});
