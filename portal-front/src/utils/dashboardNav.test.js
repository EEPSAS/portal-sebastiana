import { describe, test, expect } from "vitest";
import { NAV_STRUCTURE, isChildActive, obterContextoModulo } from "./dashboardNav";
import appJsxContent from "../App.jsx?raw";

/**
 * dashboardNav.test.js - Testes da Navegação do Dashboard e Sincronia com App.jsx
 *
 * Papel Didático:
 * Verifica a resolução de abas ativas, títulos contextuais por papel (ex: "Minhas Turmas"
 * para Professor vs "Turmas" para Especialista) e garante que todo `path` declarado em
 * `NAV_STRUCTURE` corresponda a uma rota existente em `src/App.jsx`.
 */
describe("dashboardNav", () => {
  test("isChildActive resolve rotas simples e rotas com query string ?tab=", () => {
    const itemAgendaCalendario = NAV_STRUCTURE.find((g) => g.id === "agenda").children[0];
    const itemAgendaSabados = NAV_STRUCTURE.find((g) => g.id === "agenda").children[1];
    const itemNoticias = NAV_STRUCTURE.find((i) => i.id === "noticias");

    // Aba padrão (defaultTab: true) fica ativa mesmo sem ?tab=
    expect(isChildActive(itemAgendaCalendario, "/dashboard/agenda", "")).toBe(true);
    expect(isChildActive(itemAgendaCalendario, "/dashboard/agenda", "?tab=calendario")).toBe(true);
    expect(isChildActive(itemAgendaCalendario, "/dashboard/agenda", "?tab=sabados")).toBe(false);

    // Aba específica exige ?tab=sabados
    expect(isChildActive(itemAgendaSabados, { pathname: "/dashboard/agenda", search: "?tab=sabados" })).toBe(true);

    // Item direto sem query string
    expect(isChildActive(itemNoticias, "/dashboard/noticias", "")).toBe(true);
    expect(isChildActive(itemNoticias, "/dashboard/usuarios", "")).toBe(false);
  });

  test("obterContextoModulo adapta títulos e abas conforme o perfil do usuário", () => {
    const ctxGeralProf = obterContextoModulo("/dashboard/geral", "", "professor");
    expect(ctxGeralProf.titulo).toBe("Painel do Professor");

    // Professor em /dashboard/turmas vê "Acadêmico - Minhas Turmas"
    const ctxTurmasProf = obterContextoModulo("/dashboard/turmas", "", "professor");
    expect(ctxTurmasProf.titulo).toBe("Acadêmico - Minhas Turmas");
    expect(ctxTurmasProf.abas.map((a) => a.id)).toEqual(["turmas", "disciplinas"]);

    // Especialista em /dashboard/turmas vê "Acadêmico - Turmas" e todas as abas de gestão
    const ctxTurmasEsp = obterContextoModulo("/dashboard/turmas", "", "especialista");
    expect(ctxTurmasEsp.titulo).toBe("Acadêmico - Turmas");
    expect(ctxTurmasEsp.abas.map((a) => a.id)).toContain("professores");
    expect(ctxTurmasEsp.abas.map((a) => a.id)).toContain("periodo-letivo");

    // Sub-rotas especiais (detalhe de plano e configuração da Dona Nana)
    expect(obterContextoModulo("/dashboard/biblioteca/planos/12", "", "aluno").rotaVoltar).toBe(
      "/dashboard/biblioteca?tab=planos"
    );
    expect(obterContextoModulo("/dashboard/dona-nana/configuracao", "", "adm").rotaVoltar).toBe(
      "/dashboard/dona-nana"
    );
  });

  test("todas as rotas declaradas em NAV_STRUCTURE existem em src/App.jsx", () => {
    const extrairPaths = (entries) =>
      entries.flatMap((entry) =>
        entry.type === "group" ? extrairPaths(entry.children) : [entry.matchPath || entry.path]
      );

    const pathsUnicos = [...new Set(extrairPaths(NAV_STRUCTURE))];

    for (const fullPath of pathsUnicos) {
      const subPath = fullPath.replace(/^\/dashboard\//, "").split("?")[0];
      expect(appJsxContent).toContain(`path="${subPath}"`);
    }
  });
});
