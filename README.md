# Cantio

A Django REST API for AI-generated music creation. Users can create songs via text prompts, manage a personal library, favourite and share tracks.

## Project Structure
```
Cantio/
├── backend/                 # Django application
│   ├── cantio/             # Project settings
│   ├── music/              # Music app
│   │   ├── models/         # Database models (Domain)
│   │   ├── views/          # Cohesive Resource Controllers
│   │   ├── strategies/     # Generation Strategies (Strategy Pattern)
│   │   ├── services.py     # Business logic orchestration (Service Layer)
│   │   ├── urls.py         # App routing
│   │   ├── auth_urls.py    # Identity routing
│   │   └── admin.py
│   ├── manage.py
│   └── requirements.txt
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## Running with Docker (recommended)

**Prerequisites:** Docker and Docker Compose

> **Note:** All commands must be run from the `Cantio/` root directory.

### Setup

1. Copy and configure environment variables:

   Mac/Linux:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Windows:
   ```cmd
   copy backend\.env.example backend\.env
   ```

2. Build and start all containers:
   ```bash
   docker-compose up --build
   ```

   To run in the background:
   ```bash
   docker-compose up -d --build
   ```

The API will be available at `http://localhost:8000`.

### Common Docker Commands

```bash
# View logs
docker-compose logs -f backend

# Run migrations
docker-compose exec backend python manage.py migrate

# Create a superuser
docker-compose exec backend python manage.py createsuperuser

# Stop containers
docker-compose down

# Reset database and volumes
docker-compose down -v
```

---

## Running Locally (without Docker)

**Prerequisites:** Python 3.12+, PostgreSQL running locally

> **Note:** All commands must be run from the `Cantio/backend/` directory.

### Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   ```
   Mac/Linux:
   ```bash
   source .venv/bin/activate
   ```
   Windows:
   ```cmd
   .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy and configure environment variables:

   Mac/Linux:
   ```bash
   cp .env.example .env
   ```
   Windows:
   ```cmd
   copy .env.example .env
   ```

   > **Note:** Set `POSTGRES_HOST=localhost` in `.env` when running locally (not `db`).

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Start the development server:
   ```bash
   python manage.py runserver
   ```

   To create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

The API will be available at `http://localhost:8000`.

---

## Environment Variables

### Required (must change for production)
| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key — generate a new one for production |
| `DEBUG` | Set to `0` for production (never use `1` in production) |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts |

### Database
| Variable | Default | Description |
|---|---|---|
| `POSTGRES_DB` | `cantio` | Database name |
| `POSTGRES_USER` | `postgres` | Database username |
| `POSTGRES_PASSWORD` | `postgres` | **Change this** in production |
| `POSTGRES_HOST` | `db` | Use `db` for Docker, `localhost` for local dev |
| `POSTGRES_PORT` | `5432` | Database port |

### Song generation
| Variable | Default | Description |
|---|---|---|
| `GENERATOR_STRATEGY` | `mock` | `mock` for offline dev, `suno` for live AI generation |
| `SUNO_API_KEY` | *(empty)* | Required only when `GENERATOR_STRATEGY=suno` — get one at [sunoapi.org](https://sunoapi.org) |

### Google OAuth 2.0
| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Client ID from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Client secret from Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | Must be `http://localhost:8000/api/auth/google/callback/` in development |
| `FRONTEND_URL` | Must be `http://localhost:3000` in development |

### Development superuser (auto-created on first run)
| Variable | Default |
|---|---|
| `DJANGO_SUPERUSER_USERNAME` | `admin` |
| `DJANGO_SUPERUSER_PASSWORD` | `admin` |
| `DJANGO_SUPERUSER_EMAIL` | `admin@example.com` |

---

## Song Generation — Strategy Pattern

Cantio uses the **Strategy design pattern** to abstract the song-generation provider. The system ships with two concrete strategies:

| Strategy class | `GENERATOR_STRATEGY` value | Description |
|---|---|---|
| `MockSongGeneratorStrategy` | `mock` *(default)* | Instant offline generation — no API key required. Returns a fixed sample audio URL immediately. Ideal for development and testing. |
| `SunoSongGeneratorStrategy` | `suno` | Live AI generation via [SunoAPI.org](https://sunoapi.org). Requires a paid API key. |

### Switching the strategy

Open `backend/.env` and change `GENERATOR_STRATEGY`:

```bash
# Offline / no key needed (default)
GENERATOR_STRATEGY=mock

# Live Suno AI generation
GENERATOR_STRATEGY=suno
```

The factory function (`music/strategies/factory.py`) reads this variable on every request — **no code changes are required** when switching providers.

### Setting up the Suno API key

1. Create an account at **[https://sunoapi.org](https://sunoapi.org)**.
2. Go to **Dashboard → API Keys** and generate a new key.
3. Add it to `backend/.env`:

```bash
SUNO_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GENERATOR_STRATEGY=suno
```

4. Restart the backend so the new variable is picked up:

```bash
docker-compose restart backend
```

> Songs generated by Suno typically take **60–120 seconds**. The frontend polls
> `/api/songs/<id>/generation-status/` every 3 seconds and shows a spinner until
> the status becomes `"complete"` or `"failed"`.

### Architecture overview

```
POST /api/songs/generate/
        │
        ▼
GenerationView (Controller)
        │
        ▼
SongService (Service Layer)
        │
        ▼  (depends only on the abstract interface)
get_generator()   ← factory.py — GRASP Indirection
        │
        ├── GENERATOR_STRATEGY=mock ──▶ MockSongGeneratorStrategy
        └── GENERATOR_STRATEGY=suno ──▶ SunoSongGeneratorStrategy
                                │
                   SongGeneratorStrategy  (ABC)
                   ┌────────────┴────────────┐
                   │ generate(...)           │ poll(provider_job_id)
                   └─────────────────────────┘
```

All views depend only on `SongGeneratorStrategy` — never on `Mock` or `Suno` directly. Swapping the AI provider requires **no changes outside `music/strategies/`** (GRASP Protected Variations). Business logic is encapsulated in `services.py` and `MusicSerializer` handles data transformation (Adapter pattern).

### Running the strategy unit tests

```bash
# Inside the Docker container
docker-compose exec backend python manage.py test music.tests --verbosity=2

# Or directly with Python (local venv active)
cd backend
python manage.py test music.tests --verbosity=2
```

Expected output (all tests passing):

```
...

----------------------------------------------------------------------
Ran 32 tests in 0.048s

OK
```

### Demo — Mock strategy (curl)

With `GENERATOR_STRATEGY=mock` (default), generation completes instantly:

```bash
# 1. Generate a song (returns immediately with status=complete)
curl -s -X POST http://localhost:8000/api/songs/generate/ \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Track","prompt":"upbeat electronic pop"}'
```

```json
{
  "song": {
    "id": "3f2a1b4c-...",
    "title": "Test Track",
    "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "generation_job": {
      "job_id": "9e1d2c3b-...",
      "status": "complete",
      "prompt": "upbeat electronic pop",
      "voice_type": "instrumental"
    }
  }
}
```

### Demo — Suno strategy (curl)

With `GENERATOR_STRATEGY=suno`, generation is async (typically 60–120 s):

```bash
# 1. Generate — returns status=pending with a Suno taskId
curl -s -X POST http://localhost:8000/api/songs/generate/ \
  -H "Content-Type: application/json" \
  -d '{"title":"Rock Anthem","prompt":"heavy guitar riff about freedom","genre":"Rock","voice_type":"male"}'
```

```json
{
  "song": {
    "id": "a1b2c3d4-...",
    "title": "Rock Anthem",
    "audio_url": null,
    "generation_job": {
      "job_id": "e5f6a7b8-...",
      "status": "pending",
      "prompt": "heavy guitar riff",
      "voice_type": "male"
    }
  }
}
```

```bash
# 2. Poll for status
curl -s http://localhost:8000/api/songs/a1b2c3d4-.../generation-status/
```

```json
{
  "job": {
    "status": "complete",
    "prompt": "heavy guitar riff",
    "voice_type": "male"
  }
}
```

---

## Design Documentation

| Document | Description |
|---|---|
| [Domain Model](docs/domain_model.md) | Entities, relationships, and invariants |
| [Class Diagram](docs/class_diagram.md) | Full MVT class diagram with file-to-class mapping |
| [Sequence Diagram](docs/sequence_diagram.md) | Song generation use case end-to-end |

---

## API Documentation

Swagger UI is available at `http://localhost:8000/api/docs/`
