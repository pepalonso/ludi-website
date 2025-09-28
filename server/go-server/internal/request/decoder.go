package request

import (
	"encoding/json"
	"net/http"
)

type Decoder struct {
	responseWriter http.ResponseWriter
}

func NewDecoder(responseWriter http.ResponseWriter) *Decoder {
	return &Decoder{
		responseWriter: responseWriter,
	}
}

func (decoder *Decoder) Decode(request *http.Request, target interface{}) error {
	if err := json.NewDecoder(request.Body).Decode(target); err != nil {
		decoder.sendError(http.StatusBadRequest, "Invalid request body", "INVALID_JSON")
		return err
	}
	return nil
}

func (decoder *Decoder) sendError(status int, message, code string) {
	response := map[string]interface{}{
		"error": message,
		"code":  code,
	}
	decoder.responseWriter.Header().Set("Content-Type", "application/json")
	decoder.responseWriter.WriteHeader(status)
	json.NewEncoder(decoder.responseWriter).Encode(response)
}
