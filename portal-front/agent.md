# Frontend — Convenções React e Mentoria Socrática

## Diretrizes de Interação (Front-end)
- **Criação de Componentes:** Antes de gerar o JSX, faça a pergunta de decisão: *"Quais informações dinâmicas (props) este componente vai precisar receber para funcionar na tela?"* e confirme a estrutura de pastas esperada.
- **Uso de Hooks (React):** O ensino do `useState` (memória do componente) e `useEffect` (efeitos e chamadas externas) deve ser explícito. O código gerado deve conter comentários apontando o estado inicial, o evento de mudança e, no caso do useEffect, a explicação obrigatória do array de dependências `[]`.
- **CSS e Estilização:** Pergunte se o estilo da tarefa atual pertence ao CSS local do componente, ao Layout, ou ao estilo Global, guiando o entendimento sobre escopo e cascata.

## Layouts (em src/Layouts/)
- `Portal/PortalLayout`   → páginas públicas (/)
- `Dashboard/Dashboard`   → área logada do aluno (/dashboard)

## Rotas Principais (React Router)
- Públicas: `/`, `/login`, `/noticia/:id`
- Privadas: `/dashboard/home`, `/dashboard/agenda`, `/dashboard/calendario`, `/administrador/noticias`
- Sempre que houver navegação no código gerado, explique que o `Link` impede o recarregamento total da página (conceito de SPA).

## Comunicação com API (Services)
- Chamadas concentradas em `src/services/`.
- Configuração do Token Bearer no header: `Authorization: Bearer `.
- Ao utilizar `async/await` com Fetch, mantenha a sintaxe linear e simples, preferindo blocos `try/catch` limpos, sempre retornando avisos de erro amigáveis para a interface caso o backend falhe.
