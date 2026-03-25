# Cantio

A Django REST API for AI-generated music creation. Users can create songs via text prompts, manage a personal library, favourite and share tracks.

## Project Structure
```
Cantio/
├── backend/                 # Django application
│   ├── cantio/             # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   ├── asgi.py
│   │   ├── views.py
│   │   ├── static/         # Static files
│   │   │   └── api/       # API docs
│   │   │       └── openapi.yaml
│   │   └── templates/     # Templates
│   │       └── api/
│   │           └── index.html
│   ├── music/              # Music app
│   │   ├── models/         # Database models
│   │   │   ├── music_creator.py
│   │   │   ├── library.py
│   │   │   └── song.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── apps.py
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env               # Environment variables (not in repo — create from .env.example)
│   └── .env.example
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

### Development superuser (auto-created on first run)
| Variable | Default |
|---|---|
| `DJANGO_SUPERUSER_USERNAME` | `admin` |
| `DJANGO_SUPERUSER_PASSWORD` | `admin` |
| `DJANGO_SUPERUSER_EMAIL` | `admin@example.com` |

---

## API Documentation

Swagger UI is available at `http://localhost:8000/api/docs/`
