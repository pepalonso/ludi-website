package request

import (
	"net/http/httptest"
	"testing"
)

func TestExtractQueryParam(t *testing.T) {
	t.Run("Query parameter should be extracted", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/players?age=25", nil)

		param, err := ExtractQueryParam(req, "age")
		if err != nil {
			t.Fatal(err)
		}

		if param != "25" {
			t.Errorf("Expected param to be '25', got '%s'", param)
		}
	})

	t.Run("Missing query parameter should return error", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/players", nil)

		param, err := ExtractQueryParam(req, "age")
		if err == nil {
			t.Fatal("Expected error for missing parameter, got none")
		}

		if param != "" {
			t.Errorf("Expected param to be empty, got '%s'", param)
		}
	})
}

func TestExtractOptionalQueryParam(t *testing.T) {
	t.Run("Query parameter should be extracted", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/players?age=25", nil)

		param := ExtractOptionalQueryParam(req, "age")
		if param == nil {
			t.Fatal("Expected param to not be nil")
		}

		if *param != "25" {
			t.Errorf("Expected param to be '25', got '%s'", *param)
		}
	})

	t.Run("Missing query parameter should return nil", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/players", nil)

		param := ExtractOptionalQueryParam(req, "age")
		if param != nil {
			t.Errorf("Expected param to be nil, got '%s'", *param)
		}
	})

	t.Run("Empty query parameter should return nil", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/players?age=", nil)

		param := ExtractOptionalQueryParam(req, "age")
		if param != nil {
			t.Errorf("Expected param to be nil for empty value, got '%s'", *param)
		}
	})
}

func TestExtractOptionalIntQueryParam(t *testing.T) {
	t.Run("Integer query parameter should be extracted", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/players?age=25", nil)

		param, err := ExtractOptionalIntQueryParam(req, "age")
		if err != nil {
			t.Fatal(err)
		}

		if param == nil {
			t.Fatal("Expected param to not be nil")
		}

		if *param != 25 {
			t.Errorf("Expected param to be 25, got %d", *param)
		}
	})

	t.Run("Missing query parameter should return nil", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/players", nil)

		param, err := ExtractOptionalIntQueryParam(req, "age")
		if err != nil {
			t.Fatal(err)
		}

		if param != nil {
			t.Errorf("Expected param to be nil, got %d", *param)
		}
	})

	t.Run("Zero value should be valid", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/players?age=0", nil)

		param, err := ExtractOptionalIntQueryParam(req, "age")
		if err != nil {
			t.Fatal(err)
		}

		if param == nil {
			t.Fatal("Expected param to not be nil")
		}

		if *param != 0 {
			t.Errorf("Expected param to be 0, got %d", *param)
		}
	})
}
