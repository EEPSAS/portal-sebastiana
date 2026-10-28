/**
 * GeralProfessor (index.jsx) - Painel Analítico do Professor Conectado às Disciplinas e Ciclos
 *
 * Papel Didático:
 * Atende à Diretriz 3.4a (28/10/2026):
 * Consome o endpoint `/api/dashboard/geral` (`fetchDashboardGeral`) para exibir o contexto
 * real da role `professor` baseado nas Disciplinas às quais ele está vinculado, seus Ciclos
 * e as Turmas/Alunos herdados. Caso ainda não existam dados reais na API, mantém fallback
 * seguro para os dados demonstrativos (`materiasProfessorMock`).
 */

import { useEffect, useMemo, useState } from "react";
import "../especialista/GeralEspecialista.css";
import GeralMediumCards from "../especialista/Cards/ResumoTurmasCard";
import AlunosRiscoCards from "./Cards/AlunosRiscoCards";
import materiasProfessorMock from "./materiasProfessorMock";
import { fetchDashboardGeral } from "../../../../services/geralService";

const GeralProfessor = () => {
  const [dadosApi, setDadosApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [materiaSelecionadaId, setMateriaSelecionadaId] = useState("");

  useEffect(() => {
    let ativo = true;
    fetchDashboardGeral()
      .then((payload) => {
        if (ativo) {
          setDadosApi(payload || null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  // Constrói a lista de matérias do professor a partir de `disciplinas_detalhadas` da API
  // ou utiliza o fallback demonstrativo caso o professor ainda não tenha disciplinas com dados
  const materiasDisponiveis = useMemo(() => {
    const detalhadas = dadosApi?.disciplinas_detalhadas;
    if (Array.isArray(detalhadas) && detalhadas.length > 0) {
      const mediasGerais = dadosApi?.resumo_turmas?.medias || [];
      const freqGerais = dadosApi?.resumo_turmas?.frequencias || [];

      return detalhadas
        .map((disc) => {
          const turmasNomes = new Set(
            (disc.turmas || []).map((t) => t.nome_identificador)
          );
          const mediasDaDisciplina =
            turmasNomes.size > 0
              ? mediasGerais.filter((m) => turmasNomes.has(m.turma))
              : mediasGerais;
          const freqDaDisciplina =
            turmasNomes.size > 0
              ? freqGerais.filter((f) => turmasNomes.has(f.turma))
              : freqGerais;

          return {
            id: String(disc.id_disciplina),
            nome: disc.nome,
            aulas_semanais: disc.aulas_semanais || 4,
            carga_horaria_anual: disc.carga_horaria_anual || 160,
            ciclos: disc.ciclos || [],
            turmas: disc.turmas || [],
            origemReal: true,
            risco: {
              alunosAbaixoDaMedia: 0,
              alunosComFrequenciaInsuficiente: 0,
              alunosPorNota: [],
              alunosPorFrequencia: [],
            },
            medias: mediasDaDisciplina.map((m) => ({
              ...m,
              nota: Number(m.nota || 0) <= 10 ? Number(m.nota || 0) * 10 : Number(m.nota || 0),
            })),
            frequencias: freqDaDisciplina,
          };
        })
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    }

    return [...materiasProfessorMock].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR")
    );
  }, [dadosApi]);

  const materiaSelecionada =
    materiasDisponiveis.find((m) => m.id === materiaSelecionadaId) ??
    materiasDisponiveis[0];

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
        <span className="text-muted small">Carregando disciplinas e turmas vinculadas...</span>
      </div>
    );
  }

  if (!materiaSelecionada) {
    return (
      <p className="text-muted">
        Nenhuma disciplina vinculada ao seu perfil no momento.
      </p>
    );
  }

  return (
    <div className="teacher-overview">
      {/* Seletor de Disciplinas Vinculadas ao Professor */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div
          className="btn-group flex-wrap p-1 bg-light rounded-pill border"
          role="group"
          aria-label="Selecionar matéria"
        >
          {materiasDisponiveis.map((materia) => (
            <button
              type="button"
              key={materia.id}
              className={`btn btn-sm rounded-pill px-3 fw-semibold transition ${
                materia.id === materiaSelecionada.id
                  ? "btn-primary shadow-sm text-white"
                  : "text-secondary border-0"
              }`}
              aria-pressed={materia.id === materiaSelecionada.id}
              onClick={() => setMateriaSelecionadaId(materia.id)}
            >
              {materia.nome}
            </button>
          ))}
        </div>

        {/* Metadados da Disciplina (Ciclos, Aulas Semanais e Turmas Herdadas) */}
        {materiaSelecionada.origemReal && (
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
              {materiaSelecionada.aulas_semanais} aulas/sem •{" "}
              {materiaSelecionada.carga_horaria_anual}h anuais
            </span>
            {materiaSelecionada.ciclos?.length > 0 && (
              <span className="badge bg-secondary-subtle text-dark rounded-pill px-3 py-2">
                Ciclo(s): {materiaSelecionada.ciclos.join(", ")}
              </span>
            )}
            <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2">
              {materiaSelecionada.turmas?.length || 0} turma(s) vinculada(s)
            </span>
          </div>
        )}
      </div>

      <div className="row g-3 mb-3">
        <AlunosRiscoCards
          dados={materiaSelecionada.risco}
          periodo={
            materiaSelecionada.origemReal
              ? "Monitoramento ativo das turmas vinculadas"
              : "Período trimestral demonstrativo"
          }
        />
      </div>

      {!materiaSelecionada.origemReal && (
        <p className="text-muted small mb-2">
          Indicadores demonstrativos por matéria; vincule disciplinas ao docente para exibir dados reais.
        </p>
      )}

      <GeralMediumCards
        medias={materiaSelecionada.medias}
        frequencias={materiaSelecionada.frequencias}
        escalaNotaMaxima={100}
        mostrarLinhasReferencia={false}
        badgeMedia="Meta mín. 60%"
      />
    </div>
  );
};

export default GeralProfessor;
