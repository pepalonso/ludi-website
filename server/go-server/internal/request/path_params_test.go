package request

import (
	"net/http/httptest"
	"testing"
)

func TestExtractParam(t *testing.T) {
	t.Run("Path Parameter should be extracted", func(t *testing.T) {
		request := httptest.NewRequest("GET", "/api/players/1", nil)
		request.SetPathValue("id", "1")

		param, err := ExtractParam(request, "id")
		if err != nil {
			t.Fatal(err)
		}

		if param != "1" {
			t.Errorf("Expected param to be '1', got '%s'", param)
		}
	})

	t.Run("If Path Parameter is not found it should return error", func(t *testing.T) {
		request := httptest.NewRequest("GET", "/api/players", nil)

		param, err := ExtractParam(request, "id")

		if err == nil {
			t.Fatal("Error should not be nil")
		}

		if param != "" {
			t.Errorf("Expected param to be empty, got '%s'", param)
		}
	})
}

func TestExtractIntParam(t *testing.T) {
	t.Run("Path Parameter should be extracted", func(t *testing.T) {
		request := httptest.NewRequest("GET", "/api/players/1", nil)
		request.SetPathValue("id", "1")

		param, err := ExtractIntParam(request, "id")

		if param != 1 {
			t.Fatalf("Expected param to be 1, got %d", param)
		}

		if err != nil {
			t.Errorf("Expected error to be nil, got %v", err)
		}
	})
}

func TestExtractIntParamWithDefault(t *testing.T) {
	t.Run("If Path Parameter is found it should return the value", func(t *testing.T) {
		request := httptest.NewRequest("GET", "/api/players/1", nil)
		request.SetPathValue("id", "1")

		param := ExtractIntParamWithDefault(request, "id", 10)

		if param != 1 {
			t.Fatalf("Expected param to be 1, got %d", param)
		}
	})

	t.Run("If Path Parameter is not found it should return default value", func(t *testing.T) {
		request := httptest.NewRequest("GET", "/api/players", nil)

		param := ExtractIntParamWithDefault(request, "id", 10)

		if param != 10 {
			t.Fatalf("Expected param to be 10, got %d", param)
		}
	})
}
