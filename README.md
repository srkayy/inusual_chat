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
