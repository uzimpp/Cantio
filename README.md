# Cantio

A full-stack AI music orchestrator. Generate original tracks from text prompts
using the Suno AI engine (or a local mock), manage your library, and share your
masterpieces.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Django 6.0 (REST), PostgreSQL, Strategy Pattern for AI Providers
- **Auth:** Google OAuth 2.0 with session-based persistence

---

## Setup & Run

### 1. Environment Setup

Copy the example environment file:

- **Mac/Linux:** `cp backend/.env.example backend/.env`
- **Windows:** `copy backend\.env.example backend\.env`

### 2. Google OAuth Configuration

1. Go to
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create **OAuth 2.0 Client ID** (Web Application).
3. **Authorized JavaScript origins:** `http://localhost:3000`
4. **Authorized redirect URIs:**
   `http://localhost:8000/api/auth/google/callback/`
5. Copy `Client ID` and `Client Secret` to `backend/.env`.

### 3. Suno AI Setup

1. Get an API key from [SunoAPI.org](https://sunoapi.org).
2. In `backend/.env`, set:
   - `GENERATOR_STRATEGY=suno` (use `mock` for offline dev)
   - `SUNO_API_KEY=your_key_here`

### 4. Launch (Docker)

**Prerequisites:** Docker Desktop

```bash
docker-compose up -d --build
```

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **API Docs:** `http://localhost:8000/api/docs/`

---

## Local Development (No Docker)

### Backend (Django)

1. `cd backend`
2. `python -m venv .venv` && `source .venv/bin/activate`
3. `pip install -r requirements.txt`
4. Configure `.env` (Set `POSTGRES_HOST=localhost`), then
   `python manage.py migrate`
5. `python manage.py runserver`

### Frontend (Next.js)

1. `cd frontend`
2. `npm install`
3. `npm run dev`

---

## Key Features & Architecture

### Robust Generation Lifecycle

- **Idempotency**: Implements a "Create Job Early" strategy with database
  transactions to prevent duplicate song creation.
- **Async Polling**: The frontend uses a resilient polling mechanism with clean
  state cleanup on navigation.

### Strategy Pattern (AI Providers)

The system abstracts the music provider via a Strategy Pattern. Toggle providers
in `.env`:

- `GENERATOR_STRATEGY=mock`: Instant offline generation (no API key needed).
- `GENERATOR_STRATEGY=suno`: Live AI generation via
  [SunoAPI.org](https://sunoapi.org).

### Architecture Diagram

```mermaid
---
config:
  layout: elk
  theme: redux
  look: classic
---
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

### Sequence Diagram

Check out at [docs](/docs/sequence_diagrams.md)

### Testing

Run backend tests to verify the generation logic and API integrity.

_Note: Run these commands from the project root._

**Using Docker (Recommended):**

```bash
docker-compose exec backend python manage.py test music.tests
```

**Local (Requires Venv):**

```bash
cd backend
python manage.py test music.tests
```
