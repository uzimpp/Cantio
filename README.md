# Cantio

A Django REST API for AI-generated music creation. Users can create songs via text prompts, manage a personal library, favourite and share tracks.

## Prerequisites

- Docker and Docker Compose

For local development without Docker (not recommended):

- Python 3.12+
- PostgreSQL

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
│   ├── .env               # Environment variables
│   └── .env.example
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Running with Docker (preferred)

1. Copy environment variables and edit to yours:
```bash
cp backend/.env.example backend/.env
```

2. Build and start containers:
```bash
docker-compose up --build
```

The API will be available at `http://localhost:8000`.

To run in the background:
```bash
docker-compose up -d --build
```

## Running Locally

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy environment variables:
```bash
cp .env.example .env
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Start the server:
```bash
python manage.py runserver
```

To create a superuser:
```bash
python manage.py createsuperuser
```

## Common Commands
```bash
# create superuser
docker-compose exec backend python manage.py createsuperuser

# run migrations
docker-compose exec backend python manage.py migrate

# view logs
docker-compose logs -f backend

# stop containers
docker-compose down

# reset database and volumes
docker-compose down -v
```

## Environment Variables

### Required (must edit for production)
| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key - generate a new one for production |
| `DEBUG` | Set to `0` for production (never use `DEBUG=1` in production) |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts (e.g., `yourdomain.com,www.yourdomain.com`) |

### Database (change in production)
| Variable | Default | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | `postgres` | **Change this** - database password |
| `POSTGRES_USER` | `postgres` | Database username (change if desired) |
| `POSTGRES_DB` | `cantio` | Database name |

### Optional (defaults are fine for development)
| Variable | Default | Description |
|---|---|---|
| `POSTGRES_HOST` | `db` | Use `db` for Docker, `localhost` for local dev |
| `POSTGRES_PORT` | `5432` | Database port |
| `STATIC_ROOT` | `staticfiles` | Directory for collected static files |

### Development superuser (optional)
| Variable | Default | Description |
|---|---|---|
| `DJANGO_SUPERUSER_USERNAME` | `admin` | Auto-created superuser username |
| `DJANGO_SUPERUSER_PASSWORD` | `admin` | Auto-created superuser password |
| `DJANGO_SUPERUSER_EMAIL` | `admin@example.com` | Auto-created superuser email |

## API Documentation

Swagger UI is available at `http://localhost:8000/api/docs/`

Use it to view and test all API endpoints.
