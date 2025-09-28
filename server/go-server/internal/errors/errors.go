package errors

import "fmt"

// TeamNotFoundError represents when a referenced team doesn't exist
type TeamNotFoundError struct {
	TeamID int
}

func (e *TeamNotFoundError) Error() string {
	return fmt.Sprintf("team with ID %d not found", e.TeamID)
}

func (e *TeamNotFoundError) IsNotFound() bool {
	return true
}

// ValidationError represents validation failures
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation failed for field %s: %s", e.Field, e.Message)
}

// IsValidationError checks if an error is a validation error
func IsValidationError(err error) bool {
	_, ok := err.(*ValidationError)
	return ok
}
