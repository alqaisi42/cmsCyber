// src/shared/validation/schemas.ts
// Zod validation schemas for TPA forms

import { z } from 'zod';
import {ClaimType, Gender, MaritalStatus, PatientStatus} from "../../core/entities/healthcare";

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const loginSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters'),
    password: z.string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password must be less than 100 characters'),
    language: z.enum(['en', 'ar']).default('en')
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'New password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// ============================================================================
// PATIENT SCHEMAS
// ============================================================================

export const patientSchema = z.object({
    // Personal Information
    firstName: z.string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must be less than 50 characters'),
    middleName: z.string().max(50).optional(),
    lastName: z.string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must be less than 50 characters'),

    nationalId: z.string()
        .regex(/^\d{10}$/, 'National ID must be exactly 10 digits'),

    dateOfBirth: z.coerce.date()
        .refine((date) => {
            const age = new Date().getFullYear() - date.getFullYear();
            return age >= 0 && age <= 120;
        }, 'Invalid date of birth'),

    gender: z.nativeEnum(Gender),
    maritalStatus: z.nativeEnum(MaritalStatus),

    // Contact Information
    phone: z.string()
        .regex(/^(\+?962|0)?7[789]\d{7}$/, 'Invalid Jordanian phone number'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),

    // Address
    address: z.object({
        street: z.string().optional(),
        city: z.string().min(2, 'City is required'),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().default('Jordan')
    }),

    // Insurance Information
    employeeNumber: z.string().optional(),
    insuranceGroup: z.string().min(1, 'Insurance group is required'),
    insurancePlan: z.string().min(1, 'Insurance plan is required'),
    degree: z.string().optional(),

    // Status
    status: z.nativeEnum(PatientStatus).default(PatientStatus.ACTIVE)
});

export type PatientFormData = z.infer<typeof patientSchema>;

// ============================================================================
// CLAIM SCHEMAS
// ============================================================================

export const claimBasicInfoSchema = z.object({
    visitNumber: z.string().optional(),
    visitDate: z.coerce.date(),
    claimDate: z.coerce.date(),

    patientId: z.string().min(1, 'Patient is required'),
    claimType: z.nativeEnum(ClaimType),

    providerId: z.string().min(1, 'Provider is required'),
    doctorId: z.string().min(1, 'Doctor is required'),
    specialty: z.string().min(1, 'Specialty is required'),

    notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional()
});

export const diagnosisSchema = z.object({
    icdCode: z.string()
        .min(3, 'ICD code is required')
        .max(10, 'ICD code is too long')
        .regex(/^[A-Z]\d{2}(\.\d{1,2})?$/i, 'Invalid ICD-10 format'),
    icdDescription: z.string().min(1, 'Description is required'),
    isPrimary: z.boolean().default(false),
    clinicalNotes: z.string().max(500).optional()
});

export const procedureSchema = z.object({
    procedureCode: z.string().min(1, 'Procedure code is required'),
    procedureName: z.string().min(1, 'Procedure name is required'),

    performedBy: z.string().min(1, 'Doctor is required'),
    performedByName: z.string().min(1, 'Doctor name is required'),
    specialty: z.string().min(1, 'Specialty is required'),

    serviceDate: z.coerce.date(),
    quantity: z.number()
        .int('Quantity must be a whole number')
        .min(1, 'Quantity must be at least 1')
        .max(100, 'Quantity cannot exceed 100'),

    unitPrice: z.number()
        .min(0, 'Price cannot be negative')
        .max(100000, 'Price is too high'),

    discount: z.number()
        .min(0, 'Discount cannot be negative')
        .default(0),

    coInsurance: z.number()
        .min(0, 'Co-insurance cannot be negative')
        .default(0)
});

// Complete claim validation
export const completeClaimSchema = z.object({
    basicInfo: claimBasicInfoSchema,
    diagnoses: z.array(diagnosisSchema)
        .min(1, 'At least one diagnosis is required')
        .max(10, 'Maximum 10 diagnoses allowed'),
    procedures: z.array(procedureSchema)
        .min(1, 'At least one procedure is required')
        .max(50, 'Maximum 50 procedures allowed'),
    notes: z.string().max(2000).optional()
}).refine((data) => {
    // At least one diagnosis must be primary
    return data.diagnoses.some(d => d.isPrimary);
}, {
    message: 'At least one diagnosis must be marked as primary',
    path: ['diagnoses']
}).refine((data) => {
    // Visit date cannot be in the future
    return data.basicInfo.visitDate <= new Date();
}, {
    message: 'Visit date cannot be in the future',
    path: ['basicInfo', 'visitDate']
}).refine((data) => {
    // Claim date should be on or after visit date
    return data.basicInfo.claimDate >= data.basicInfo.visitDate;
}, {
    message: 'Claim date must be on or after visit date',
    path: ['basicInfo', 'claimDate']
});

export type ClaimFormData = z.infer<typeof completeClaimSchema>;

// ============================================================================
// ATTACHMENT SCHEMA
// ============================================================================

export const attachmentUploadSchema = z.object({
    file: z.custom<File>()
        .refine((file) => file instanceof File, 'File is required')
        .refine((file) => {
            const maxSize = 10 * 1024 * 1024; // 10MB
            return file.size <= maxSize;
        }, 'File size must be less than 10MB')
        .refine((file) => {
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            return allowedTypes.includes(file.type);
        }, 'Only JPG, PNG, and PDF files are allowed'),

    attachmentType: z.enum([
        'Lab Report',
        'Medical Report',
        'Prescription',
        'Radiology',
        'Invoice',
        'Other'
    ]),

    description: z.string().max(200).optional()
});

// ============================================================================
// SEARCH & FILTER SCHEMAS
// ============================================================================

export const claimSearchSchema = z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    claimType: z.string().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    patientId: z.string().optional(),
    providerId: z.string().optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
}).refine((data) => {
    // If both dates provided, dateFrom must be before dateTo
    if (data.dateFrom && data.dateTo) {
        return data.dateFrom <= data.dateTo;
    }
    return true;
}, {
    message: 'Start date must be before end date',
    path: ['dateTo']
});

export const patientSearchSchema = z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    insuranceGroup: z.string().optional(),
    providerId: z.string().optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
});

// ============================================================================
// ICD-10 SEARCH SCHEMA
// ============================================================================

export const icd10SearchSchema = z.object({
    query: z.string()
        .min(2, 'Search query must be at least 2 characters')
        .max(100, 'Search query is too long'),
    limit: z.number().int().min(1).max(50).default(10)
});

// ============================================================================
// PROCEDURE CODE SEARCH SCHEMA
// ============================================================================

export const procedureCodeSearchSchema = z.object({
    query: z.string()
        .min(2, 'Search query must be at least 2 characters')
        .max(100, 'Search query is too long'),
    category: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(10)
});

// ============================================================================
// ANNOUNCEMENT SCHEMA
// ============================================================================

export const announcementSchema = z.object({
    title: z.string()
        .min(5, 'Title must be at least 5 characters')
        .max(200, 'Title must be less than 200 characters'),

    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(500, 'Description must be less than 500 characters'),

    content: z.string()
        .min(20, 'Content must be at least 20 characters')
        .max(5000, 'Content must be less than 5000 characters'),

    publishDate: z.coerce.date(),
    expiryDate: z.coerce.date().optional(),

    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),

    targetAudience: z.array(z.string()).min(1, 'At least one audience is required')
}).refine((data) => {
    // If expiry date provided, it must be after publish date
    if (data.expiryDate && data.publishDate) {
        return data.expiryDate > data.publishDate;
    }
    return true;
}, {
    message: 'Expiry date must be after publish date',
    path: ['expiryDate']
});

// ============================================================================
// REPORT GENERATION SCHEMA
// ============================================================================

export const reportGenerationSchema = z.object({
    reportType: z.enum([
        'claims_summary',
        'financial_summary',
        'provider_performance',
        'diagnosis_analysis',
        'procedure_analysis'
    ]),

    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),

    providerId: z.string().optional(),
    status: z.string().optional(),

    format: z.enum(['pdf', 'excel', 'csv']).default('pdf'),

    includeCharts: z.boolean().default(true),
    includeDetails: z.boolean().default(false)
}).refine((data) => {
    return data.dateFrom <= data.dateTo;
}, {
    message: 'Start date must be before end date',
    path: ['dateTo']
}).refine((data) => {
    // Date range should not exceed 1 year
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    return (data.dateTo.getTime() - data.dateFrom.getTime()) <= oneYear;
}, {
    message: 'Date range cannot exceed 1 year',
    path: ['dateTo']
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate form data and return errors
 */
export function validateForm<T extends z.ZodType>(
    schema: T,
    data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
    });

    return { success: false, errors };
}

/**
 * Get field error message
 */
export function getFieldError(
    errors: Record<string, string> | undefined,
    fieldName: string
): string | undefined {
    return errors?.[fieldName];
}

/**
 * Check if field has error
 */
export function hasFieldError(
    errors: Record<string, string> | undefined,
    fieldName: string
): boolean {
    return Boolean(errors?.[fieldName]);
}