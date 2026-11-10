import { api } from "./api";
import {
  ListaTurnosSchema,
  TurnoSchema,
  validarContratoZod,
} from "../utils/academicoSchemas";

/**
 * turnosService.js - Serviço de Integração dos Turnos de Funcionamento e Módulos Escolares
 *
 * Papel Didático:
 * Centraliza as chamadas HTTP para o endpoint `/turnos`, revalidando em runtime
 * todos os payloads e respostas contra os schemas Zod oficiais.
 */

export const listarTurnos = async ({ signal } = {}) => {
  const response = await api("/turnos", { signal });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível carregar os turnos escolares.");
  }

  const listaBruta = Array.isArray(data) ? data : data?.data || [];
  return validarContratoZod(ListaTurnosSchema, listaBruta, "GET /turnos");
};

export const obterTurno = async (id, { signal } = {}) => {
  const idLimpo = encodeURIComponent(String(id || "").trim());
  const response = await api(`/turnos/${idLimpo}`, { signal });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Não foi possível obter o turno ${id}.`);
  }

  const registro = data?.data || data;
  return validarContratoZod(TurnoSchema, registro, `GET /turnos/${id}`);
};

export const atualizarTurno = async (id, dados) => {
  const idLimpo = encodeURIComponent(String(id || "").trim());
  const response = await api(`/turnos/${idLimpo}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Não foi possível atualizar o turno ${id}.`);
  }

  const registro = data?.data || data;
  return validarContratoZod(TurnoSchema, registro, `PUT /turnos/${id}`);
};

export const alternarTurno = async (id) => {
  const idLimpo = encodeURIComponent(String(id || "").trim());
  const response = await api(`/turnos/${idLimpo}/toggle`, {
    method: "PATCH",
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Não foi possível alternar o status do turno ${id}.`);
  }

  const registro = data?.dados?.data || data?.dados || data;
  return validarContratoZod(TurnoSchema, registro, `PATCH /turnos/${id}/toggle`);
};
