/**
 * AvatarCard.jsx - Cartão de Gestão da Foto de Perfil (Avatar)
 *
 * Papel Didático:
 * Permite ao usuário visualizar sua foto atual, selecionar uma nova imagem do computador
 * (com pré-visualização instantânea e validação de tamanho/formato) ou remover a foto existente.
 */

import { useState, useRef } from 'react';
import { uploadAvatar, removerAvatar } from '../../../services/usuarioService';

const AvatarCard = ({ user, onUserUpdated }) => {
  const [carregando, setCarregando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [urlFotoComErro, setUrlFotoComErro] = useState(null);
  const fileInputRef = useRef(null);

  // Limpa mensagens após 4 segundos
  const dispararMensagem = (tipo, texto) => {
    if (tipo === 'sucesso') {
      setMensagemSucesso(texto);
      setMensagemErro('');
    } else {
      setMensagemErro(texto);
      setMensagemSucesso('');
    }
    setTimeout(() => {
      setMensagemSucesso('');
      setMensagemErro('');
    }, 4500);
  };

  // Dispara o seletor nativo de arquivos oculto
  const abrirSeletorArquivo = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Processa a imagem selecionada pelo usuário
  const handleArquivoSelecionado = async (event) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    // Validação de tipo de arquivo no cliente
    const formatosPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!formatosPermitidos.includes(arquivo.type)) {
      dispararMensagem('erro', 'Formato inválido. Selecione uma imagem JPG, PNG ou WEBP.');
      return;
    }

    // Validação de tamanho (máximo 2MB)
    const tamanhoMaximoBytes = 2 * 1024 * 1024;
    if (arquivo.size > tamanhoMaximoBytes) {
      dispararMensagem('erro', 'A imagem excede o tamanho máximo de 2MB.');
      return;
    }

    try {
      setCarregando(true);
      const usuarioAtualizado = await uploadAvatar(user.id, arquivo);
      onUserUpdated(usuarioAtualizado);
      dispararMensagem('sucesso', 'Foto de perfil atualizada com sucesso!');
    } catch (err) {
      dispararMensagem('erro', err.message || 'Erro ao enviar a imagem de perfil.');
    } finally {
      setCarregando(false);
    }
  };

  // Remove a foto de perfil do usuário
  const handleRemoverFoto = async () => {
    if (!window.confirm('Tem certeza de que deseja remover sua foto de perfil?')) {
      return;
    }

    try {
      setCarregando(true);
      const usuarioAtualizado = await removerAvatar(user.id);
      onUserUpdated(usuarioAtualizado);
      dispararMensagem('sucesso', 'Foto de perfil removida com sucesso.');
    } catch (err) {
      dispararMensagem('erro', err.message || 'Erro ao remover a foto de perfil.');
    } finally {
      setCarregando(false);
    }
  };

  // Obtém a inicial para o avatar de fallback
  const inicial = (user?.nickname || user?.name || 'U').charAt(0).toUpperCase();

  return (
    <div className="card shadow-sm border-0 rounded-4 p-4 h-100">
      <h5 className="fw-bold text-dark mb-1">
        <i className="bi bi-person-bounding-box text-primary me-2"></i>
        Foto de Perfil
      </h5>
      <p className="text-muted small mb-4">
        Esta imagem será exibida no cabeçalho e em suas interações no portal.
      </p>

      {/* Alertas de Sucesso / Erro */}
      {mensagemSucesso && (
        <div className="alert alert-success d-flex align-items-center py-2 px-3 small rounded-3 mb-3">
          <i className="bi bi-check-circle-fill me-2 fs-6"></i>
          <div>{mensagemSucesso}</div>
        </div>
      )}
      {mensagemErro && (
        <div className="alert alert-danger d-flex align-items-center py-2 px-3 small rounded-3 mb-3">
          <i className="bi bi-exclamation-triangle-fill me-2 fs-6"></i>
          <div>{mensagemErro}</div>
        </div>
      )}

      {/* Visualização da Foto */}
      <div className="d-flex flex-column align-items-center text-center my-auto">
        <div className="position-relative mb-3">
          {user?.avatar && urlFotoComErro !== user?.avatar ? (
            <img
              src={user.avatar}
              alt={user?.name || 'Foto de perfil'}
              className="rounded-circle border border-3 border-primary-subtle shadow-sm object-fit-cover"
              style={{ width: '130px', height: '130px' }}
              onError={() => setUrlFotoComErro(user?.avatar)}
            />
          ) : (
            <div
              className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold border border-3 border-primary-subtle shadow-sm"
              style={{ width: '130px', height: '130px', fontSize: '3rem' }}
            >
              {inicial}
            </div>
          )}

          {carregando && (
            <div
              className="position-absolute top-0 start-0 w-100 h-100 rounded-circle bg-dark bg-opacity-50 d-flex align-items-center justify-content-center text-white"
            >
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          )}
        </div>

        {/* Nome e Badges */}
        <h6 className="fw-bold mb-1 text-dark">{user?.nickname || user?.name}</h6>
        <div className="d-flex flex-wrap gap-2 justify-content-center mb-3">
          <span className="badge bg-primary text-uppercase px-2 py-1">
            {user?.role_label || user?.role || 'Aluno'}
          </span>
          {user?.google_vinculado && (
            <span className="badge bg-light text-dark border px-2 py-1 d-flex align-items-center gap-1">
              <i className="bi bi-google text-danger"></i> Conta Google
            </span>
          )}
        </div>

        {/* Input file invisível */}
        <input
          type="file"
          ref={fileInputRef}
          className="d-none"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleArquivoSelecionado}
        />

        {/* Ações de Foto */}
        <div className="d-flex gap-2 w-100 justify-content-center">
          <button
            type="button"
            className="btn btn-primary btn-sm rounded-pill px-3 py-2 d-flex align-items-center gap-2"
            onClick={abrirSeletorArquivo}
            disabled={carregando}
          >
            <i className="bi bi-camera-fill"></i>
            {user?.avatar ? 'Alterar Foto' : 'Adicionar Foto'}
          </button>

          {user?.avatar && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm rounded-pill px-3 py-2 d-flex align-items-center gap-2"
              onClick={handleRemoverFoto}
              disabled={carregando}
              title="Excluir foto de perfil"
            >
              <i className="bi bi-trash3"></i>
              Excluir
            </button>
          )}
        </div>

        <small className="text-muted d-block mt-3" style={{ fontSize: '0.78rem' }}>
          Formatos aceitos: JPG, PNG ou WEBP (máx. 2MB).
        </small>
      </div>
    </div>
  );
};

export default AvatarCard;
