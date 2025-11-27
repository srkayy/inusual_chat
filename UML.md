# Inusualchat — UML Diagrams

## 1. Diagrama de Classes

```mermaid
classDiagram
    class App {
        +theme: string
        +setTheme(dark: boolean)
        +showToast(message, type)
    }

    class UsernameManager {
        -myRegisteredName: string
        -otherTabNames: Set~string~
        -bc: BroadcastChannel
        +claimName(name: string)
        +releaseName(name: string)
        +isNameTaken(name: string) boolean
        +validateUsername(name: string) boolean
        +getCurrentUsername() string
    }

    class ChatModule {
        -mensagensDiv: HTMLElement
        +appendMessage(username, text, type)
        +sendMessage()
        +escapeHtml(str) string
        +relativeTime(ts) string
        +generateAvatarColor(username) string
        +getInitials(name) string
    }

    class PlaylistManager {
        -playlist: PlaylistItem[]
        -currentIndex: number
        +addToPlaylist(url) boolean
        +removeFromPlaylist(idx)
        +playFromPlaylist(idx)
        +renderPlaylist()
        +advance()
    }

    class PlayerController {
        -ytPlayer: HTMLIFrameElement
        -mp4Player: HTMLVideoElement
        +updatePlayer(item: PlaylistItem)
        +showYouTube()
        +showMp4()
    }

    class UrlClassifier {
        +extractVideoId(url) string
        +isMp4Url(url) boolean
        +classifyUrl(url) PlaylistItem
    }

    class PlaylistItem {
        +type: string
        +id: string
        +url: string
        +title: string
    }

    App --> UsernameManager
    App --> ChatModule
    App --> PlaylistManager
    PlaylistManager --> PlayerController
    PlaylistManager --> UrlClassifier
    PlaylistManager --> PlaylistItem
    UrlClassifier --> PlaylistItem
```

---

## 2. Diagrama de Sequência — Envio de Mensagem

```mermaid
sequenceDiagram
    actor U as Usuário
    participant UI as Input do Chat
    participant UM as UsernameManager
    participant CM as ChatModule

    U->>UI: digita mensagem + Enter
    UI->>UM: getCurrentUsername()
    alt nome vazio
        UM-->>UI: ""
        UI-->>U: toast erro "Digite seu nome"
    else nome em uso por outra aba
        UM-->>UI: isNameTaken() = true
        UI-->>U: toast erro "Nome em uso"
    else nome válido
        UM-->>UI: username
        UI->>CM: appendMessage(username, text)
        CM->>CM: generateAvatarColor(username)
        CM->>CM: getInitials(username)
        CM-->>U: mensagem renderizada no chat
    end
```

---

## 3. Diagrama de Sequência — Adicionar Vídeo à Playlist

```mermaid
sequenceDiagram
    actor U as Usuário
    participant UI as URL Input
    participant UC as UrlClassifier
    participant PM as PlaylistManager
    participant PC as PlayerController
    participant YT as YouTube oEmbed API

    U->>UI: cola URL + Enter / clica Adicionar
    UI->>UC: classifyUrl(url)
    alt URL inválida (não é YouTube nem .mp4)
        UC-->>UI: null
        UI-->>U: toast erro "URL inválida"
    else YouTube
        UC-->>PM: { type: "youtube", id }
        PM->>PM: verifica duplicata
        PM->>YT: fetchYouTubeTitle(videoId)
        YT-->>PM: título do vídeo
        PM->>PM: playlist.push(item)
        PM->>PC: updatePlayer(item)
        PC->>PC: showYouTube()
        PC-->>U: iframe YouTube com autoplay
        PM-->>U: toast "adicionado à fila"
    else MP4
        UC-->>PM: { type: "mp4", url }
        PM->>PM: playlist.push(item)
        PM->>PC: updatePlayer(item)
        PC->>PC: showMp4()
        PC-->>U: video element com autoplay
        PM-->>U: toast "adicionado à fila"
    end
```

---

## 4. Diagrama de Sequência — Unicidade de Nome (Multi-aba)

```mermaid
sequenceDiagram
    participant A as Aba 1
    participant BC as BroadcastChannel
    participant B as Aba 2

    A->>A: usuário digita "João"
    A->>BC: postMessage({ type: "claim", name: "joão" })
    BC-->>B: onmessage → otherTabNames.add("joão")

    B->>B: usuário tenta digitar "João"
    B->>B: isNameTaken("joão") = true
    B-->>B: input.className = "input-error"
    B-->>B: status = "Nome em uso"

    A->>A: aba 1 fecha (beforeunload)
    A->>BC: postMessage({ type: "release", name: "joão" })
    BC-->>B: onmessage → otherTabNames.delete("joão")
    B->>B: validateUsername() → disponível
```

---

## 5. Diagrama de Componentes

```mermaid
graph TD
    subgraph Browser["Navegador (Client-side)"]
        HTML[index.html\nLayout & Estilos]
        JS[script.js\nLógica da Aplicação]

        subgraph Modules["Módulos JS"]
            UM[UsernameManager\nNomes únicos por aba]
            CM[ChatModule\nRenderização de mensagens]
            PM[PlaylistManager\nFila de vídeos]
            PC[PlayerController\nYouTube iframe / MP4 video]
            UC[UrlClassifier\nValidação de URL]
            TH[ThemeEngine\nDark / Light mode]
        end
    end

    subgraph External["Serviços Externos"]
        YT[YouTube Embed API]
        OE[noembed.com\nMetadados de título]
    end

    subgraph Server["Servidor Local (server.js)"]
        EX[Express HTTP\nServe arquivos estáticos]
        SIO[Socket.io stub\nPronto para backend real]
    end

    HTML --> JS
    JS --> UM
    JS --> CM
    JS --> PM
    PM --> PC
    PM --> UC
    JS --> TH

    PC -->|iframe src| YT
    PM -->|fetch| OE
    Browser -->|HTTP| Server
```

---

## 6. Diagrama de Estados — Player de Vídeo

```mermaid
stateDiagram-v2
    [*] --> Idle : página carregada

    Idle --> LoadingYouTube : URL YouTube adicionada
    Idle --> LoadingMp4 : URL .mp4 adicionada

    LoadingYouTube --> PlayingYouTube : iframe src definido
    LoadingMp4 --> PlayingMp4 : video.src definido + play()

    PlayingYouTube --> Idle : playlist vazia após fim
    PlayingMp4 --> Idle : playlist vazia após fim

    PlayingYouTube --> LoadingYouTube : próximo vídeo (YouTube)
    PlayingYouTube --> LoadingMp4 : próximo vídeo (MP4)
    PlayingMp4 --> LoadingYouTube : próximo vídeo (YouTube)
    PlayingMp4 --> LoadingMp4 : próximo vídeo (MP4)

    PlayingYouTube --> Idle : item removido da playlist
    PlayingMp4 --> Idle : item removido da playlist
```
