/**
 * EsperaProfessor.jsx - Tela Semântica de Aprovação de Login Institucional (Alunos e Professores)
 *
 * Papel Didático:
 * Atende à Diretriz 2 (Aprovação de Login):
 * Todo usuário que realiza login com e-mail institucional (@aluno.mg.gov.br ou @educacao.mg.gov.br)
 * aguarda aprovação e vínculo (com Turma para Aluno ou com Disciplina para Professor) antes de
 * acessar o Dashboard. Oferece mensagem acolhedora, botão de atualizar página sem exigir re-login
 * e botão de sair que retorna ao Portal Público (/).
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import * as authService from "../../services/authService";

const EsperaProfessor = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [verificando, setVerificando] = useState(false);
  const [aviso, setAviso] = useState("");

  const isAluno = user?.role === "aluno" || user?.role === "padrao";
  const papelLabel = isAluno ? "Estudante" : "Professor(a)";

  /**
   * Revalida o token do usuário na API (GET /api/user) sem exigir novo login
   * para verificar se o Especialista ou Administrador já aprovou e vinculou o cadastro.
   */
  const handleVerificarStatus = async () => {
    setVerificando(true);
    setAviso("");

    try {
      const resposta = await authService.fetchCurrentUser();
      const usuarioAtualizado = resposta?.data || resposta;
      updateUser(usuarioAtualizado);

      if (usuarioAtualizado?.status_confirmacao === "confirmado") {
        // Redireciona imediatamente para o painel principal agora que foi aprovado
        navigate("/dashboard/geral", { replace: true });
        return;
      }

      setAviso(
        isAluno
          ? "Sua matrícula ainda aguarda vínculo com a sua turma pelo Especialista Pedagógico. Por favor, aguarde alguns instantes e clique novamente em Atualizar Página."
          : "Seu perfil docente ainda aguarda vínculo com a(s) sua(s) disciplina(s) pelo Especialista Pedagógico. Por favor, aguarde alguns instantes e clique novamente em Atualizar Página."
      );
    } catch {
      setAviso("Não foi possível verificar seu status no momento. Tente novamente em breve.");
    } finally {
      setVerificando(false);
    }
  };

  return (
    <main className="container py-5" aria-labelledby="titulo-espera-aprovacao">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <section className="card border-0 shadow-sm rounded-4 p-4 p-md-5 text-center bg-white">
            {/* Ícone semântico de recepção e espera */}
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning-subtle text-warning mx-auto mb-4"
              style={{ width: "80px", height: "80px" }}
              aria-hidden="true"
            >
              <i className="bi bi-hourglass-split fs-1"></i>
            </div>

            {/* Título e mensagem acolhedora */}
            <h1 id="titulo-espera-aprovacao" className="h4 fw-bold text-dark mb-2">
              Bem-vindo(a) à EEPSAS! Aguardando Aprovação de Acesso
            </h1>
            <p className="text-muted mb-4 small">
              Olá, <strong>{user?.name || papelLabel}</strong>! Recebemos com alegria o seu acesso com o
              e-mail institucional (<code>{user?.email}</code>) como{" "}
              <span className="badge bg-primary-subtle text-primary rounded-pill">
                {papelLabel}
              </span>.
            </p>

            {/* Card explicativo com orientações claras conforme o papel */}
            <div className="alert alert-light border rounded-3 text-start small mb-4 p-3">
              <div className="d-flex align-items-start gap-2">
                <i className="bi bi-shield-lock-fill text-primary mt-1" aria-hidden="true"></i>
                <div>
                  <strong className="d-block text-dark mb-1">
                    Por que preciso aguardar antes de acessar o painel?
                  </strong>
                  {isAluno ? (
                    <span>
                      Por questões de segurança escolar, todo acesso estudantil (<code>@aluno</code>)
                      passa por uma rápida aprovação da coordenação, que realiza o seu vínculo oficial
                      com a sua <strong>Turma</strong> na Escola Estadual Professora Sebastiana de Almeida e Silva.
                    </span>
                  ) : (
                    <span>
                      Por questões de segurança escolar, todo acesso docente (<code>@educacao</code>)
                      passa pela aprovação do <strong>Especialista Pedagógico</strong>, que vincula seu
                      cadastro às <strong>Disciplinas</strong> lecionadas na escola.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {aviso && (
              <div className="alert alert-info border-0 rounded-3 small mb-4 text-start" role="status">
                <i className="bi bi-info-circle-fill me-2" aria-hidden="true"></i>
                {aviso}
              </div>
            )}

            {/* Botões de ação: Atualizar página (sem re-login) e Sair para o Portal Público */}
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 mt-2">
              <button
                type="button"
                className="btn btn-primary px-4 fw-semibold"
                onClick={handleVerificarStatus}
                disabled={verificando}
              >
                {verificando ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Verificando aprovação...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>
                    Atualizar página (Verificar aprovação)
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary px-4 fw-semibold"
                onClick={logout}
              >
                <i className="bi bi-box-arrow-right me-2" aria-hidden="true"></i>
                Sair para o Portal Público
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default EsperaProfessor;
