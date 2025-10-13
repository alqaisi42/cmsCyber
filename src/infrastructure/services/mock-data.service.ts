// src/infrastructure/services/mock-data.service.ts
// Generate realistic mock data for TPA system development

import {
    Patient,
    Claim,
    Diagnosis,
    Procedure,
    Announcement,
    MedicalProvider,
    ClaimStatus,
    ClaimType,
    Gender,
    MaritalStatus,
    PatientStatus,
    ProviderType,
    AnnouncementStatus,
    ProcedureApprovalStatus
} from "../../core/entities/healthcare" ;

export class MockDataService {
    // ============================================================================
    // PATIENT DATA
    // ============================================================================

    static generatePatients(count: number = 50): Patient[] {
        const patients: Patient[] = [];

        const firstNames = ['Fawaz', 'Ahmad', 'Mohammed', 'Ali', 'Hassan', 'Sara', 'Layla', 'Fatima', 'Nour', 'Reem'];
        const middleNames = ['Maher', 'Ibrahim', 'Qalsi', 'Abdullah', 'Khalid', 'Salem', 'Omar'];
        const lastNames = ['Hamdan', 'Ahmad', 'Al-Sayed', 'Abdullah', 'Khalil', 'Mansour', 'Rashid'];
        const cities = ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba', 'Salt', 'Karak'];

        for (let i = 1; i <= count; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;

            patients.push({
                id: `patient-${i}`,
                patientNumber: `145*${String(i).padStart(5, '0')}*0`,
                employeeNumber: Math.random() > 0.3 ? String(1000 + i) : undefined,
                nationalId: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,

                firstName,
                middleName,
                lastName,
                fullName: `${firstName} ${middleName} ${lastName}`,
                dateOfBirth: new Date(1950 + Math.floor(Math.random() * 50), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                gender,
                maritalStatus: Math.random() > 0.5 ? MaritalStatus.MARRIED : MaritalStatus.SINGLE,

                phone: `+962-79-${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
                email: `${firstName.toLowerCase()}${i}@email.com`,
                address: {
                    street: `${i} Main Street`,
                    city: cities[Math.floor(Math.random() * cities.length)],
                    country: 'Jordan'
                },

                insuranceGroup: ['Group A', 'Group B', 'Group C'][Math.floor(Math.random() * 3)],
                insurancePlan: 'Standard Health Plan',
                riskCarrier: 'Risk Carrier Testing' as any,
                degree: ['First Degree', 'Second Degree', 'Third Degree'][Math.floor(Math.random() * 3)],
                headOfFamily: Math.random() > 0.7 ? `${firstName} ${lastName}` : undefined,

                status: PatientStatus.ACTIVE,
                providerId: `provider-${Math.floor(Math.random() * 10) + 1}`,

                createdAt: new Date(2020, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                updatedAt: new Date()
            });
        }

        return patients;
    }

    // ============================================================================
    // CLAIM DATA
    // ============================================================================

    static generateClaims(count: number = 100): Claim[] {
        const claims: Claim[] = [];
        const patients = this.generatePatients(50);
        const statuses = Object.values(ClaimStatus);
        const claimTypes = Object.values(ClaimType);

        for (let i = 1; i <= count; i++) {
            const patient = patients[Math.floor(Math.random() * patients.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
            const visitDate = new Date(2025, Math.floor(Math.random() * 10), Math.floor(Math.random() * 28) + 1);

            // Generate procedures for this claim
            const procedureCount = Math.floor(Math.random() * 3) + 1;
            const procedures = this.generateProcedures(procedureCount, `claim-${i}`);

            // Calculate totals
            const totalClaimedAmount = procedures.reduce((sum, p) => sum + p.claimedAmount, 0);
            const totalApprovedAmount = procedures.reduce((sum, p) => sum + p.approvedAmount, 0);
            const totalRejectedAmount = procedures.reduce((sum, p) => sum + p.rejectedAmount, 0);
            const coInsurance = procedures.reduce((sum, p) => sum + p.coInsurance, 0);

            claims.push({
                id: `claim-${i}`,
                claimNumber: i % 5 === 0 ? `H001-${117000 + i}` : `0001-${i}`,
                visitNumber: `V${String(i).padStart(4, '0')}`,

                patientId: patient.id,
                patient,

                providerId: patient.providerId,
                providerName: 'Ameen Ibrahim Ahmad Abu Leel',
                doctorId: 'doctor-11',
                doctorName: 'Dr. Ameen Ibrahim Ahmad Abu Leel',
                specialty: 'General Practitioner',

                claimType,
                claimDate: new Date(visitDate.getTime() + 86400000), // Next day
                visitDate,

                diagnoses: this.generateDiagnoses(Math.floor(Math.random() * 2) + 1, `claim-${i}`),
                procedures,
                attachments: [],
                notes: Math.random() > 0.7 ? 'Patient reported symptoms for 3 days. Follow-up recommended.' : undefined,

                totalClaimedAmount,
                totalApprovedAmount,
                totalRejectedAmount,
                coInsurance,
                patientResponsibility: coInsurance + totalRejectedAmount,

                status,
                completionPercentage: status === ClaimStatus.INCOMPLETE ? Math.floor(Math.random() * 40) + 40 : 100,
                submittedAt: [ClaimStatus.SUBMITTED, ClaimStatus.APPROVED, ClaimStatus.REJECTED].includes(status)
                    ? new Date(visitDate.getTime() + 172800000)
                    : undefined,
                approvedAt: status === ClaimStatus.APPROVED ? new Date(visitDate.getTime() + 259200000) : undefined,
                rejectedAt: status === ClaimStatus.REJECTED ? new Date(visitDate.getTime() + 259200000) : undefined,
                rejectionReason: status === ClaimStatus.REJECTED ? 'Missing required documentation' : undefined,

                createdAt: visitDate,
                updatedAt: new Date()
            });
        }

        return claims;
    }

    // ============================================================================
    // DIAGNOSIS DATA
    // ============================================================================

    static generateDiagnoses(count: number, claimId: string): Diagnosis[] {
        const icdCodes = [
            { code: 'R10.83', description: 'Colic' },
            { code: 'J00', description: 'Acute nasopharyngitis (common cold)' },
            { code: 'M54.5', description: 'Low back pain' },
            { code: 'K21.9', description: 'Gastro-esophageal reflux disease' },
            { code: 'I10', description: 'Essential (primary) hypertension' },
            { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
            { code: 'J06.9', description: 'Acute upper respiratory infection' },
            { code: 'K29.0', description: 'Acute gastritis' },
            { code: 'M25.5', description: 'Pain in joint' },
            { code: 'R51', description: 'Headache' }
        ];

        const diagnoses: Diagnosis[] = [];

        for (let i = 0; i < count; i++) {
            const icd = icdCodes[Math.floor(Math.random() * icdCodes.length)];

            diagnoses.push({
                id: `diagnosis-${claimId}-${i}`,
                claimId,
                icdCode: icd.code,
                icdDescription: icd.description,
                icdVersion: 'ICD-10',
                isPrimary: i === 0,
                diagnosisOrder: i + 1,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        return diagnoses;
    }

    // ============================================================================
    // PROCEDURE DATA
    // ============================================================================

    static generateProcedures(count: number, claimId: string): Procedure[] {
        const procedureCodes = [
            { code: '2964', name: 'Doctor Examination', price: 10.000 },
            { code: '1001', name: 'Complete Blood Count (CBC)', price: 15.000 },
            { code: '1002', name: 'Urinalysis', price: 8.000 },
            { code: '2001', name: 'X-Ray - Chest', price: 25.000 },
            { code: '2002', name: 'Ultrasound - Abdominal', price: 40.000 },
            { code: '3001', name: 'ECG', price: 20.000 },
            { code: '4001', name: 'Physical Therapy Session', price: 18.000 },
            { code: '5001', name: 'Injection - Intramuscular', price: 5.000 }
        ];

        const procedures: Procedure[] = [];

        for (let i = 0; i < count; i++) {
            const procedure = procedureCodes[Math.floor(Math.random() * procedureCodes.length)];
            const quantity = Math.floor(Math.random() * 2) + 1;
            const claimedAmount = procedure.price * quantity;
            const discount = Math.random() > 0.8 ? Math.floor(Math.random() * 2) : 0;
            const netAmount = claimedAmount - discount;
            const coInsurance = Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0;
            const approvalStatus = Math.random() > 0.8
                ? ProcedureApprovalStatus.REJECTED
                : ProcedureApprovalStatus.APPROVED;
            const rejectedAmount = approvalStatus === ProcedureApprovalStatus.REJECTED ? netAmount : 0;
            const approvedAmount = approvalStatus === ProcedureApprovalStatus.APPROVED ? netAmount - coInsurance : 0;

            procedures.push({
                id: `procedure-${claimId}-${i}`,
                claimId,
                procedureCode: procedure.code,
                procedureName: procedure.name,
                category: 'Medical Service',
                performedBy: 'doctor-11',
                performedByName: 'Dr. Ameen Ibrahim Ahmad Abu Leel',
                specialty: 'General Practitioner',
                serviceDate: new Date(),
                quantity,
                unitPrice: procedure.price,
                claimedAmount,
                discount,
                netAmount,
                coInsurance,
                rejectedAmount,
                approvedAmount,
                service: 1.000,
                approvalStatus,
                rejectionReason: approvalStatus === ProcedureApprovalStatus.REJECTED ? 'Not covered by insurance plan' : undefined,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        return procedures;
    }

    // ============================================================================
    // ANNOUNCEMENT DATA
    // ============================================================================

    static generateAnnouncements(count: number = 10): Announcement[] {
        const announcements: Announcement[] = [];

        const titles = [
            'Comprehensive health Insurance - Dead Sea',
            'New Insurance Network Partners',
            'System Maintenance Schedule',
            'Updated Claim Submission Guidelines',
            'New ICD-10 Codes Available',
            'Holiday Schedule',
            'Training Workshop: Claims Management',
            'Important: Password Policy Update'
        ];

        const descriptions = [
            'Medexa is participating in the Comprehensive health Insurance - Dead Sea program',
            'We\'re excited to announce partnerships with 5 new healthcare providers',
            'Planned maintenance on April 25th from 2:00 AM to 4:00 AM',
            'Please review the updated guidelines for claim submissions',
            'New ICD-10 codes have been added to the system',
            'Office will be closed for the upcoming holiday',
            'Join us for a comprehensive training on the new claims system',
            'Please update your password according to the new policy'
        ];

        for (let i = 1; i <= count; i++) {
            const publishDate = new Date(2025, Math.floor(Math.random() * 10), Math.floor(Math.random() * 28) + 1);

            announcements.push({
                id: `announcement-${i}`,
                title: titles[i % titles.length],
                description: descriptions[i % descriptions.length],
                content: `<p>${descriptions[i % descriptions.length]}</p><p>For more information, please contact the administration office.</p>`,
                publishDate,
                expiryDate: new Date(publishDate.getTime() + 30 * 86400000), // 30 days
                priority: ['Low', 'Medium', 'High', 'Urgent'][Math.floor(Math.random() * 4)] as any,
                status: AnnouncementStatus.PUBLISHED,
                targetAudience: ['ALL'],
                createdAt: publishDate,
                updatedAt: new Date()
            });
        }

        return announcements.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
    }

    // ============================================================================
    // MEDICAL PROVIDER DATA
    // ============================================================================

    static generateProviders(count: number = 20): MedicalProvider[] {
        const providers: MedicalProvider[] = [];

        const clinicNames = [
            'Ameen Ibrahim Medical Center',
            'Jordan Health Clinic',
            'Al-Salam Hospital',
            'Zarqa Medical Complex',
            'Royal Medical Services',
            'Modern Healthcare Center'
        ];

        const doctorNames = [
            { first: 'Ameen', last: 'Ibrahim Ahmad Abu Leel', title: 'Dr.' },
            { first: 'Mohammed', last: 'Al-Sayed', title: 'Dr.' },
            { first: 'Sara', last: 'Khalil', title: 'Dr.' },
            { first: 'Hassan', last: 'Mansour', title: 'Prof.' }
        ];

        const specialties = [
            'General Practitioner',
            'Cardiology',
            'Orthopedics',
            'Pediatrics',
            'Dermatology',
            'Internal Medicine'
        ];

        const cities = ['Amman', 'Zarqa', 'Irbid', 'Aqaba'];

        for (let i = 1; i <= count; i++) {
            const isClinic = Math.random() > 0.5;
            const doctor = doctorNames[Math.floor(Math.random() * doctorNames.length)];

            providers.push({
                id: `provider-${i}`,
                providerNumber: `P${String(i).padStart(4, '0')}`,
                providerType: isClinic ? ProviderType.CLINIC : ProviderType.INDIVIDUAL_DOCTOR,

                organizationName: isClinic ? clinicNames[Math.floor(Math.random() * clinicNames.length)] : undefined,

                firstName: !isClinic ? doctor.first : undefined,
                lastName: !isClinic ? doctor.last : undefined,
                title: !isClinic ? doctor.title : undefined,

                licenseNumber: `L${String(10000 + i)}`,
                specialty: specialties[Math.floor(Math.random() * specialties.length)],
                subSpecialty: Math.random() > 0.7 ? 'Advanced Diagnostics' : undefined,
                qualifications: ['MD', 'Board Certified'],

                phone: `+962-6-${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
                email: `provider${i}@healthcare.jo`,
                address: {
                    street: `${i} Medical Street`,
                    city: cities[Math.floor(Math.random() * cities.length)],
                    country: 'Jordan'
                },

                isActive: Math.random() > 0.1,
                contractStartDate: new Date(2020, Math.floor(Math.random() * 12), 1),
                contractEndDate: Math.random() > 0.8 ? new Date(2026, 11, 31) : undefined,

                createdAt: new Date(2020, Math.floor(Math.random() * 12), 1),
                updatedAt: new Date()
            });
        }

        return providers;
    }

    // ============================================================================
    // DASHBOARD STATS
    // ============================================================================

    static generateDashboardStats(claims: Claim[]): any {
        const totalClaims = claims.length;
        const claimsToday = claims.filter(c => {
            const today = new Date();
            const claimDate = new Date(c.createdAt);
            return claimDate.toDateString() === today.toDateString();
        }).length;

        const statusCounts = claims.reduce((acc, claim) => {
            acc[claim.status] = (acc[claim.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const totalClaimedAmount = claims.reduce((sum, c) => sum + c.totalClaimedAmount, 0);
        const totalApprovedAmount = claims.reduce((sum, c) => sum + c.totalApprovedAmount, 0);
        const approvalRate = totalClaims > 0
            ? (statusCounts[ClaimStatus.APPROVED] || 0) / totalClaims * 100
            : 0;

        return {
            totalClaims,
            claimsToday,
            incompleteClaims: statusCounts[ClaimStatus.INCOMPLETE] || 0,
            submittedClaims: statusCounts[ClaimStatus.SUBMITTED] || 0,
            approvedClaims: statusCounts[ClaimStatus.APPROVED] || 0,
            rejectedClaims: statusCounts[ClaimStatus.REJECTED] || 0,

            totalClaimedAmount,
            totalApprovedAmount,
            approvalRate,
            averageClaimAmount: totalClaims > 0 ? totalClaimedAmount / totalClaims : 0,

            totalPatients: 847,
            activePatients: 782,
            newPatientsThisMonth: 34,

            claimsTrend: 12.5,
            approvalRateTrend: 2.1,
            amountTrend: 18.7,

            recentClaims: claims.slice(0, 5),
            pendingApprovals: statusCounts[ClaimStatus.SUBMITTED] || 0
        };
    }
}