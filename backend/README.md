# CargoVan Connect Backend (FastAPI)

## Tech Stack
- FastAPI (modular structure)
- SQLite (MVP) with SQLAlchemy ORM
- JWT authentication

## Structure
- `main.py`: FastAPI app entry point
- `routes/`: API endpoints (user, booking, etc.)
- `models/`: SQLAlchemy models
- `schemas/`: Pydantic schemas
- `db/`: Database logic

## Setup
1. Create a virtual environment:
	```bash
	python -m venv venv
	source venv/bin/activate  # On Windows: venv\Scripts\activate
	```
2. Install dependencies:
	```bash
	pip install -r requirements.txt
	```
3. Initialize the database:
	```bash
	python app/db/init_db.py
	```
4. Run the server:
	```bash
	uvicorn app.main:app --reload
	```

## Deployment
- Recommended: Render or Railway
- Set environment variables as needed

## Authentication

### Signup
**Endpoint:** `POST /users/signup`

**Request Body:**
```json
{
	"email": "user@example.com",
	"name": "John Doe",
	"password": "yourpassword"
}
```

**Response:**
Returns the created user (without password).

### Login
**Endpoint:** `POST /users/login`

**Request Body (form):**
| Field    | Type   | Description         |
|----------|--------|---------------------|
| username | string | User's email        |
| password | string | User's password     |

**Response:**
```json
{
	"access_token": "<JWT_TOKEN>",
	"token_type": "bearer"
}
```

**Usage:**
- Use the `access_token` as a Bearer token in the `Authorization` header for protected endpoints.

**Security:**
- Passwords are hashed using bcrypt.
- JWT tokens are signed with the server's `SECRET_KEY`.