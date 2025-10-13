// src/core/entities/healthcare.ts
// Healthcare-specific domain entities for TPA system


// ============================================================================
// PATIENT ENTITIES
// ============================================================================

import {BaseEntity} from "./index";

export interface Patient extends BaseEntity {
  patientNumber: string; // Unique identifier
  employeeNumber?: string; // For corporate insurance
  nationalId: string;

  // Personal Information
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string; // Computed
  dateOfBirth: Date;
  gender: Gender;
  maritalStatus: MaritalStatus;

  // Contact
  phone: string;
  email?: string;
  address: Address;

  // Insurance Information
  insuranceGroup: string;
  insurancePlan: string;
  riskCarrier: RiskCarrier;
  degree: string; // Employee degree/level
  headOfFamily?: string; // Reference to main policy holder

  // Medical
  bloodType?: BloodType;
  allergies?: string[];
  chronicDiseases?: string[];

  // System
  status: PatientStatus;
  providerId: string; // Assigned clinic/provider
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED'
}

export enum RiskCarrier {
  RISK_CARRIER_TESTING = 'Risk Carrier Testing',
  STANDARD = 'Standard',
  HIGH_RISK = 'High Risk'
}

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-'
}

export enum PatientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export interface Address {
  street?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

// ============================================================================
// CLAIM ENTITIES
// ============================================================================

export interface Claim extends BaseEntity {
  claimNumber: string; // Auto-generated: 0001-, H001-117771, etc.
  visitNumber: string;

  // Patient Reference
  patientId: string;
  patient?: Patient; // Populated relation

  // Provider/Doctor Information
  providerId: string; // Clinic/Medical provider
  providerName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;

  // Claim Details
  claimType: ClaimType;
  claimDate: Date;
  visitDate: Date;

  // Medical Information
  diagnoses: Diagnosis[]; // ICD-10 codes
  procedures: Procedure[]; // Procedures/services
  attachments: ClaimAttachment[];
  notes?: string;

  // Financial
  totalClaimedAmount: number;
  totalApprovedAmount: number;
  totalRejectedAmount: number;
  coInsurance: number;
  patientResponsibility: number;

  // Status & Workflow
  status: ClaimStatus;
  completionPercentage: number; // 0-100, based on required fields
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Audit
  submittedBy?: string;
  reviewedBy?: string;
}

export enum ClaimType {
  OUTPATIENT = 'Outpatient',
  INPATIENT = 'Inpatient',
  EMERGENCY = 'Emergency',
  DENTAL = 'Dental',
  PHARMACY = 'Pharmacy'
}

export enum ClaimStatus {
  DRAFT = 'Draft',
  INCOMPLETE = 'Incomplete',
  READY = 'Ready',
  SUBMITTED = 'Submitted',
  UNDER_REVIEW = 'Under Review',
  APPROVED = 'Approved',
  PARTIALLY_APPROVED = 'Partially Approved',
  REJECTED = 'Rejected',
  PAID = 'Paid'
}

// ============================================================================
// DIAGNOSIS (ICD-10)
// ============================================================================

export interface Diagnosis extends BaseEntity {
  claimId: string;

  // ICD-10 Code
  icdCode: string; // e.g., "R10.83"
  icdDescription: string; // e.g., "Colic"
  icdVersion: string; // "ICD-10"

  // Classification
  isPrimary: boolean; // Primary vs secondary diagnosis
  diagnosisOrder: number; // 1, 2, 3...

  // Clinical Details
  clinicalNotes?: string;
  onsetDate?: Date;
  resolvedDate?: Date;
}

// ============================================================================
// PROCEDURE/SERVICE
// ============================================================================

export interface Procedure extends BaseEntity {
  claimId: string;

  // Procedure Code (CPT-like or internal)
  procedureCode: string; // e.g., "2964"
  procedureName: string; // e.g., "Doctor Examination"
  category?: string;

  // Provider Information
  performedBy: string; // Doctor ID
  performedByName: string;
  specialty: string;

  // Service Details
  serviceDate: Date;
  quantity: number; // Number of times performed

  // Financial
  unitPrice: number;
  claimedAmount: number; // quantity * unitPrice
  discount: number;
  netAmount: number; // After discount
  coInsurance: number;
  rejectedAmount: number;
  approvedAmount: number;
  service: number; // Service charge

  // Status
  approvalStatus: ProcedureApprovalStatus;
  rejectionReason?: string;
}

export enum ProcedureApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  PARTIALLY_APPROVED = 'Partially Approved',
  REJECTED = 'Rejected'
}

// ============================================================================
// ATTACHMENTS
// ============================================================================

export interface ClaimAttachment extends BaseEntity {
  claimId: string;

  fileName: string;
  fileType: string; // MIME type
  fileSize: number; // bytes
  fileUrl: string; // Storage URL

  attachmentType: AttachmentType;
  description?: string;

  uploadedBy: string;
  uploadedAt: Date;
}

export enum AttachmentType {
  LAB_REPORT = 'Lab Report',
  MEDICAL_REPORT = 'Medical Report',
  PRESCRIPTION = 'Prescription',
  RADIOLOGY = 'Radiology',
  INVOICE = 'Invoice',
  OTHER = 'Other'
}

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

export interface Announcement extends BaseEntity {
  title: string;
  description: string;
  content: string; // Full HTML content
  publishDate: Date;
  expiryDate?: Date;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  targetAudience: string[]; // Provider IDs or "ALL"
}

export enum AnnouncementPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum AnnouncementStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
  ARCHIVED = 'Archived'
}

// ============================================================================
// MEDICAL PROVIDER (Doctor/Clinic)
// ============================================================================

export interface MedicalProvider extends BaseEntity {
  providerNumber: string;
  providerType: ProviderType;

  // Organization (for clinics)
  organizationName?: string;

  // Individual (for doctors)
  firstName?: string;
  lastName?: string;
  title?: string; // Dr., Prof., etc.

  // Professional Information
  licenseNumber: string;
  specialty: string;
  subSpecialty?: string;
  qualifications: string[];

  // Contact
  phone: string;
  email: string;
  address: Address;

  // System
  isActive: boolean;
  contractStartDate: Date;
  contractEndDate?: Date;
}

export enum ProviderType {
  CLINIC = 'Clinic',
  HOSPITAL = 'Hospital',
  INDIVIDUAL_DOCTOR = 'Individual Doctor',
  LABORATORY = 'Laboratory',
  PHARMACY = 'Pharmacy'
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export interface TPADashboardStats {
  // Claim Statistics
  totalClaims: number;
  claimsToday: number;
  incompleteClaims: number;
  submittedClaims: number;
  approvedClaims: number;
  rejectedClaims: number;

  // Financial
  totalClaimedAmount: number;
  totalApprovedAmount: number;
  approvalRate: number; // Percentage
  averageClaimAmount: number;

  // Patients
  totalPatients: number;
  activePatients: number;
  newPatientsThisMonth: number;

  // Trends (compared to last period)
  claimsTrend: number; // +/-
  approvalRateTrend: number;
  amountTrend: number;

  // Recent Activity
  recentClaims: Claim[];
  pendingApprovals: number;
}