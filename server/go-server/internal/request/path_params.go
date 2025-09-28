package request

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
)

func ExtractParam(r *http.Request, paramName string) (string, error) {
	paramValue := r.PathValue(paramName)
	if paramValue == "" {
		err := fmt.Errorf("%s is required", paramName)
		return "", err
	}
	return paramValue, nil
}

func ExtractIntParam(r *http.Request, paramName string) (int, error) {
	paramValue, err := ExtractParam(r, paramName)
	if err != nil {
		return 0, err
	}

	intValue, err := strconv.Atoi(paramValue)
	if err != nil {
		log.Printf("ERROR: Failed to convert path parameter '%s' to integer: value='%s', error=%v", paramName, paramValue, err)
		return 0, fmt.Errorf("invalid %s: must be a valid integer", paramName)
	}

	return intValue, nil
}

func ExtractIntParamWithDefault(r *http.Request, paramName string, defaultValue int) int {
	paramValue, err := ExtractParam(r, paramName)
	if err != nil {
		log.Printf("WARNING: Using default value for path parameter '%s': %d (error: %v)", paramName, defaultValue, err)
		return defaultValue
	}

	intValue, err := strconv.Atoi(paramValue)
	if err != nil {
		log.Printf("WARNING: Using default value for path parameter '%s': %d (error: invalid %s: must be a valid integer)", paramName, defaultValue, paramName)
		return defaultValue
	}

	return intValue
}
