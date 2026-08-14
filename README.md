# Userfacet-OA

Backend implementation for the Userfacet Online Assessment, built with **Node.js, Express, TypeScript, and MongoDB/Mongoose**.

The application provides APIs for user authentication, book management, borrowing operations, filtering, and AI-powered functionality.

---

## Features

### Authentication & Users

* User registration and authentication
* JWT-based authentication
* Password hashing using `bcryptjs`
* HTTP cookie support
* User management APIs
* Protected routes using authentication middleware

### Book Management

* Create and manage books
* Retrieve book information
* Search and filter books
* Validation of book-related data
* MongoDB persistence using Mongoose

### Borrowing

* Borrow books
* Manage borrowing records
* Track borrowed books
* Return borrowed books
* User-specific borrowing information

### API Filtering

The API includes reusable filtering functionality for handling:

* Query parameters
* Filtering
* Searching
* Pagination-related query processing

### Security

The application uses several security-oriented middleware and libraries:

* `helmet` for HTTP security headers
* `express-rate-limit` for rate limiting
* `bcryptjs` for password hashing
* JWT for authentication
* Input validation using `validator`
* Cookie parsing using `cookie-parser`

## AI-Powered Book Summaries

The application uses an external AI API endpoint to generate **AI-powered summaries for books**.

When a book is created or processed, the application can send relevant book information to the AI endpoint and use the generated response as the book's summary/description.

This approach avoids manually writing summaries for every book and allows the system to generate consistent descriptions programmatically.

The project uses the Hugging Face Transformers ecosystem for AI-related functionality and integrates the configured API endpoint through the backend.

### AI Summary Flow

```text
Book Information
      │
      ▼
Backend API
      │
      ▼
AI API Endpoint
      │
      ▼
Generated Summary
      │
      ▼
Book stored/returned with AI-generated description
```


The AI API is called from the backend so that API credentials and external-service configuration are not exposed to clients.

## Semantic Vector Search

The application supports **semantic search for books using vector embeddings**.

Instead of relying only on exact keyword matches, book information is converted into a numerical vector representation (embedding). These embeddings are stored with the corresponding book data and used to find books that are semantically similar to a user's search query.

### Vector Search Flow

```text
User Search Query
       │
       ▼
Generate Query Embedding
       │
       ▼
MongoDB Atlas Vector Search
       │
       ▼
Compare Query Vector
with Book Embeddings
       │
       ▼
Rank by Similarity
       │
       ▼
Relevant Books
```

### Approach

1. Book information, including the generated description, is converted into an embedding.
2. The resulting vector is stored alongside the book data.
3. When a user performs a semantic search, the search query is converted into an embedding using the same embedding model.
4. MongoDB Atlas Vector Search is used to perform similarity search against the stored book embeddings.
5. Results are returned based on vector similarity rather than requiring an exact keyword match.

This allows queries such as:

```text
"books about artificial intelligence and machine learning"
```

to find relevant books even when the exact words in the query do not appear in the book's title or description.

### Benefits

* Supports semantic rather than exact keyword matching
* Finds conceptually related books
* Works well with AI-generated book descriptions
* Can be combined with traditional filtering and search
* Provides a foundation for future recommendation functionality



# Tech Stack

| Technology                | Purpose                           |
| ------------------------- | --------------------------------- |
| Node.js                   | JavaScript runtime                |
| Express.js                | REST API framework                |
| TypeScript                | Type-safe application development |
| MongoDB                   | Database                          |
| Mongoose                  | MongoDB ODM                       |
| JWT                       | Authentication                    |
| bcryptjs                  | Password hashing                  |
| Hugging Face Transformers | AI/ML functionality               |
| Axios                     | HTTP requests                     |
| Resend                    | Email delivery                    |
| Helmet                    | HTTP security                     |
| express-rate-limit        | Rate limiting                     |
| Validator                 | Data validation                   |
| Handlebars                | Template rendering                |

---

# Project Structure

```text
userfacet-oa/
│
├── src/
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── bookRoutes.ts
│   │   ├── borrowRoutes.ts
│   │   └── userRoutes.ts
│   │
│   ├── utils/
│   │   └── apiFilter.ts
│   │
│   ├── server.ts
│   │
│   └── ...
│
├── dist/                 # Generated during build
├── package.json
├── package-lock.json
├── tsconfig.json
├── eslint.config.js
├── .gitignore
└── README.md
```

The source code is written in TypeScript and compiled into JavaScript before deployment.

`dist/` is generated by the TypeScript compiler and is therefore not required to be committed to the repository.

---

# Architecture

The application follows a layered REST API architecture.

```text
                    Client
                      │
                      ▼
                Express Server
                      │
          ┌───────────┴───────────┐
          │                       │
       Middleware               Routes
          │                       │
    ┌─────┼─────┐        ┌────────┼────────┐
    │     │     │        │        │        │
   Auth Security Validation     Books    Borrowing
    │     │     │        │        │        │
    └─────┴─────┘        └────────┼────────┘
                                  │
                                  ▼
                              Mongoose
                                  │
                                  ▼
                              MongoDB
```

### Request Flow

A typical request follows this flow:

```text
Client Request
      ↓
Express Middleware
      ↓
Authentication / Validation
      ↓
Route Handler
      ↓
Business Logic
      ↓
Mongoose
      ↓
MongoDB
      ↓
JSON Response
```

This separation makes the API easier to maintain and allows authentication, validation, filtering, and security concerns to be reused across multiple routes.

---

# Approach

## REST API

The backend exposes REST-style endpoints grouped according to their responsibilities.

The main route groups are:

```text
/auth
/books
/borrow
/users
```

Each route group is responsible for a particular domain of the application.

## Authentication

Authentication is implemented using JWT.

After successful authentication, a token is generated and used to authorize protected operations.

Passwords are never stored directly. They are hashed using `bcryptjs` before being persisted.

## Database

MongoDB is used as the primary database.

Mongoose is used to:

* Define data models
* Validate data
* Query MongoDB
* Manage relationships between application entities
* Provide a structured interface to the database

## Filtering

A reusable API filtering utility is used to process query parameters before they are passed to the database layer.

This allows endpoints to support operations such as:

```text
/search
/filter
/sort
/pagination
```

without duplicating the same query-processing logic across different routes.

## Security

Security is treated as a cross-cutting concern.

The application uses:

* Helmet for security headers
* Rate limiting to reduce excessive requests
* JWT authentication for protected resources
* Password hashing
* Input validation
* HTTP cookie handling

---

# Assumptions

The following assumptions were made during implementation:

1. **Users must authenticate before accessing protected resources.**
2. **Passwords are never stored in plain text.**
3. **JWT is used to identify authenticated users.**
4. **A user can have multiple borrowing records.**
5. **A book can be borrowed and later returned.**
6. **Book and user data are persisted in MongoDB rather than in application memory.**
7. **AI-related functionality depends on the availability of the configured Hugging Face/model services.**
8. **The application is intended to be consumed through REST APIs rather than directly serving a frontend application.**

---

# Getting Started

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB or a MongoDB Atlas database
* Git

Check your versions:

```bash
node --version
npm --version
```

---

## Clone the Repository

```bash
git clone <repository-url>
cd userfacet-oa
```

---

## Install Dependencies

```bash
npm install
```

For development/build environments where development dependencies need to be explicitly included:

```bash
npm install --include=dev
```

---

# Environment Variables

Create a `.env` file in the project root.

```env
# Server
PORT=5000

# Database
DB_URL=your_mongodb_connection_string

# Authentication
NODE_ENV=production
JWT_SIGN=your_jwt_secret
JWT_ACCESS_EXPIRE_TIME = 1d
JWT_REFRESH_EXPIRE_TIME = 7d
COOKIE_EXPIRE_TIME = 2
RESEND_KEY = "<resend-api-key>"
RESET_URL = "https://userfacet-oa.onrender.com:3000"
AI_API_URL = "<api_url>"
AI_API_TOKEN = "<api-token>"
```

The exact environment variable names should match the variables used by the application configuration.

---

# Running the Application

## Development

Run the TypeScript server in development mode:

## Build

Compile the TypeScript source code:

```bash
npm run build
```

This runs:

```bash
tsc
```

and generates the compiled JavaScript files inside `dist/`.

---

## Production

After building the project:

```bash
npm start
```

The production server starts from:

```text
dist/server.js
```

---

# Available Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run build`    | Compile TypeScript to JavaScript   |
| `npm start`        | Start compiled production server   |
| `npm run lint`     | Run ESLint                         |
| `npm run lint:fix` | Automatically fix ESLint issues    |
| `npm run format`   | Format source files using Prettier |

---

# API Overview

api documentation is available at [api-docs](https://documenter.getpostman.com/view/47791845/2sBYApyCxd)

# Error Handling

The API follows HTTP status codes to communicate the result of requests.

Typical responses include:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
429 Too Many Requests
500 Internal Server Error
```

Errors are returned as JSON responses so that API clients can handle them consistently.

---

# Security Considerations

The following security practices are followed:

* Secrets are stored using environment variables.
* `.env` is excluded from version control.
* Passwords are hashed before storage.
* JWTs are used for authentication.
* HTTP security headers are configured through Helmet.
* Rate limiting is enabled to reduce abuse.
* User input is validated before processing.
* Database queries are performed through Mongoose rather than directly constructing raw database commands.
