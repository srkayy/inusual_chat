# Inusualchat

Uma aplicação de **chat ao vivo com playlist de vídeos** integrada, construída com HTML, CSS e JavaScript puro no frontend e um servidor Node.js minimalista no backend.

---

## Funcionalidades

- **Chat em tempo real** (local/multi-aba) com avatares coloridos gerados automaticamente por nome
- **Playlist de vídeos** com suporte a links do YouTube e arquivos `.mp4`
- **Avanço automático** para o próximo vídeo ao término do atual
- **Unicidade de nome por aba** via `BroadcastChannel` — dois usuários na mesma sessão não podem usar o mesmo nickname
- **Tema claro/escuro** com persistência via `localStorage`
- **Notificações toast** para feedback de ações (erros, sucessos, informações)
- **Design responsivo** adaptado para mobile, tablet e desktop

---

## Estrutura do Projeto

```
inusual_chat-main/
├── index.html   # Layout, estilos CSS e estrutura da aplicação
├── script.js    # Toda a lógica do frontend (chat, playlist, tema, usuário)
├── server.js    # Servidor HTTP Node.js com stub do Socket.io
└── UML.md       # Diagramas de classes, sequência, componentes e estados
```

---

## Como Executar

**Pré-requisitos:** Node.js instalado.

```bash
# Clone ou extraia o projeto
cd inusual_chat-main

# Inicie o servidor
node server.js
```

Acesse em: **http://localhost:3000**

> Não é necessário instalar dependências — o projeto usa apenas módulos nativos do Node.js (`http`, `fs`, `path`).

---

## Arquitetura

O frontend é organizado em módulos JavaScript com responsabilidades bem definidas:

| Módulo | Responsabilidade |
|---|---|
| `UsernameManager` | Gerencia nomes únicos entre abas via `BroadcastChannel` |
| `ChatModule` | Renderiza mensagens, gera avatares e timestamps relativos |
| `PlaylistManager` | Controla a fila de vídeos, duplicatas e avanço automático |
| `PlayerController` | Alterna entre o iframe do YouTube e o `<video>` para MP4 |
| `UrlClassifier` | Valida e classifica URLs como YouTube ou MP4 |
| `ThemeEngine` | Aplica e persiste o tema claro/escuro |

O servidor (`server.js`) serve os arquivos estáticos via HTTP e expõe um **stub do Socket.io**, deixando a estrutura pronta para a implementação de um backend de chat em tempo real real.

---

## Serviços Externos

- **YouTube Embed API** — reprodução de vídeos via `iframe`
- **noembed.com** — busca do título do vídeo do YouTube de forma assíncrona

---

## Próximos Passos (Possíveis Evoluções)

- Implementar o backend real com **Socket.io** para chat multi-usuário genuíno
- Adicionar sincronização de playlist entre usuários conectados
- Persistência de histórico de mensagens com banco de dados
- Autenticação de usuários

---

## Diagramas UML

O arquivo [`UML.md`](./UML.md) contém diagramas Mermaid detalhando:

- Diagrama de Classes
- Fluxos de Sequência (envio de mensagem, adição de vídeo, unicidade de nome)
- Diagrama de Componentes
- Diagrama de Estados do Player

---

## Autor

Desenvolvido como projeto acadêmico de Laboratório de Computadores e Sociedade na Universidade Estudual do Rio Grande do Norte (UERN) pelos estudantes Wilton Carlos J. da C. Filho e Kerlison Kennedy de O. Silva. Segue link do GitHub dos autores em ordem de apresentação:
https://github.com/Folhus
https://github.com/kerlisonz
