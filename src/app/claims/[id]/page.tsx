// src/app/claims/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    Save,
    Send,
    Plus,
    Trash2,
    Search,
    Upload,
    FileText,
    User,
    Calendar,
    DollarSign,
    Stethoscope,
    Paperclip,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

export default function ClaimEntryPage() {
    const [formData, setFormData] = useState({
        visitNumber: '',
        visitDate: '',
        patientNumber: '',
        claimType: 'Outpatient',
        providerId: '',
        doctorId: '',
        specialty: ''
    });

    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [diagnoses, setDiagnoses] = useState<any[]>([]);
    const [procedures, setProcedures] = useState<any[]>([{
        id: '1',
        code: '2964',
        description: 'Doctor Examination',
        doctor: 'Ameen Ibrahim Ahmad Abu Leel',
        specialty: 'General Practitioner',
        count: 1,
        price: 10.000,
        discount: 0,
        netAmount: 8.000,
        coInsurance: 0.000,
        rejected: 0.000,
        service: 1.000
    }]);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [showPatientSearch, setShowPatientSearch] = useState(false);
    const [showICDModal, setShowICDModal] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Claim Entry</h1>
                            <p className="text-sm text-slate-600 mt-1">Create or edit medical claim</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                Save Draft
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
                                <Send className="w-4 h-4" />
                                Submit Claim
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Patient Search & Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Patient Search */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Search className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-semibold text-slate-900">Patient Search</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Patient Name
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search patient..."
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            onFocus={() => setShowPatientSearch(true)}
                                        />
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    </div>
                                </div>

                                {showPatientSearch && (
                                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        <div className="max-h-48 overflow-y-auto">
                                            <PatientSearchResult
                                                date="08/10/2025"
                                                provider="Ameen Ibrahim Ahmad..."
                                                name="Fawaz Maher Hamdan"
                                                onClick={() => {
                                                    setSelectedPatient({
                                                        name: 'Fawaz Maher Hamdan',
                                                        number: '145',
                                                        dob: '01/01/1970',
                                                        gender: 'Male',
                                                        maritalStatus: 'Married'
                                                    });
                                                    setShowPatientSearch(false);
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                        Find
                                    </button>
                                    <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Patient Details */}
                        {selectedPatient && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="w-5 h-5 text-indigo-600" />
                                    <h2 className="text-lg font-semibold text-slate-900">Patient Details</h2>
                                </div>

                                <div className="space-y-3">
                                    <InfoRow label="Patient Name" value={selectedPatient.name} />
                                    <InfoRow label="Patient Number" value={selectedPatient.number} />
                                    <InfoRow label="Birth Date" value={selectedPatient.dob} />
                                    <InfoRow label="Gender / Marital" value={`${selectedPatient.gender} / ${selectedPatient.maritalStatus}`} />
                                    <InfoRow label="Degree" value="First Degree" />
                                    <InfoRow label="Risk Carrier" value="Risk Carrier Testing" />
                                    <InfoRow label="Group" value="Group A" />
                                    <InfoRow label="Head of Family" value="Fawaz Maher Hamdan" />

                                    <button className="w-full mt-4 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium">
                                        Electronic Medical Record
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Claim Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Claim Information */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-semibold text-slate-900">Claim Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Visit Number" value="0001" readOnly />
                                <FormField label="Visit Date" type="date" value="08/10/2025" />
                                <FormField label="Patient Number" value="145" />
                                <FormField label="Claim Type" type="select" options={['Outpatient', 'Inpatient', 'Emergency', 'Dental']} />
                                <FormField label="Medical Provider" value="Ameen Ibrahim Ahmad Abu Leel" />
                                <FormField label="Doctor" value="11 - Ameen Ibrahim Ahmad Abu Leel" />
                                <FormField label="Specialty" value="2 - General Practitioner" />
                            </div>
                        </div>

                        {/* Diagnosis (ICD-10) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Stethoscope className="w-5 h-5 text-emerald-600" />
                                    <h2 className="text-lg font-semibold text-slate-900">Diagnosis (ICD-10)</h2>
                                </div>
                                <button
                                    onClick={() => setShowICDModal(true)}
                                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Diagnosis
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-20">Action</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr className="border-b border-slate-100">
                                        <td className="px-4 py-3 text-sm font-medium text-blue-600">R10.83</td>
                                        <td className="px-4 py-3 text-sm text-slate-900">Colic</td>
                                        <td className="px-4 py-3 text-center">
                                            <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Claim Details (Procedures) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-purple-600" />
                                    <h2 className="text-lg font-semibold text-slate-900">Procedures & Services</h2>
                                </div>
                                <button className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Add Procedure
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Doctor</th>
                                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Count</th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Price</th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Claimed</th>
                                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase w-20">Action</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                    {procedures.map((proc) => (
                                        <tr key={proc.id} className="hover:bg-slate-50">
                                            <td className="px-3 py-3 font-medium text-blue-600">{proc.code}</td>
                                            <td className="px-3 py-3 text-slate-900">{proc.description}</td>
                                            <td className="px-3 py-3 text-slate-600 text-xs">{proc.doctor}</td>
                                            <td className="px-3 py-3 text-center">
                                                <input
                                                    type="number"
                                                    value={proc.count}
                                                    className="w-16 px-2 py-1 border border-slate-300 rounded text-center"
                                                />
                                            </td>
                                            <td className="px-3 py-3 text-right font-medium">${proc.price.toFixed(3)}</td>
                                            <td className="px-3 py-3 text-right font-semibold text-emerald-600">${proc.netAmount.toFixed(3)}</td>
                                            <td className="px-3 py-3 text-center">
                                                <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                                    <tr>
                                        <td colSpan={5} className="px-3 py-3 text-right font-semibold text-slate-900">
                                            Total Claimed Amount:
                                        </td>
                                        <td className="px-3 py-3 text-right font-bold text-lg text-blue-600">
                                            $10.000
                                        </td>
                                        <td></td>
                                    </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Financial Summary */}
                            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                                <div>
                                    <div className="text-xs text-slate-600 mb-1">Net Amount</div>
                                    <div className="text-lg font-semibold text-slate-900">$8.000</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-600 mb-1">Co-Insurance</div>
                                    <div className="text-lg font-semibold text-slate-900">$0.000</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-600 mb-1">Service</div>
                                    <div className="text-lg font-semibold text-slate-900">$1.000</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-600 mb-1">Discount</div>
                                    <div className="text-lg font-semibold text-emerald-600">$0.000</div>
                                </div>
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Paperclip className="w-5 h-5 text-amber-600" />
                                    <h2 className="text-lg font-semibold text-slate-900">Attachments</h2>
                                </div>
                                <label className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer">
                                    <Upload className="w-4 h-4" />
                                    Upload File
                                    <input type="file" className="hidden" multiple />
                                </label>
                            </div>

                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                                <Upload className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                                <p className="text-sm font-medium text-slate-600 mb-1">
                                    Drag and drop files here
                                </p>
                                <p className="text-xs text-slate-500">
                                    or click to browse (PDF, JPG, PNG - Max 10MB)
                                </p>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="w-5 h-5 text-slate-600" />
                                <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
                            </div>
                            <textarea
                                rows={4}
                                placeholder="Add any additional notes or remarks..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ICD-10 Modal */}
            {showICDModal && (
                <ICDModal onClose={() => setShowICDModal(false)} />
            )}
        </div>
    );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function PatientSearchResult({ date, provider, name, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
        >
            <div className="text-xs text-slate-500 mb-1">{date} - {provider}</div>
            <div className="text-sm font-medium text-slate-900">{name}</div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-600">{label}</span>
            <span className="text-sm font-medium text-slate-900">{value}</span>
        </div>
    );
}

function FormField({ label, value, type = 'text', options = [], readOnly = false }: any) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                {label}
            </label>
            {type === 'select' ? (
                <select className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {options.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    value={value}
                    readOnly={readOnly}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50"
                />
            )}
        </div>
    );
}

function ICDModal({ onClose }: { onClose: () => void }) {
    const [searchQuery, setSearchQuery] = useState('');
    const icdCodes = [
        { code: 'R10.83', description: 'Colic', category: 'Digestive' },
        { code: 'J00', description: 'Acute nasopharyngitis (common cold)', category: 'Respiratory' },
        { code: 'M54.5', description: 'Low back pain', category: 'Musculoskeletal' },
        { code: 'K21.9', description: 'Gastro-esophageal reflux disease', category: 'Digestive' }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-900">Select ICD-10 Diagnosis</h3>
                </div>

                <div className="p-6">
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="Search by code or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 pl-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {icdCodes.map((icd) => (
                            <div
                                key={icd.code}
                                className="p-4 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-semibold text-blue-600 mb-1">{icd.code}</div>
                                        <div className="text-sm text-slate-900">{icd.description}</div>
                                        <div className="text-xs text-slate-500 mt-1">{icd.category}</div>
                                    </div>
                                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                                        Select
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}