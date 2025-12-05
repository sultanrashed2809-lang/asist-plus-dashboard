
export type Status = 
  | 'Lead'
  | 'Proposal Sent'
  | 'Proposal Signed'
  | 'Under Review'
  | 'Under Process'
  | 'On Hold'
  | 'Review Completed'
  | 'Completed'
  | 'Cancelled'
  | 'Not Active'
  | 'End';

export type ServiceType = 
  | 'Audit'
  | 'Internal Audit'
  | 'Accounting'
  | 'Tax'
  | 'Consulting'
  | 'ICV Certification'
  | 'ISO Certification'
  | 'VAT Registration'
  | 'VAT Filing'
  | 'Corporate Tax Registration'
  | 'Corporate Tax Filing'
  | 'Liquidation'
  | 'ESR'
  | 'Feasibility Study'
  | 'Other';

export type PaymentStatus = 'Not Sent' | 'Pending' | 'Paid' | 'Partially Paid';

export type AssignmentMode = 'Manual' | 'Auto-Smart' | 'Round-Robin' | 'Specialist';

export type Role = 'Super Admin' | 'Admin' | 'Manager' | 'Auditor' | 'Viewer' | 'Sales';

export type ReasonCategory = 
  | 'CLIENT_DELAY_DOCUMENTS'
  | 'CLIENT_DELAY_PAYMENT'
  | 'CLIENT_UNRESPONSIVE'
  | 'INTERNAL_CAPACITY'
  | 'INTERNAL_MISCOMMUNICATION'
  | 'INTERNAL_TECHNICAL_ISSUE'
  | 'WAITING_FOR_AUDIT_RESULTS'
  | 'WAITING_FOR_COMPLIANCE_REVIEW'
  | 'SCOPE_CHANGE_REQUEST'
  | 'REGULATORY_DELAY'
  | 'NORMAL_PROGRESSION'
  | 'OTHER';

export type InternalOrExternal = 'Internal' | 'Client' | 'Third Party' | 'Mixed' | 'N/A';

// --- CALENDAR SYSTEM ---
export type EventType = 'Allocation' | 'Assigned' | 'Review' | 'Completion' | 'Expiry' | 'Reminder' | 'Meeting';

export interface CalendarEvent {
  id: string;
  date: string;
  type: EventType;
  projectId?: string;
  projectName: string;
  description: string;
  clientName?: string;
  mockTime?: string; 
  mockDuration?: number; 
}

// --- DYNAMIC FIELDS & TEMPLATES ---
export type FieldType = 'text' | 'textarea' | 'date' | 'select' | 'checkbox' | 'number';

export interface FieldDefinition {
  id: string;
  key: string; 
  label: string;
  type: FieldType;
  section: 'Client Info' | 'Project Details' | 'Consultant Info' | 'Financials' | 'Workflow';
  options?: string[]; 
  required?: boolean;
}

export interface DocTemplate {
  id: string;
  name: string;
  content: string; 
  category: 'Contract' | 'Form' | 'Report' | 'Other';
  updatedAt: string;
  isVisibleToEmployees?: boolean; // New field for access control
}

// --- PORTALS SYSTEM ---
export type PortalType = 'Government' | 'Client' | 'Internal';
export type PortalScope = 'Global' | 'Client-Specific' | 'Project-Specific';

export interface PortalDefinition {
  id: string;
  label: string;
  url: string;
  type: PortalType;
  scope: PortalScope;
  description?: string;
  icon?: string; 
}

export interface ProjectPortalLink {
  id: string;
  portalDefId?: string; 
  label: string;
  url: string;
  type: PortalType;
  isCustom: boolean;
}

// --- INTERCOM / INTAKE FORM ---
export interface IntercomData {
  refNo: string;
  date: string;
  
  // Client Info
  clientCompanyName: string;
  scopeOfWork: string;
  clientContactPerson: string;
  clientPhone: string;
  clientEmail: string;
  
  // Consultant Info
  contractDate: string;
  consultantAddress: string;
  consultantName: string;
  consultantPhone: string;
  consultantEmail: string;
  consultantType: 'Company' | 'Freelancer';

  // Services
  services: string[]; 

  // ISO Details
  isoStandards: string[];
  surveillance: '3 Years (NIL)' | 'Regular' | '';
  accreditation: 'ASCB' | 'EIAC' | 'EGAC' | '';
  numberOfBranches: string;
  visitLocation: string;

  // Booleans / Certs
  isRecertification: 'Yes' | 'No';
  hasTradeLicense: 'Yes' | 'No';
  vatCertificate: 'Yes' | 'No';
  hasProfile: 'Yes' | 'No';

  // Evaluation
  financialEvaluation: 'High' | 'Medium' | 'Low' | '';
  clientLevel: 'Competent' | 'Average' | 'Normal' | '';
  initialPayment: 'Collected' | 'Not Collected' | 'Under Collection' | '';

  // Workflow
  processingPriority: 'Normal' | 'Urgent';
  targetCompletionDate: string;
  remarks: string;

  // Signatures
  preparedBy: string;
  preparedDate: string;
  approvedBy: string;
  approvedDate: string;
  receivedBy: string;
  receivedDate: string;
  executedBy: string;
  executedDate: string;
}

// --- DOCUMENTS SYSTEM ---
export type DocumentType = 
  | 'Financial Statement' 
  | 'Trial Balance' 
  | 'Payroll Report' 
  | 'ICV Certificate' 
  | 'Supporting Document' 
  | 'Generated Form'
  | 'Other';

export type DocumentStatus = 'Pending Review' | 'Approved' | 'Rejected' | 'Parsed' | 'Missing';

export interface ProjectDocument {
  id: string;
  name: string;
  type: DocumentType;
  financialYear?: string;
  status: DocumentStatus;
  uploadedBy: string;
  uploadDate: string; 
  notes?: string;
  fileUrl?: string; 
  isGenerated?: boolean; 
}

export interface ICVCertificate {
  id: string;
  certificateNumber: string;
  score: number;
  issueDate: string;
  expiryDate: string;
  certifyingBody: string;
  fileId: string; 
}

export interface TransitionLog {
  id: string;
  projectId: string;
  previousStatus: Status;
  newStatus: Status;
  reasonCategory: ReasonCategory;
  reasonDetail?: string;
  internalOrExternal: InternalOrExternal;
  createdBy: string; 
  createdByName: string;
  createdAt: string; 
}

export interface Task {
  id: string;
  label: string;
  isCompleted: boolean;
}

export interface AssignmentConfig {
  mode: AssignmentMode;
  smartWeighting: 'Balanced' | 'Prioritize Speed' | 'Prioritize Load';
  roundRobinLogic?: 'Sequential' | 'Least Workload';
  specialties: ServiceType[];
  maxActiveLoad: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
  username: string;
  password?: string;
  email?: string;
  avatar: string;
  activeProjects: number;
  completedProjects: number;
  completionRate: number; 
  avgClosingTime: number; 
  rating: number; 
  workloadScore: number; 
  assignmentConfig: AssignmentConfig;
}

export interface Reminder {
  id: string;
  title: string;
  dueDate: string; 
  assigneeId?: string;
  isCompleted: boolean;
  type: 'Internal' | 'Client';
}

// --- NEW TYPES FOR UPGRADES ---

export interface Goal {
  id: string;
  title: string;
  type: 'Collection' | 'Completion' | 'Efficiency' | 'Risk';
  targetValue: number;
  currentValue: number;
  unit: 'AED' | 'Projects' | 'Days' | '%';
  deadline: string;
  assignedTo?: string; // Team ID or User ID
  status: 'On Track' | 'At Risk' | 'Off Track' | 'Achieved';
}

export interface Notification {
  id: string;
  type: 'High' | 'Banner';
  category: 'Risk' | 'Payment' | 'System' | 'Task' | 'Escalation';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface EscalationRequest {
  requestedBy: string; // Auditor ID
  reason: string;
  targetAuditor?: string; // Suggested replacement
  status: 'Pending Manager' | 'Pending Super Admin' | 'Approved' | 'Rejected';
  managerApproval?: boolean;
  timestamp: string;
}

export interface Project {
  id: string;
  clientName: string;
  clientType: 'Company' | 'Individual';
  licenseType?: 'Commercial' | 'Industrial' | 'Professional';
  contactPerson: string;
  email: string;
  phone: string;
  projectName: string;
  serviceType: ServiceType;
  elNumber?: string; 
  amount: number; 
  billingAdvance?: number; 
  billingBalance?: number; 
  
  status: Status;
  proposalSent: boolean;
  proposalSigned: boolean;
  paymentStatus: PaymentStatus;
  paymentProofReceived: boolean;
  contractSigned: boolean;
  icdReceived: boolean;
  
  startDate: string; 
  assignedDate?: string; 
  targetDeadline: string; 
  completionDate?: string; 
  expiryDate?: string; 
  
  promisedDays: string; 
  daysElapsed: number;
  timerStatus: 'On Track' | 'At Risk' | 'Late';
  
  delayReason?: 'Client Delay' | 'Internal Issue' | 'Missing Docs' | 'Price Dispute'; 
  remarks?: string;
  
  latestReason?: {
    category: ReasonCategory;
    detail: string;
    type: InternalOrExternal;
    date: string;
    user: string;
  };
  transitionLogs?: TransitionLog[];
  
  tasks?: Task[];
  documents?: ProjectDocument[]; 
  
  portals?: ProjectPortalLink[];
  icvCertificate?: ICVCertificate;
  icvStatus?: 'Not Required' | 'Pending' | 'Certified' | 'Expired';
  
  intercomData?: IntercomData; 

  coordinates?: {
    lat: number;
    lng: number;
    area: string;
  };

  customData?: Record<string, any>; 

  assignedTo: string; 
  assignmentMode: AssignmentMode;
  
  activityLog: { date: string; action: string; user: string }[];
  reminders?: Reminder[];

  // --- NEW FIELDS ---
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  
  revenue?: number; // Client Revenue
  referralPartner?: string;
  paymentTerms?: '50/50' | '100%' | '75/25' | 'Custom';
  
  reassignmentRequest?: EscalationRequest;
}

export interface DashboardMetrics {
  totalActive: number;
  slaBreach: number;
  waitingClient: number;
  waitingInternal: number;
  avgDuration: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: 'Login' | 'Logout' | 'Create' | 'Edit' | 'Delete' | 'View' | 'Follow-up' | 'Restore' | 'Purge' | 'Status Change' | 'Approval' | 'Rejection';
  target: string; 
  timestamp: string;
  details?: string;
  projectId?: string;
}

declare global {
  interface Window {
    XLSX: any;
    L: any; // Leaflet
  }
}
