/**
 * EsperaProfessor.jsx - Tela de Espera Institucional para Professores Pendentes
 *
 * Papel Didático:
 * O Google OAuth permite acesso a qualquer servidor com e-mail @educacao.mg.gov.br.
 * Enquanto o Especialista Pedagógico da EEPSAS não validar que o professor realmente
 * leciona na escola, esta tela protege os dados de turmas, alunos e boletins,
 * oferecendo uma recepção acolhedora e orientações claras de como proceder.
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import * as authService from "../../services/authService";

const EsperaProfessor = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [verificando, setVerificando] = useState(false);
  const [aviso, setAviso] = useState("");

  /**
   * Revalida o token do usuário na API para verificar se o Especialista
   * já aprovou o cadastro enquanto o professor aguardava na tela.
   */
  const handleVerificarStatus = async () => {
    setVerificando(true);
    setAviso("");

    try {
      const usuarioAtualizado = await authService.fetchCurrentUser();

      if (
        usuarioAtualizado.status_confirmacao === "confirmado" ||
        usuarioAtualizado.role !== "professor"
      ) {
        // Redireciona imediatamente para o painel principal agora que foi confirmado
        navigate("/dashboard/geral", { replace: true });
        return;
      }

      setAviso(
        "Seu perfil ainda está em análise pela equipe pedagógica. Por favor, aguarde alguns instantes ou entre em contato com a secretaria."
      );
    } catch {
      setAviso("Não foi possível verificar seu status no momento. Tente novamente em breve.");
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 text-center bg-white">
            {/* Ícone de status acolhedor */}
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning-subtle text-warning mx-auto mb-4"
              style={{ width: "80px", height: "80px" }}
            >
              <i className="bi bi-hourglass-split fs-1"></i>
            </div>

            {/* Título e saudação */}
            <h1 className="h4 fw-bold text-dark mb-2">Aguardando Confirmação Escolar</h1>
            <p className="text-muted mb-4 small">
              Olá, <strong>{user?.name || "Professor(a)"}</strong>! Seu acesso com o e-mail institucional
              (<code>{user?.email}</code>) foi registrado com sucesso.
            </p>

            {/* Card com explicação de segurança */}
            <div className="alert alert-light border rounded-3 text-start small mb-4 p-3">
              <div className="d-flex align-items-start gap-2">
                <i className="bi bi-shield-lock-fill text-primary mt-1"></i>
                <div>
                  <strong className="d-block text-dark mb-1">Por que preciso aguardar?</strong>
                  Por questões de segurança e privacidade dos dados dos estudantes, todo novo acesso
                  docente deve ter o vínculo confirmado pelo <strong>Especialista Pedagógico</strong> da
                  Escola Estadual Professora Sebastiana de Almeida e Silva.
                </div>
              </div>
            </div>

            {aviso && (
              <div className="alert alert-info border-0 rounded-3 small mb-4 text-start" role="alert">
                <i className="bi bi-info-circle-fill me-2"></i>
                {aviso}
              </div>
            )}

            {/* Ações disponíveis */}
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 mt-2">
              <button
                type="button"
                className="btn btn-primary px-4 fw-semibold"
                onClick={handleVerificarStatus}
                disabled={verificando}
              >
                {verificando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Verificando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Verificar novamente
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary px-4 fw-semibold"
                onClick={logout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EsperaProfessor;
