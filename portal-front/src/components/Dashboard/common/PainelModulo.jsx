/**
 * PainelModulo.jsx - Container Estrutural de Superfície Branca para Módulos
 *
 * Papel Didático:
 * Atua como o envelope padrão da aplicação que unifica visualmente:
 * 1. O cabeçalho institucional padronizado (<BoasVindasCard />);
 * 2. A navegação horizontal e ações da funcionalidade ativa (<ModuloNav />);
 * 3. A área de conteúdo do módulo ({children}), com espaçamentos otimizados.
 *
 * Elimina o aspecto de telas isoladas ou paddings inflados sobre o fundo azulado do Panel.
 */

import BoasVindasCard from "./BoasVindasCard";
import ModuloNav from "./ModuloNav";
import "./PainelModulo.css";

export default function PainelModulo({
  titulo,
  subtitulo,
  icone,
  acoes,
  acoesBoasVindas,
  mostrarCabecalho = true,
  mostrarNav = true,
  abasCustomizadas,
  abaAtivaCustomizada,
  onTrocarAba,
  children,
  className = "",
  conteudoClassName = "",
}) {
  return (
    <section className={`painel-modulo-container ${className}`.trim()}>
      {/* 1. Cabeçalho institucional com ícone, título e descrição do módulo */}
      {mostrarCabecalho && (
        <BoasVindasCard
          titulo={titulo}
          subtitulo={subtitulo}
          icone={icone}
          acoes={acoesBoasVindas || (!mostrarNav ? acoes : undefined)}
        />
      )}

      {/* 2. Barra de Navegação Horizontal do Módulo (se aplicável) */}
      {mostrarNav && (
        <ModuloNav
          abas={abasCustomizadas}
          abaAtivaId={abaAtivaCustomizada}
          onSelecionarAba={onTrocarAba}
          acoes={acoes}
        />
      )}

      {/* 3. Área de Conteúdo da Tela Ativa */}
      <div className={`painel-modulo-conteudo ${conteudoClassName}`.trim()}>
        {children}
      </div>
    </section>
  );
}
