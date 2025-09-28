# HTTP Handler System Guide

## 🎯 Overview

This guide explains how to create HTTP handlers for your Go API. The system uses Go's standard `net/http` package with a clean, modular structure.

## 📁 File Structure

```
internal/handlers/
├── base.go                    # Base handler with common functionality
├── club_handler.go            # Complete club handler example
├── team_handler_example.go    # Team handler example (partial)
├── routes.go                  # Routing configuration
└── [other_handlers].go        # Additional handlers you'll create

cmd/server/
└── main.go                    # Main server file
```

## 🔧 Handler Pattern

### 1. Base Handler Structure

Every handler embeds the `BaseHandler` which provides:

- Database repository access
- JSON response helpers
- Error response helpers

```go
type YourHandler struct {
    *BaseHandler
}

func NewYourHandler(repo database.Repository) *YourHandler {
    return &YourHandler{
        BaseHandler: NewBaseHandler(repo),
    }
}
```

### 2. Handler Method Pattern

Each handler method follows this pattern:

```go
func (h *YourHandler) YourMethod(w http.ResponseWriter, r *http.Request) {
    // 1. Parse request (body, query params, path params)
    // 2. Validate input
    // 3. Call repository method
    // 4. Return response
}
```

## 🌐 Routing System

### Go 1.22+ Pattern Matching

We use Go 1.22's new pattern matching for routes:

```go
// In routes.go
mux.HandleFunc("POST /api/clubs", h.clubHandler.CreateClub)
mux.HandleFunc("GET /api/clubs", h.clubHandler.ListClubs)
mux.HandleFunc("GET /api/clubs/{id}", h.clubHandler.GetClub)
mux.HandleFunc("PUT /api/clubs/{id}", h.clubHandler.UpdateClub)
mux.HandleFunc("DELETE /api/clubs/{id}", h.clubHandler.DeleteClub)
```

### URL Parameter Extraction

For path parameters like `{id}`, you extract them from query parameters:

```go
// Extract ID from URL path
idStr := r.URL.Query().Get("id")
if idStr == "" {
    h.ErrorResponse(w, http.StatusBadRequest, "ID is required")
    return
}

id, err := strconv.Atoi(idStr)
if err != nil {
    h.ErrorResponse(w, http.StatusBadRequest, "Invalid ID")
    return
}
```

## 📝 Complete Handler Example

Here's a complete example for the Club handler:

### Request/Response Examples

#### Create Club

```http
POST /api/clubs
Content-Type: application/json

{
    "name": "Barcelona Basketball Club"
}
```

Response:

```json
{
  "id": 1,
  "name": "Barcelona Basketball Club",
  "created_at": "2025-01-19T20:30:00Z",
  "updated_at": "2025-01-19T20:30:00Z"
}
```

#### List Clubs

```http
GET /api/clubs?page=1&page_size=10&search=barcelona
```

Response:

```json
{
  "clubs": [
    {
      "id": 1,
      "name": "Barcelona Basketball Club",
      "created_at": "2025-01-19T20:30:00Z",
      "updated_at": "2025-01-19T20:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10,
  "total_pages": 1
}
```

#### Get Club

```http
GET /api/clubs/1
```

#### Update Club

```http
PUT /api/clubs/1
Content-Type: application/json

{
    "name": "FC Barcelona Basketball"
}
```

#### Delete Club

```http
DELETE /api/clubs/1
```

## 🛠️ Creating New Handlers

### Step 1: Create Handler File

Create `internal/handlers/your_handler.go`:

```go
package handlers

import (
    "encoding/json"
    "fmt"
    "net/http"
    "strconv"

    "tournament-dev/internal/models"
)

type YourHandler struct {
    *BaseHandler
}

func NewYourHandler(repo database.Repository) *YourHandler {
    return &YourHandler{
        BaseHandler: NewBaseHandler(repo),
    }
}

// CRUD methods follow the same pattern as ClubHandler
```

### Step 2: Add to Router

In `routes.go`, add your handler:

```go
type Router struct {
    clubHandler *ClubHandler
    yourHandler *YourHandler  // Add this
}

func NewRouter(repo database.Repository) *Router {
    return &Router{
        clubHandler: NewClubHandler(repo),
        yourHandler: NewYourHandler(repo),  // Add this
    }
}

func (r *Router) SetupRoutes(mux *http.ServeMux) {
    // Your routes
    mux.HandleFunc("POST /api/yours", r.yourHandler.Create)
    mux.HandleFunc("GET /api/yours", r.yourHandler.List)
    mux.HandleFunc("GET /api/yours/{id}", r.yourHandler.Get)
    mux.HandleFunc("PUT /api/yours/{id}", r.yourHandler.Update)
    mux.HandleFunc("DELETE /api/yours/{id}", r.yourHandler.Delete)
}
```

## 🔍 Query Parameters

### Pagination

```http
GET /api/teams?page=1&page_size=20
```

### Filtering

```http
GET /api/teams?category=senior&gender=male&status=active
```

### Search

```http
GET /api/teams?search=barcelona
```

### Combined

```http
GET /api/teams?page=1&page_size=10&category=senior&search=barcelona
```

## 📊 Response Helpers

### Success Response

```go
h.JSONResponse(w, http.StatusOK, data)
h.JSONResponse(w, http.StatusCreated, data)
```

### Error Response

```go
h.ErrorResponse(w, http.StatusBadRequest, "Invalid input")
h.ErrorResponse(w, http.StatusNotFound, "Resource not found")
h.ErrorResponse(w, http.StatusInternalServerError, "Database error")
```

## 🚀 Running the Server

```bash
# Build and run
go run cmd/server/main.go

# Or build and run binary
go build cmd/server/main.go
./main
```

The server will start on `http://localhost:8080`

## 🔧 Environment Variables

Set these environment variables for database connection:

```bash
DB_HOST=localhost
DB_PORT=3307
DB_USER=tournament_user
DB_PASSWORD=tournament_dev_pass
DB_NAME=tournament
```

## 📋 Next Steps

1. **Create remaining handlers**: Team, Player, Coach, Allergy, Document
2. **Add validation**: Input validation and business rules
3. **Add authentication**: JWT tokens, middleware
4. **Add logging**: Structured logging
5. **Add tests**: Unit and integration tests
6. **Add documentation**: OpenAPI/Swagger docs

## 🎯 Handler Checklist

For each handler, implement:

- [ ] Create method (POST)
- [ ] List method (GET with pagination/filtering)
- [ ] Get by ID method (GET /{id})
- [ ] Update method (PUT /{id})
- [ ] Delete method (DELETE /{id})
- [ ] Any special methods (stats, relations, etc.)
- [ ] Input validation
- [ ] Error handling
- [ ] Add to router
- [ ] Test endpoints
