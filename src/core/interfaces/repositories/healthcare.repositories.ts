// src/core/interfaces/repositories/healthcare.repositories.ts
// Repository interfaces for TPA healthcare entities

import {
    Patient,
    Claim,
    Diagnosis,
    Procedure,
    ClaimAttachment,
    Announcement,
    MedicalProvider,
    TPADashboardStats,
    ClaimStatus
} from '../../entities/healthcare';
import {PaginatedResponse, PaginationParams} from "../repositories";


// ============================================================================
// PATIENT REPOSITORY
// ============================================================================

export interface IPatientRepository {
    getAll(params: PaginationParams): Promise<PaginatedResponse<Patient>>;
    getById(id: string): Promise<Patient>;
    getByPatientNumber(patientNumber: string): Promise<Patient>;
    getByNationalId(nationalId: string): Promise<Patient | null>;

    create(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient>;
    update(id: string, patient: Partial<Patient>): Promise<Patient>;
    delete(id: string): Promise<void>;

    // Search
    searchByName(query: string): Promise<Patient[]>;
    getByProviderId(providerId: string, params: PaginationParams): Promise<PaginatedResponse<Patient>>;

    // Medical Record
    getMedicalHistory(patientId: string): Promise<{
        claims: Claim[];
        diagnoses: Diagnosis[];
        procedures: Procedure[];
    }>;
}

// ============================================================================
// CLAIM REPOSITORY
// ============================================================================

export interface IClaimRepository {
    getAll(params: PaginationParams & {
        status?: ClaimStatus;
        providerId?: string;
        patientId?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<PaginatedResponse<Claim>>;

    getById(id: string): Promise<Claim>;
    getByClaimNumber(claimNumber: string): Promise<Claim>;

    create(claim: Omit<Claim, 'id' | 'createdAt' | 'updatedAt' | 'claimNumber'>): Promise<Claim>;
    update(id: string, claim: Partial<Claim>): Promise<Claim>;
    delete(id: string): Promise<void>;

    // Workflow Operations
    submit(claimId: string): Promise<Claim>;
    approve(claimId: string, approvedAmount: number): Promise<Claim>;
    reject(claimId: string, reason: string): Promise<Claim>;

    // Bulk Operations
    bulkSubmit(claimIds: string[]): Promise<Claim[]>;

    // Analytics
    getClaimsByStatus(status: ClaimStatus): Promise<number>;
    getIncompleteClaimsCount(): Promise<number>;
    calculateCompletionPercentage(claimId: string): Promise<number>;

    // Patient Claims
    getPatientClaims(patientId: string): Promise<Claim[]>;
    getPatientActiveClai

    m(): Promise<Claim | null>;
}

// ============================================================================
// DIAGNOSIS REPOSITORY
// ============================================================================

export interface IDiagnosisRepository {
    getByClaimId(claimId: string): Promise<Diagnosis[]>;
    getById(id: string): Promise<Diagnosis>;

    create(diagnosis: Omit<Diagnosis, 'id' | 'createdAt' | 'updatedAt'>): Promise<Diagnosis>;
    update(id: string, diagnosis: Partial<Diagnosis>): Promise<Diagnosis>;
    delete(id: string): Promise<void>;

    // ICD-10 Operations
    searchICD10(query: string, limit?: number): Promise<Array<{
        code: string;
        description: string;
        category: string;
    }>>;

    validateICD10Code(code: string): Promise<boolean>;

    // Analytics
    getMostCommonDiagnoses(limit: number): Promise<Array<{
        code: string;
        description: string;
        count: number;
    }>>;
}

// ============================================================================
// PROCEDURE REPOSITORY
// ============================================================================

export interface IProcedureRepository {
    getByClaimId(claimId: string): Promise<Procedure[]>;
    getById(id: string): Promise<Procedure>;

    create(procedure: Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>): Promise<Procedure>;
    update(id: string, procedure: Partial<Procedure>): Promise<Procedure>;
    delete(id: string): Promise<void>;

    // Procedure Code Operations
    searchProcedureCodes(query: string, limit?: number): Promise<Array<{
        code: string;
        name: string;
        category: string;
        standardPrice: number;
    }>>;

    validateProcedureCode(code: string): Promise<boolean>;

    // Financial Calculations
    calculateTotals(claimId: string): Promise<{
        totalClaimed: number;
        totalApproved: number;
        totalRejected: number;
        coInsurance: number;
    }>;

    // AI Suggestions
    suggestProcedures(diagnosisCodes: string[]): Promise<Array<{
        code: string;
        name: string;
        confidence: number;
        reason: string;
    }>>;
}

// ============================================================================
// ATTACHMENT REPOSITORY
// ============================================================================

export interface IAttachmentRepository {
    getByClaimId(claimId: string): Promise<ClaimAttachment[]>;
    getById(id: string): Promise<ClaimAttachment>;

    upload(file: File, claimId: string, metadata: {
        attachmentType: string;
        description?: string;
    }): Promise<ClaimAttachment>;

    delete(id: string): Promise<void>;

    // Download
    getDownloadUrl(id: string): Promise<string>;

    // Validation
    validateFile(file: File): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
}

// ============================================================================
// ANNOUNCEMENT REPOSITORY
// ============================================================================

export interface IAnnouncementRepository {
    getAll(params: PaginationParams): Promise<PaginatedResponse<Announcement>>;
    getActive(): Promise<Announcement[]>;
    getById(id: string): Promise<Announcement>;

    create(announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement>;
    update(id: string, announcement: Partial<Announcement>): Promise<Announcement>;
    delete(id: string): Promise<void>;

    publish(id: string): Promise<Announcement>;
    archive(id: string): Promise<Announcement>;
}

// ============================================================================
// MEDICAL PROVIDER REPOSITORY
// ============================================================================

export interface IMedicalProviderRepository {
    getAll(params: PaginationParams): Promise<PaginatedResponse<MedicalProvider>>;
    getById(id: string): Promise<MedicalProvider>;
    getByProviderNumber(providerNumber: string): Promise<MedicalProvider>;

    create(provider: Omit<MedicalProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalProvider>;
    update(id: string, provider: Partial<MedicalProvider>): Promise<MedicalProvider>;
    delete(id: string): Promise<void>;

    // Search
    searchByName(query: string): Promise<MedicalProvider[]>;
    getBySpecialty(specialty: string): Promise<MedicalProvider[]>;

    // Status
    activate(id: string): Promise<MedicalProvider>;
    deactivate(id: string): Promise<MedicalProvider>;
}

// ============================================================================
// DASHBOARD REPOSITORY
// ============================================================================

export interface ITPADashboardRepository {
    getStats(providerId?: string): Promise<TPADashboardStats>;
    getClaimsTrend(days: number): Promise<Array<{
        date: string;
        count: number;
        amount: number;
    }>>;
    getApprovalRateByMonth(months: number): Promise<Array<{
        month: string;
        approvalRate: number;
    }>>;
    getTopDiagnoses(limit: number): Promise<Array<{
        code: string;
        description: string;
        count: number;
    }>>;
}

