# Comprehensive Architectural Class Diagram — Cantio

This diagram follows a **Layered Architecture** and **GRASP** patterns,
visualized in a high-fidelity structure similar to enterprise blueprints.

```mermaid
classDiagram
    namespace Page_Component {
        class LoginPage {
           <<Page>>
           +signInWithGoogle()
        }
        class DashboardPage {
             <<Page>>
             +fetchSongs()
             +filterSongs(filters)
        }
        class LibraryPage {
             <<Page>>
             +fetchAllSongs()
             +searchSongs(query)
             +sortSongs(sortBy)
        }
        class GeneratePage {
            <<Page>>
            +handleSubmit()
            +startPolling()
            +cancelGeneration()
        }
        class FavouritesPage {
             <<Page>>
             +fetchFavourites()
        }
        class SharePage {
             <<Page>>
             +loadPublicTrack()
        }

        class AuthContext {
            <<Context>>
            +currentUser: MusicCreator
            +isAuthenticated: Boolean
            +login()
            +logout()
            +refreshToken()
        }
    }
    namespace View_Controller {
        class CreatorView {
            <<Controller>>
            +get(request, creator_id) Response
            +post(request) Response
            +put(request, creator_id) Response
            +delete(request, creator_id) Response
        }
        class AuthView {
            +get(request, action) Response
            +post(request, action) Response
            -_google_login(request) Response
            -_google_callback(request) Response
            -_me(request) Response
            -_signout(request) Response
        }
        class GenerationView {
            +post(request) Response
            +get(request, song_id) Response
        }
        class SongView {
            +get(request, song_id) Response
            +post(request, song_id) Response
            +delete(request, song_id) Response
            -_download(song_id) Response
        }
        class LibraryView {
            +get(request, creator_id) Response
            +_filter_favourites(songs) Song[]
        }
        class MusicSerializer {
            <<Adapter>>
            +parse_body(request) Tuple
            +creator_to_json(MusicCreator) dict
            +job_to_json(GenerationJob) dict
            +song_to_json(Song) dict
        }

    }
    namespace SunoIntegration {
        class SongGeneratorStrategy {
            <<interface>>
            +generate(title, prompt, genre, mood, voice_type, occasion) GenerationResult
            +poll(provider_job_id) GenerationResult
        }
        class SunoSongGeneratorStrategy {
            -_api_key: String
            -_headers() dict
            -_map_status(suno_status) String
            +generate(...) GenerationResult
            +poll(...) GenerationResult
        }
        class MockSongGeneratorStrategy {
            +generate(...) GenerationResult
            +poll(provider_job_id) GenerationResult
        }
        class get_generator {
            <<function>>
            +invoke() SongGeneratorStrategy
        }
    }
    namespace Services {
        class AuthService {
            +process_google_callback(code) Tuple
        }
        class GenerationService {
            +initiate_generation(creator, title, prompt, genre, mood, voice_type, occasion) Tuple
            +sync_status(job) GenerationJob
        }
    }
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
    LoginPage --> AuthView : "GET /api/auth/google/"
    DashboardPage --> LibraryView : "GET /creators/{id}/songs/"
    LibraryPage --> LibraryView : "GET /creators/{id}/songs/"
    FavouritesPage --> LibraryView : "GET /creators/{id}/favourites/"
    GeneratePage --> GenerationView : "POST /api/songs/generate/"
    SharePage --> SongView : "GET /api/songs/{id}/"
    AuthContext --> AuthView : "GET /api/auth/me/ | POST /api/auth/signout/"
    AuthView --> AuthService : "delegates"
    GenerationView --> GenerationService : "delegates"
    SongView ..> MusicSerializer : "adapts"
    SongView --> Song : "Manage"
    LibraryView ..> MusicSerializer : "adapts"
    LibraryView --> Song : "retrieves & filters"
    AuthService ..> MusicCreator : "upserts"
    GenerationService ..> Song : "creates/updates"
    GenerationService ..> Library : "read"
    GenerationService ..> GenerationJob : "manages lifecycle"
    GenerationService --> get_generator : "requests"
    get_generator ..> SongGeneratorStrategy : "selects"
    CreatorView --> MusicCreator : "Manage"
    SongGeneratorStrategy <|.. SunoSongGeneratorStrategy : implements
    SongGeneratorStrategy <|.. MockSongGeneratorStrategy : implements
    MusicCreator "1" -- "1" Library : "owns"
    Library "1" -- "*" Song : "contains"
    Song "1" -- "1" GenerationJob : "birthed by"
    GenerationJob ..> JobStatus : "status restricted to"
    GenerationJob ..> VoiceType : "vocal restricted to"
```

## Architectural Flow Description

1.  **Identity Orchestration**: The `AuthContext` (Frontend) triggers a redirect
    to `AuthView` (Backend), which delegates to `AuthService` (Service). The
    `AuthService` verifies the Google JWT and performs an **Upsert** on the
    `MusicCreator` model.
2.  **Creation Pipeline**: When `GeneratePage` submits, `GenerationView` calls
    `GenerationService.initiate_generation()`. This service acts as a **GRASP
    Indirection** layer with **Atomic Idempotency**:
    - It performs a 10-second idempotency check within a database transaction.
    - It uses a **"Create Job Early"** strategy, registering the `GenerationJob`
      before the AI call to prevent race conditions.
    - It creates a `Song` (the Asset) and a `GenerationJob` (the Recipe/Audit
      Log).
    - It uses `get_generator()` to obtain a `SongGeneratorStrategy`.
    - It executes the strategy and stores the external `provider_job_id`.
3.  **Completion Logic**: On successful generation (either immediate for Mock or
    via polling for Suno), the `SongService` moves the final `audio_url` and
    `duration` from the AI response to the `Song` entity for **Permanent
    Storage**. The frontend automatically clears the generation state to prevent
    accidental resubmissions.
4.  **Information Expert**: The `Song` model manages its own interaction states
    (`favourite`, `share`, `revoke`). These methods encapsulate state
    transitions directly within the domain entity.
