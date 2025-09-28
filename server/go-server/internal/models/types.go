package models

import "time"

type Category string

const (
	CategoryPreMini     Category = "Pre-mini"
	CategoryMini        Category = "Mini"
	CategoryPreInfantil Category = "Pre-infantil"
	CategoryInfantil    Category = "Infantil"
	CategoryCadet       Category = "Cadet"
	CategoryJunior      Category = "Júnior"
)

type Gender string

const (
	GenderMasculi Gender = "Masculí"
	GenderFemeni  Gender = "Femení"
)

type Status string

const (
	StatusPendingPayment Status = "pending_payment"
	StatusCanceled       Status = "canceled"
	StatusActive         Status = "active"
)

type ShirtSize string

const (
	ShirtSize8   ShirtSize = "8"
	ShirtSize10  ShirtSize = "10"
	ShirtSize12  ShirtSize = "12"
	ShirtSize14  ShirtSize = "14"
	ShirtSizeS   ShirtSize = "S"
	ShirtSizeM   ShirtSize = "M"
	ShirtSizeL   ShirtSize = "L"
	ShirtSizeXL  ShirtSize = "XL"
	ShirtSize2XL ShirtSize = "2XL"
	ShirtSize3XL ShirtSize = "3XL"
	ShirtSize4XL ShirtSize = "4XL"
)

func ParseShirtSize(s string) (ShirtSize, bool) {
	switch s {
	case "8", "10", "12", "14", "S", "M", "L", "XL", "2XL", "3XL", "4XL":
		return ShirtSize(s), true
	default:
		return "", false
	}
}

type AllergySeverity string

const (
	AllergySeverityLow    AllergySeverity = "low"
	AllergySeverityMedium AllergySeverity = "medium"
	AllergySeverityHigh   AllergySeverity = "high"
)

type DocumentType string

const (
	DocumentTypeMedicalCertificate DocumentType = "medical_certificate"
	DocumentTypeParentalConsent    DocumentType = "parental_consent"
	DocumentTypePhotoRelease       DocumentType = "photo_release"
	DocumentTypeOther              DocumentType = "other"
)

type AccessLevel string

const (
	AccessLevelView  AccessLevel = "view"
	AccessLevelEdit  AccessLevel = "edit"
	AccessLevelAdmin AccessLevel = "admin"
)

type ChangeAction string

const (
	ChangeActionInsert ChangeAction = "INSERT"
	ChangeActionUpdate ChangeAction = "UPDATE"
	ChangeActionDelete ChangeAction = "DELETE"
)

type BaseModel struct {
	ID        int       `json:"id" db:"id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type NullableString struct {
	String string
	Valid  bool
}

type NullableTime struct {
	Time  time.Time
	Valid bool
}
