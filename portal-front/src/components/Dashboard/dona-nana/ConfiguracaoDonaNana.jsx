/**
 * ConfiguracaoDonaNana.jsx - Painel de Gestão da Persona e do Prompt da Dona Nana
 *
 * Papel Didático:
 * Interface exclusiva para Administradores e Especialistas.
 * Desacopla a engenharia de prompt em 4 campos didáticos em português:
 * 1. Sua Personalidade;
 * 2. Seu Conhecimento sobre o Portal;
 * 3. Suas Histórias e Causos;
 * 4. Diretrizes de Resposta.
 *
 * Também permite testar e visualizar os placeholders do avatar institucional.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import DonaNanaAvatar from './DonaNanaAvatar';
import { obterConfiguracao, salvarConfiguracao } from '../../../services/donaNanaService';
import './configuracaoDonaNana.css';
import BoasVindasCard from '../common/BoasVindasCard';
import ModuloNav from '../common/ModuloNav';

const ConfiguracaoDonaNana = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    personalidade: '',
    conhecimento_portal: '',
    historias_causos: '',
    diretrizes_resposta: '',
    avatar_url: '/img/escola-professora.jpeg',
    temperatura: 0.7,
    modelo: 'gemini-3.8-flash',
  });

  const [showLivePreview, setShowLivePreview] = useState(false);

  // Carrega configuração ativa ao montar a página
  useEffect(() => {
    let active = true;

    const carregar = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const dados = await obterConfiguracao();
        if (active && dados) {
          setFormData({
            personalidade: dados.personalidade || '',
            conhecimento_portal: dados.conhecimento_portal || '',
            historias_causos: dados.historias_causos || '',
            diretrizes_resposta: dados.diretrizes_resposta || '',
            avatar_url: dados.avatar_url || '/img/escola-professora.jpeg',
            temperatura: dados.temperatura ?? 0.7,
            modelo: dados.modelo || 'gemini-3.8-flash',
          });
        }
      } catch (err) {
        if (active) {
          setErrorMsg(err.message || 'Erro ao carregar as configurações da Dona Nana.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    carregar();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (campo, valor) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: valor,
    }));
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await salvarConfiguracao(formData);
      setSuccessMsg('Configurações e persona da Dona Nana atualizadas com sucesso!');
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao salvar as configurações. Verifique os campos.');
    } finally {
      setSaving(false);
    }
  };

  // Monta em tempo real a prévia do System Prompt consolidado
  const promptMontadoPreview = [
    `### SUA PERSONALIDADE:\n${formData.personalidade.trim()}`,
    `### SEU CONHECIMENTO SOBRE O PORTAL:\n${formData.conhecimento_portal.trim()}`,
    `### SUAS HISTÓRIAS E CAUSOS:\n${formData.historias_causos.trim()}`,
    `### DIRETRIZES DE RESPOSTA:\n${formData.diretrizes_resposta.trim()}`,
  ].join('\n\n');

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5 text-muted">
        <div className="spinner-border text-primary mb-3" role="status" />
        <p className="fw-semibold">Carregando diretrizes pedagógicas da Dona Nana...</p>
      </div>
    );
  }

  return (
    <div className="dona-nana-config-container">
      {/* Cabeçalho Institucional com BoasVindasCard Padronizado */}
      <div className="bg-white rounded-4 shadow-sm p-3 p-md-4 mb-3">
        <BoasVindasCard />
        <ModuloNav
          acoes={
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                onClick={() => navigate('/dashboard/dona-nana')}
                title="Voltar para a conversa"
              >
                <i className="bi bi-arrow-left me-1"></i> Voltar
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill px-3 d-flex align-items-center gap-2"
                onClick={() => setShowLivePreview((prev) => !prev)}
              >
                <i className="bi bi-code-square"></i>
                <span>{showLivePreview ? 'Ocultar System Prompt' : 'Ver System Prompt Montado'}</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Alertas de Feedback */}
      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-0" role="alert">
          <i className="bi bi-check-circle-fill fs-5"></i>
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Visualização Prévia do System Prompt (Live Preview) */}
      {showLivePreview && (
        <section className="dona-nana-config-card" aria-label="Visualização do System Prompt montado">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <strong className="text-dark small text-uppercase">
              <i className="bi bi-cpu-fill text-primary me-2"></i>
              System Prompt Final (Instruções do Gemini)
            </strong>
            <span className="badge bg-secondary">gemini-3.8-flash</span>
          </div>
          <pre className="dona-nana-preview-pre">{promptMontadoPreview}</pre>
        </section>
      )}

      {/* Formulário Principal dos 4 Pilares */}
      <form onSubmit={handleSalvar} className="d-flex flex-column gap-4">
        {/* Bloco de Avatar e Placeholders */}
        <section className="dona-nana-config-card">
          <div className="dona-nana-field-header">
            <i className="bi bi-person-bounding-box text-warning fs-5"></i>
            <h5>Avatar Institucional & Placeholders</h5>
          </div>
          <p className="dona-nana-field-desc">
            Visualize como o avatar da Dona Nana será exibido em diferentes pontos do portal.
            No futuro, você poderá colar aqui a URL de uma nova ilustração ou foto digital.
          </p>

          <div className="dona-nana-avatar-showcase">
            <div className="dona-nana-showcase-item">
              <DonaNanaAvatar src={formData.avatar_url} size="sm" />
              <span className="dona-nana-showcase-label">Balão (Pequeno)</span>
            </div>
            <div className="dona-nana-showcase-item">
              <DonaNanaAvatar src={formData.avatar_url} size="md" showBadge />
              <span className="dona-nana-showcase-label">Chat (Médio)</span>
            </div>
            <div className="dona-nana-showcase-item">
              <DonaNanaAvatar src={formData.avatar_url} size="lg" />
              <span className="dona-nana-showcase-label">Banner (Grande)</span>
            </div>
            <div className="dona-nana-showcase-item">
              <DonaNanaAvatar src="" size="md" />
              <span className="dona-nana-showcase-label">Placeholder de Fallback</span>
            </div>
          </div>

          <div>
            <label htmlFor="avatar_url" className="form-label fw-bold small text-dark">
              URL ou Caminho da Imagem do Avatar:
            </label>
            <div className="input-group">
              <input
                id="avatar_url"
                type="text"
                className="form-control"
                placeholder="/img/escola-professora.jpeg"
                value={formData.avatar_url}
                onChange={(e) => handleChange('avatar_url', e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => handleChange('avatar_url', '/img/escola-professora.jpeg')}
                title="Restaurar foto padrão da professora"
              >
                Padrão
              </button>
            </div>
            <div className="form-text">
              Padrão recomendado: <code>/img/escola-professora.jpeg</code>. Caso a imagem não carregue, o camafeu vetorial entrará automaticamente em ação.
            </div>
          </div>
        </section>

        {/* Campo 1: Sua Personalidade */}
        <section className="dona-nana-config-card">
          <div className="dona-nana-field-header">
            <i className="bi bi-chat-heart text-danger fs-5"></i>
            <h5>1. Sua Personalidade</h5>
            <span className="dona-nana-field-badge">Tom de Voz</span>
          </div>
          <p className="dona-nana-field-desc">
            Instrua o modelo sobre o comportamento acolhedor de senhora idosa, a sabedoria maternal e o carinho por Jaguaraçu.
          </p>
          <textarea
            className="form-control"
            rows={4}
            value={formData.personalidade}
            required
            onChange={(e) => handleChange('personalidade', e.target.value)}
            placeholder="Descreva a personalidade doce, os vocativos carinhosos e o apreço pela educação..."
          />
        </section>

        {/* Campo 2: Seu Conhecimento sobre o Portal */}
        <section className="dona-nana-config-card">
          <div className="dona-nana-field-header">
            <i className="bi bi-laptop text-primary fs-5"></i>
            <h5>2. Seu Conhecimento sobre o Portal</h5>
            <span className="dona-nana-field-badge">Suporte Técnico</span>
          </div>
          <p className="dona-nana-field-desc">
            Especifique o funcionamento de cada módulo (Boletim por CSV, Acervo e Empréstimos na Biblioteca, Eventos, Turmas).
          </p>
          <textarea
            className="form-control"
            rows={5}
            value={formData.conhecimento_portal}
            required
            onChange={(e) => handleChange('conhecimento_portal', e.target.value)}
            placeholder="Explique detalhadamente como o aluno deve navegar em cada tela do sistema..."
          />
        </section>

        {/* Campo 3: Suas Histórias e Causos */}
        <section className="dona-nana-config-card">
          <div className="dona-nana-field-header">
            <i className="bi bi-book text-success fs-5"></i>
            <h5>3. Suas Histórias e Causos</h5>
            <span className="dona-nana-field-badge">Memória Escolar</span>
          </div>
          <p className="dona-nana-field-desc">
            Histórias reais ou simbólicas sobre a fundação da EEPSAS, a dedicação dos antigos mestres e as tradições de Jaguaraçu.
          </p>
          <textarea
            className="form-control"
            rows={4}
            value={formData.historias_causos}
            required
            onChange={(e) => handleChange('historias_causos', e.target.value)}
            placeholder="Conte causos nostálgicos, a alegria das formaturas e o amor pela comunidade..."
          />
        </section>

        {/* Campo 4: Diretrizes de Resposta */}
        <section className="dona-nana-config-card">
          <div className="dona-nana-field-header">
            <i className="bi bi-shield-check text-info fs-5"></i>
            <h5>4. Diretrizes de Resposta</h5>
            <span className="dona-nana-field-badge">Postura Pedagógica</span>
          </div>
          <p className="dona-nana-field-desc">
            Regras éticas, limites de confidencialidade, incentivo ao hábito de leitura e valorização da equipe docente.
          </p>
          <textarea
            className="form-control"
            rows={4}
            value={formData.diretrizes_resposta}
            required
            onChange={(e) => handleChange('diretrizes_resposta', e.target.value)}
            placeholder="Defina regras pedagógicas, linguagem respeitosa e foco no aprendizado..."
          />
        </section>

        {/* Barra de Ações */}
        <div className="d-flex align-items-center justify-content-end gap-3 pt-2">
          <button
            type="button"
            className="btn btn-light border px-4"
            disabled={saving}
            onClick={() => navigate('/dashboard/dona-nana')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary px-5 fw-bold d-flex align-items-center gap-2 shadow-sm"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <i className="bi bi-save2-fill"></i>
                <span>Salvar Configurações da Dona Nana</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfiguracaoDonaNana;
