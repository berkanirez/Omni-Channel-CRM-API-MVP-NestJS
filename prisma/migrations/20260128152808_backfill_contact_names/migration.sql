UPDATE "Contact"
SET
  "firstName" = COALESCE("firstName", split_part("fullName", ' ', 1)),
  "lastName"  = COALESCE(
    "lastName",
    NULLIF(trim(substr("fullName", length(split_part("fullName", ' ', 1)) + 2)), '')
  )
WHERE "fullName" IS NOT NULL;
