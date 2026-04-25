# Comprehensive Architectural Class Diagram — Cantio

This diagram follows a **Layered Architecture** and **GRASP** patterns, visualized in a high-fidelity structure similar to enterprise blueprints.

```mermaid
classDiagram
    %% ─────────────────────────────────────────
    %% FRONTEND
    %% ─────────────────────────────────────────
    namespace Frontend {
        class AuthContext {
            +creator: Creator | null
            +loading: Boolean
            +signInWithGoogle() void
            +signOut() Promise
        }
        class AudioPlayerContext {
            +current: Track | null
            +isPlaying: Boolean
            +duration: Number
            +currentTime: Number
            +play(Track) void
            +pause() void
            +resume() void
            +seek(Number) void
        }
        class GeneratePage {
            +title: String
            +prompt: String
            +jobStatus: JobStatus
            +handleSubmit(Event) Promise
            +startPolling(songId) void
        }
    }

    %% ─────────────────────────────────────────
    %% BACKEND (Controllers & Adapters)
    %% ─────────────────────────────────────────
    namespace Backend {
        class AuthView {
            +get(action) Response
            +post(action) Response
            -_google_login() Response
            -_google_callback() Response
        }
        class GenerationView {
            +post() Response (Initiate)
            +get(song_id) Response (Poll)
        }
        class SongView {
            +get(song_id) Response
            +post(song_id) Response
            +delete(song_id) Response
            -_download(song_id) Response
        }
        class MusicSerializer {
            <<Adapter>>
            +parse_body(request) Tuple
            +creator_to_json(MusicCreator) dict
            +job_to_json(GenerationJob) dict
            +song_to_json(Song) dict
        }
    }

    %% ─────────────────────────────────────────
    %% SUNO INTEGRATION (Strategy Pattern)
    %% ─────────────────────────────────────────
    namespace SunoIntegration {
        class SongGeneratorStrategy {
            <<interface>>
            +generate(title, prompt, genre, mood, vt, occ) GenerationResult
            +poll(taskId) GenerationResult
        }
        class SunoSongGeneratorStrategy {
            -api_key: String
            +generate(...) GenerationResult
            +poll(...) GenerationResult
            -_map_status(suno_status) String
        }
        class MockSongGeneratorStrategy {
            +generate(...) GenerationResult
            +poll(...) GenerationResult
        }
        class StrategyFactory {
            +get_generator() SongGeneratorStrategy
        }
    }

    %% ─────────────────────────────────────────
    %% SERVICES (Business Orchestration)
    %% ─────────────────────────────────────────
    namespace Services {
        class AuthService {
            +process_google_callback(code) Tuple
        }
        class SongService {
            +initiate_generation(creator, title, prompt, ...) Tuple
            +sync_status(GenerationJob) GenerationJob
        }
    }

    %% ─────────────────────────────────────────
    %% MODELS
    %% ─────────────────────────────────────────
    namespace Models {
        class MusicCreator {
            +id: UUID
            +first_name: String
            +last_name: String
            +email: Email
            +profile_picture: URL
            +created_at: DateTime
        }
        class Library {
            +id: UUID
            +last_modified: DateTime
        }
        class Song {
            +id: UUID
            +title: String
            +audio_url: URL
            +duration: Float
            +is_favourited: Boolean
            +is_private: Boolean
            +shareable_url: UUID
            +created_at: DateTime
            +save() void
            +share() void
            +revoke_share() void
            +toggle_favourite() void
        }
        class GenerationJob {
            +id: UUID
            +prompt: Text
            +genre: String
            +mood: String
            +voice_type: Choice
            +occasion: String
            +provider_job_id: String
            +status: Choice
            +error_message: Text
            +updated_at: DateTime
        }
        class JobStatus {
            <<enumeration>>
            PENDING
            PROCESSING
            COMPLETE
            FAILED
        }
        class VoiceType {
            <<enumeration>>
            MALE
            FEMALE
            INSTRUMENTAL
        }
    }

    %% ─────────────────────────────────────────
    %% RELATIONSHIPS & LOGIC FLOW
    %% ─────────────────────────────────────────

    %% UI Interaction
    GeneratePage --|> GenerationView : "calls API"
    AuthContext --|> AuthView : "manages session"

    %% Controller Delegation
    AuthView --> AuthService : "delegates identity logic"
    GenerationView --> SongService : "delegates creation logic"
    SongView ..> MusicSerializer : "adapts models to JSON"

    %% Service Orchestration
    AuthService ..> MusicCreator : "updates or creates"
    SongService ..> Song : "creates container"
    SongService ..> GenerationJob : "manages lifecycle"
    SongService --> StrategyFactory : "requests provider"
    StrategyFactory --> SongGeneratorStrategy : "selects"
    
    %% Strategy Implementation
    SongGeneratorStrategy <|.. SunoSongGeneratorStrategy : implements
    SongGeneratorStrategy <|.. MockSongGeneratorStrategy : implements

    %% Domain Integrity
    MusicCreator "1" -- "1" Library : "owns"
    Library "1" -- "*" Song : "contains"
    Song "1" -- "1" GenerationJob : "birthed by"
    GenerationJob ..> JobStatus : "status restricted to"
    GenerationJob ..> VoiceType : "vocal restricted to"
```

## Architectural Flow Description

1.  **Identity Orchestration**: The `AuthContext` (Frontend) triggers a redirect to `AuthView` (Backend), which delegates to `AuthService` (Service). The `AuthService` verifies the Google JWT and performs an **Upsert** on the `MusicCreator` model.
2.  **Creation Pipeline**: When `GeneratePage` submits, `GenerationView` calls `SongService.initiate_generation()`. This service acts as a **GRASP Indirection** layer:
    *   It creates a `Song` (the Asset) and a `GenerationJob` (the Recipe/Audit Log).
    *   It uses the `StrategyFactory` to obtain a `SongGeneratorStrategy`.
    *   It executes the strategy and stores the external `provider_job_id`.
3.  **Completion Logic**: On successful generation (either immediate for Mock or via polling for Suno), the `SongService` moves the final `audio_url` and `duration` from the AI response to the `Song` entity for **Permanent Storage**.
4.  **Information Expert**: The `Song` model manages its own interaction states (`favourite`, `share`, `revoke`). These methods encapsulate state transitions directly within the domain entity.
