package request

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
)

func ExtractQueryParam(r *http.Request, paramName string) (string, error) {
	paramValue := r.URL.Query().Get(paramName)
	if paramValue == "" {
		return "", fmt.Errorf("query parameter '%s' not found", paramName)
	}
	return paramValue, nil
}

func ExtractIntQueryParam(r *http.Request, paramName string) (int, error) {
	paramValue := r.URL.Query().Get(paramName)
	if paramValue == "" {
		return 0, fmt.Errorf("query parameter '%s' not found", paramName)
	}

	intValue, err := strconv.Atoi(paramValue)
	if err != nil {
		log.Printf("ERROR: Failed to convert query parameter '%s' to integer: value='%s', error=%v", paramName, paramValue, err)
		return 0, fmt.Errorf("invalid %s: must be a valid integer", paramName)
	}

	return intValue, nil
}

func ExtractIntQueryParamWithDefault(r *http.Request, paramName string, defaultValue int) int {
	value, err := ExtractIntQueryParam(r, paramName)
	if err != nil {
		log.Printf("WARNING: Using default value for query parameter '%s': %d (error: %v)", paramName, defaultValue, err)
		return defaultValue
	}
	return value
}

func ExtractOptionalQueryParam(r *http.Request, paramName string) *string {
	paramValue := r.URL.Query().Get(paramName)
	if paramValue == "" {
		return nil
	}
	return &paramValue
}

func ExtractOptionalIntQueryParam(r *http.Request, paramName string) (*int, error) {
	paramValue := r.URL.Query().Get(paramName)
	if paramValue == "" {
		return nil, nil
	}

	intValue, err := strconv.Atoi(paramValue)
	if err != nil {
		log.Printf("ERROR: Failed to convert query parameter '%s' to integer: value='%s', error=%v", paramName, paramValue, err)
		return nil, fmt.Errorf("invalid %s: must be a valid integer", paramName)
	}

	return &intValue, nil
}
