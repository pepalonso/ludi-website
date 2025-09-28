# API Documentation

## 📖 OpenAPI/Swagger Documentation

The API is documented using OpenAPI 3.0.4 specification in `openapi.yaml`.

### 🚀 Viewing the Documentation

You can view the API documentation using any OpenAPI viewer:

1. **Swagger UI**: Upload `openapi.yaml` to [editor.swagger.io](https://editor.swagger.io/)
2. **Redoc**: Use [redocly.github.io/redoc](https://redocly.github.io/redoc/) with the YAML file
3. **VS Code**: Install the "OpenAPI (Swagger) Editor" extension

### 📋 Current Endpoints

#### Clubs API

- `GET /api/clubs` - List all clubs
- `POST /api/clubs` - Create a new club
- `GET /api/clubs/{id}` - Get club by ID
- `PUT /api/clubs/{id}` - Update club
- `DELETE /api/clubs/{id}` - Delete club

#### Health Check

- `GET /health` - Check API health

### 🔧 Testing the API

You can test the endpoints using curl:

```bash
# List all clubs
curl http://localhost:8080/api/clubs

# Create a club
curl -X POST http://localhost:8080/api/clubs \
  -H "Content-Type: application/json" \
  -d '{"name": "Barcelona Basketball Club"}'

# Get club by ID
curl http://localhost:8080/api/clubs/1

# Update club
curl -X PUT http://localhost:8080/api/clubs/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "FC Barcelona Basketball"}'

# Delete club
curl -X DELETE http://localhost:8080/api/clubs/1
```

### 📝 Adding New Endpoints

When you add new endpoints:

1. **Update the handler** in `internal/handlers/`
2. **Add routes** in `internal/handlers/routes.go`
3. **Document the endpoint** in `openapi.yaml`
4. **Test the endpoint** to ensure it works

### 🎯 Response Format

All API responses follow this format:

#### Success Response

```json
{
  "id": 1,
  "name": "Barcelona Basketball Club",
  "created_at": "2025-01-19T20:30:00Z",
  "updated_at": "2025-01-19T20:30:00Z"
}
```

#### Error Response

```json
{
  "error": "Club not found"
}
```

### 🔒 Authentication

Currently, the API doesn't require authentication. When you add authentication:

1. Update the `securitySchemes` in `openapi.yaml`
2. Add security requirements to protected endpoints
3. Implement authentication middleware in the handlers
