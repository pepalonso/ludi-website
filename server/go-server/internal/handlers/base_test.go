package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestBaseHandler_ValidationErrorResponse(t *testing.T) {
	handler := &BaseHandler{}

	validationErrors := []interface{}{
		map[string]interface{}{
			"field": "FirstName",
			"rule":  "required",
			"value": "",
		},
		map[string]interface{}{
			"field": "Age",
			"rule":  "min",
			"value": -5,
		},
	}

	w := httptest.NewRecorder()

	handler.ValidationErrorResponse(w, validationErrors)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	contentType := w.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("Expected Content-Type 'application/json', got '%s'", contentType)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response["error"] != "Validation failed" {
		t.Errorf("Expected error 'Validation failed', got '%v'", response["error"])
	}

	if response["code"] != "VALIDATION_ERROR" {
		t.Errorf("Expected code 'VALIDATION_ERROR', got '%v'", response["code"])
	}

	if response["message"] != "One or more fields failed validation" {
		t.Errorf("Expected message 'One or more fields failed validation', got '%v'", response["message"])
	}

	details, ok := response["details"].([]interface{})
	if !ok {
		t.Fatal("Expected 'details' to be an array")
	}

	if len(details) != 2 {
		t.Errorf("Expected 2 validation errors, got %d", len(details))
	}
}
