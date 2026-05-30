-- One database, schema-per-service (POC compromise; services only touch own schema).
CREATE SCHEMA IF NOT EXISTS ingestion;
CREATE SCHEMA IF NOT EXISTS profile;
CREATE SCHEMA IF NOT EXISTS risk;
CREATE SCHEMA IF NOT EXISTS intervention;
CREATE SCHEMA IF NOT EXISTS consent;
CREATE SCHEMA IF NOT EXISTS reporting;

-- Tables are created by each service via Hibernate (ddl-auto=update) within its own schema.
