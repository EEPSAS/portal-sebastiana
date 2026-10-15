/**
 * usuarioService.js - Serviço de Integração para Perfil e Configurações de Usuário
 *
 * Papel Didático:
 * Centraliza as chamadas à API RESTful para o Módulo 6 (Gestão do Usuário / Configurações).
 * Todos os métodos passam pela camada central `api.js`, garantindo envio do Bearer token
 * e tratamento uniforme de respostas em JSON e multipart/form-data.
 */

import { api } from './api';

/**
 * Atualiza os dados cadastrais do perfil do próprio usuário (ou via gestão).
 * Suporta atualização de name, nickname, telefone, data_nascimento e password.
 *
 * @param {number|string} id Identificador do usuário
 * @param {object} dados Dados validados para atualização
 */
export const atualizarPerfil = async (id, dados) => {
  const response = await api(`/usuarios/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: dados,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || 'Não foi possível atualizar as configurações de perfil.');
    error.status = response.status;
    error.errors = data?.errors || null;
    throw error;
  }

  return data;
};

/**
 * Realiza o upload de um arquivo de imagem para definir como foto de perfil (avatar).
 *
 * @param {number|string} id Identificador do usuário
 * @param {File} arquivo Arquivo de imagem selecionado pelo usuário
 */
export const uploadAvatar = async (id, arquivo) => {
  const formData = new FormData();
  formData.append('avatar', arquivo);

  const response = await api(`/usuarios/${encodeURIComponent(id)}/avatar`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || 'Não foi possível enviar a foto de perfil.');
    error.status = response.status;
    error.errors = data?.errors || null;
    throw error;
  }

  return data;
};

/**
 * Remove a foto de perfil do usuário, restaurando o avatar padrão por iniciais.
 *
 * @param {number|string} id Identificador do usuário
 */
export const removerAvatar = async (id) => {
  const response = await api(`/usuarios/${encodeURIComponent(id)}/avatar`, {
    method: 'DELETE',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || 'Não foi possível remover a foto de perfil.');
    error.status = response.status;
    throw error;
  }

  return data;
};
