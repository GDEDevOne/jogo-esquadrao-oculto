# ⚓ Esquadrão Oculto

**Estratégia às cegas.**

Um jogo de estratégia por turnos que mistura a tensão de descoberta do Batalha Naval com a profundidade de construção de personagem de um RPG tático. Cada jogador cria e esconde um esquadrão de 6 personagens num tabuleiro 30×30 — o oponente não vê nada até acertar.

🔗 **[Jogar agora]([#](https://jogo-esquadrao-oculto.vercel.app/)** *(link do deploy)*

---

## Sobre o jogo

Você cria 6 personagens, cada um com:
- **Tamanho livre** (de 3×3 a 10×10, definido uma única vez) — personagens maiores ganham mais pontos de atributo, mas são alvos mais fáceis de acertar;
- **Atributos** — Ataque, Vida e Defesa, de 1 a 4 pontos cada, com orçamento total variando conforme o tamanho escolhido;
- **Padrão de ataque** — Único, Linha, Cruz, Área 2×2 ou Área 3×3, definindo quantas células são atingidas por disparo;
- **Um sprite desenhado à mão**, célula por célula, no próprio editor do jogo.

Depois de posicionar o esquadrão no tabuleiro sem se sobrepor, a batalha acontece em turnos **simultâneos**: os dois jogadores escolhem, em segredo e com 30 segundos de prazo, qual personagem ataca e onde — os resultados são revelados ao mesmo tempo. Um personagem só aparece pro adversário quando é atingido pela primeira vez. Vence quem eliminar o esquadrão inteiro do outro lado primeiro.

## Stack técnica

- **Vue 3** (Composition API / SFCs)
- **Pinia** — gerenciamento de estado
- **Vite** — build e dev server
- **Vitest** + jsdom — testes unitários, incluindo simulações de balanceamento (veja abaixo)
- **CSS puro** — sem framework de estilos
- Deploy estático, sem backend — o modo atual é 100% jogado no navegador, contra uma IA local

## O processo de desenvolvimento — e o papel da IA

Esse projeto foi construído inteiramente através de conversas com a Claude (Anthropic), tanto na etapa de **design do jogo** quanto na de **implementação**, num fluxo de duas pontas:

- **Claude** (chat) fez o papel de "co-designer" — foi onde as regras foram debatidas, refinadas e, mais importante, **testadas antes de virar código**.
- **Claude Code** entrou como implementador — recebendo prompts detalhados (com as regras já fechadas) pra transformar cada decisão em código real dentro do repositório.

Alguns momentos concretos desse processo que valem destacar:

**As regras nasceram de uma conversa, não de uma especificação pronta.** O conceito inicial era vago — "um Batalha Naval com atributos de RPG" — e evoluiu através de várias rodadas de perguntas e decisões: tamanho do personagem afetando pontos de atributo, tipos de ataque em área, o que acontece quando um personagem que atacou morre no mesmo turno, etc. Cada regra só foi implementada depois de ser debatida e fechada em texto.

**O balanceamento de combate foi validado por simulação antes de ir pro código.** Quando ficou claro que builds de "tanque" (defesa alta) praticamente nunca venciam nos testes de jogo, em vez de simplesmente aumentar um número, a fórmula de dano foi testada com simulações de Monte Carlo (centenas de duelos simulados entre builds diferentes) — o que revelou que a correção óbvia ("dobrar a escala de defesa") criava um bug de dano determinístico, e levou à fórmula percentual de mitigação usada hoje. Essa mesma simulação foi usada de novo pra calibrar o dano de ataques em área.

**A identidade visual também passou por iteração real.** Nome, paleta de cores, logo e até o layout de telas específicas (como a de criação de personagem) foram revisados mais de uma vez com base em problemas concretos de usabilidade — não só "deixa mais bonito", mas coisas como espaço morto na tela, hierarquia visual confusa e texto em caixa alta em excesso.

**Decisões de arquitetura foram discutidas, mas nem tudo foi implementado de uma vez.** O modo multiplayer (contra jogador aleatório ou contra amigo via código) foi desenhado em detalhe — incluindo comparação entre backends (Node.js + Socket.io, Firebase, Cloudflare Workers + Durable Objects) — mas conscientemente adiado pro pós-lançamento, já que o jogo estreia só no modo contra IA. A decisão já está documentada pra quando for retomada (ver Roadmap).

## Roadmap

- [x] Criação de personagem (tamanho, atributos, tipo de ataque, sprite desenhado)
- [x] Posicionamento no tabuleiro sem sobreposição
- [x] Batalha por turnos simultâneos contra IA local
- [x] Balanceamento de combate validado por simulação
- [x] Identidade visual (nome, logo, paleta)
- [ ] Multiplayer — partida contra jogador aleatório (matchmaking)
- [ ] Multiplayer — partida contra amigo via código de sala
- [ ] Backend planejado: Cloudflare Workers + Durable Objects (WebSocket com estado por sala, dentro do tier gratuito)

## Rodando localmente

```bash
npm install
npm run dev       # inicia o servidor de desenvolvimento
npm run build     # gera a versão de produção em /dist
npm run test      # roda os testes unitários (regras de jogo e simulações de balanceamento)
```

## Deploy

O jogo é uma SPA estática (sem backend no modo atual) publicada na Vercel — build automático a cada push, sem configuração adicional.

---

*Desenvolvido por Guilherme Dal Evedove, com Claude e Claude Code como parceiros de design e implementação ao longo de todo o processo.*
