#!/bin/bash

# --- CORE LAYER ---
mkdir -p core/entities core/interfaces/repositories

touch core/entities/base.ts
touch core/entities/healthcare.ts
touch core/interfaces/repositories/base.ts
touch core/interfaces/repositories/healthcare.repositories.ts

# --- INFRASTRUCTURE LAYER ---
mkdir -p infrastructure/repositories infrastructure/services

touch infrastructure/repositories/{patient,claim,diagnosis,procedure,announcement}.repository.ts
touch infrastructure/services/{icd10,procedure-codes,ai-suggestions}.service.ts

# --- PRESENTATION LAYER ---
mkdir -p presentation/components/{ui,claims,patients,diagnoses,procedures} presentation/hooks

touch presentation/components/claims/{ClaimForm,ClaimsList,ClaimStatusBadge,ClaimSummary}.tsx
touch presentation/components/patients/{PatientCard,PatientSearch,PatientHistory}.tsx
touch presentation/components/diagnoses/{ICDSearchModal,DiagnosisTable}.tsx
touch presentation/components/procedures/{ProcedureTable,ProcedureModal}.tsx
touch presentation/hooks/{useClaims,usePatients,useICD10}.ts

# --- APP LAYER (Next.js Pages) ---
mkdir -p app/dashboard app/claims app/claims/new app/patients app/patients tmp

# NOTE: Create dynamic folders safely for zsh
mkdir -p "app/claims/[id]" "app/patients/[id]" app/reports app/settings

touch app/dashboard/page.tsx
touch app/claims/page.tsx
touch "app/claims/[id]/page.tsx"
touch app/claims/new/page.tsx
touch app/patients/page.tsx
touch "app/patients/[id]/page.tsx"
touch app/reports/page.tsx
touch app/settings/page.tsx


