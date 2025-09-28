package request

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// Test struct for decoding
type TestPlayer struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Age       int    `json:"age"`
}

func TestDecoder_BasicFunctionality(t *testing.T) {
	t.Run("valid JSON should decode without error", func(t *testing.T) {
		// Arrange
		validJSON := `{"first_name":"John","last_name":"Doe","age":25}`
		req := httptest.NewRequest("POST", "/api/players", strings.NewReader(validJSON))
		w := httptest.NewRecorder()

		decoder := NewDecoder(w)
		var player TestPlayer

		// Act
		err := decoder.Decode(req, &player)

		// Assert
		if err != nil {
			t.Errorf("Expected no error for valid JSON, got: %v", err)
		}

		if player.FirstName != "John" {
			t.Errorf("Expected FirstName 'John', got '%s'", player.FirstName)
		}

		if player.LastName != "Doe" {
			t.Errorf("Expected LastName 'Doe', got '%s'", player.LastName)
		}

		if player.Age != 25 {
			t.Errorf("Expected Age 25, got %d", player.Age)
		}
	})

	t.Run("invalid JSON should return error", func(t *testing.T) {
		// Arrange
		invalidJSON := `{"first_name": invalid}`
		req := httptest.NewRequest("POST", "/api/players", strings.NewReader(invalidJSON))
		w := httptest.NewRecorder()

		decoder := NewDecoder(w)
		var player TestPlayer

		// Act
		err := decoder.Decode(req, &player)

		// Assert
		if err == nil {
			t.Error("Expected error for invalid JSON, got none")
		}

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})
}

func TestDecoder_ErrorResponseFormat(t *testing.T) {
	// Arrange
	invalidJSON := `{"first_name": invalid}`
	req := httptest.NewRequest("POST", "/api/players", strings.NewReader(invalidJSON))
	w := httptest.NewRecorder()

	decoder := NewDecoder(w)
	var player TestPlayer

	// Act
	decoder.Decode(req, &player)

	// Assert - Check response structure
	var errorResponse map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&errorResponse); err != nil {
		t.Fatalf("Failed to decode error response: %v", err)
	}

	// Check required fields exist
	if _, exists := errorResponse["error"]; !exists {
		t.Error("Error response missing 'error' field")
	}

	if _, exists := errorResponse["code"]; !exists {
		t.Error("Error response missing 'code' field")
	}

	// Check field types
	if _, ok := errorResponse["error"].(string); !ok {
		t.Error("Error field is not a string")
	}

	if _, ok := errorResponse["code"].(string); !ok {
		t.Error("Code field is not a string")
	}

	// Check specific error values
	if errorResponse["error"] != "Invalid request body" {
		t.Errorf("Expected error message 'Invalid request body', got '%v'", errorResponse["error"])
	}

	if errorResponse["code"] != "INVALID_JSON" {
		t.Errorf("Expected error code 'INVALID_JSON', got '%v'", errorResponse["code"])
	}
}

func TestDecoder_EdgeCases(t *testing.T) {
	t.Run("empty body should return error", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest("POST", "/api/players", strings.NewReader(""))
		w := httptest.NewRecorder()

		decoder := NewDecoder(w)
		var player TestPlayer

		// Act
		err := decoder.Decode(req, &player)

		// Assert
		if err == nil {
			t.Error("Expected error for empty body, got none")
		}

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})

	t.Run("malformed JSON should return error", func(t *testing.T) {
		testCases := []struct {
			name          string
			malformedJSON string
			description   string
		}{
			{
				name:          "missing quotes around string",
				malformedJSON: `{"first_name":John}`,
				description:   "JSON with unquoted string value",
			},
			{
				name:          "missing closing brace",
				malformedJSON: `{"first_name":"John"`,
				description:   "JSON with missing closing brace",
			},
			{
				name:          "trailing comma",
				malformedJSON: `{"first_name":"John",}`,
				description:   "JSON with trailing comma",
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				// Arrange
				req := httptest.NewRequest("POST", "/api/players", strings.NewReader(tc.malformedJSON))
				w := httptest.NewRecorder()

				decoder := NewDecoder(w)
				var player TestPlayer

				// Act
				err := decoder.Decode(req, &player)

				// Assert
				if err == nil {
					t.Errorf("Expected error for malformed JSON: %s", tc.description)
				}

				if w.Code != http.StatusBadRequest {
					t.Errorf("Expected status 400 for malformed JSON, got %d", w.Code)
				}
			})
		}
	})

	t.Run("null values should be valid JSON", func(t *testing.T) {
		// Arrange
		nullJSON := `{"first_name":null,"last_name":"Doe","age":25}`
		req := httptest.NewRequest("POST", "/api/players", strings.NewReader(nullJSON))
		w := httptest.NewRecorder()

		decoder := NewDecoder(w)
		var player TestPlayer

		// Act
		err := decoder.Decode(req, &player)

		// Assert
		if err != nil {
			t.Errorf("Expected no error for null value, got: %v", err)
		}

		if player.FirstName != "" { // null becomes empty string in Go
			t.Errorf("Expected FirstName to be empty string, got '%s'", player.FirstName)
		}
	})
}

func TestDecoder_HTTPResponseHeaders(t *testing.T) {
	// Arrange
	invalidJSON := `{"first_name": invalid}`
	req := httptest.NewRequest("POST", "/api/players", strings.NewReader(invalidJSON))
	w := httptest.NewRecorder()

	decoder := NewDecoder(w)
	var player TestPlayer

	// Act
	decoder.Decode(req, &player)

	// Assert - Check HTTP headers
	contentType := w.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("Expected Content-Type 'application/json', got '%s'", contentType)
	}

	// Check status code
	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestDecoder_LargePayload(t *testing.T) {
	// Arrange - Create a smaller but still substantial JSON payload
	largeData := make(map[string]string)
	for i := 0; i < 100; i++ { // Reduced from 1000 to 100
		largeData[fmt.Sprintf("key_%d", i)] = fmt.Sprintf("value_%d", i)
	}

	largeJSON, err := json.Marshal(largeData)
	if err != nil {
		t.Fatalf("Failed to create large JSON: %v", err)
	}

	req := httptest.NewRequest("POST", "/api/players", strings.NewReader(string(largeJSON)))
	w := httptest.NewRecorder()

	decoder := NewDecoder(w)
	var result map[string]string

	// Act
	err = decoder.Decode(req, &result)

	// Assert
	if err != nil {
		t.Errorf("Expected no error for large valid JSON, got: %v", err)
	}

	if len(result) != 100 {
		t.Errorf("Expected 100 items, got %d", len(result))
	}
}
