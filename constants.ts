
import { Project, TeamMember, ActivityLog, ReasonCategory, PortalDefinition, FieldDefinition, DocTemplate } from './types';

export const REASON_CATEGORIES: { value: ReasonCategory; label: string; type: 'Internal' | 'Client' | 'Other' }[] = [
    { value: 'NORMAL_PROGRESSION', label: 'Normal Workflow Step', type: 'Other' },
    { value: 'CLIENT_DELAY_DOCUMENTS', label: 'Client: Missing Documents', type: 'Client' },
    { value: 'CLIENT_DELAY_PAYMENT', label: 'Client: Payment Pending', type: 'Client' },
    { value: 'CLIENT_UNRESPONSIVE', label: 'Client: Unresponsive', type: 'Client' },
    { value: 'INTERNAL_CAPACITY', label: 'Internal: Staff Unavailable', type: 'Internal' },
    { value: 'INTERNAL_MISCOMMUNICATION', label: 'Internal: Miscommunication', type: 'Internal' },
    { value: 'INTERNAL_TECHNICAL_ISSUE', label: 'Internal: System/Tech Issue', type: 'Internal' },
    { value: 'WAITING_FOR_AUDIT_RESULTS', label: 'Workflow: Waiting Audit', type: 'Internal' },
    { value: 'WAITING_FOR_COMPLIANCE_REVIEW', label: 'Workflow: Compliance Check', type: 'Internal' },
    { value: 'SCOPE_CHANGE_REQUEST', label: 'Scope Change Request', type: 'Client' },
    { value: 'REGULATORY_DELAY', label: 'Third Party: Gov/Regulatory', type: 'Other' },
    { value: 'OTHER', label: 'Other (Specify)', type: 'Other' },
];

export const INTERCOM_SERVICES = [
    'ICV', 'ISO', 'ACCOUNTING', 'VAT', 'CT', 'AUDIT', 'VALUATION', 'TRAINING', 'ADNOC', 'LEGAL CONSULTANCY', 'ADOSH'
];

export const ISO_STANDARDS = [
    'ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018', 'ISO 22000:2005', 'ISO 22301'
];

// --- DYNAMIC FIELDS DEFAULTS ---
export const DEFAULT_FIELDS: FieldDefinition[] = [
    { id: 'f1', key: 'scope_of_work', label: 'Scope of Work', type: 'textarea', section: 'Client Info' },
    { id: 'f2', key: 'consultant_name', label: 'Consultant Name', type: 'text', section: 'Consultant Info' },
    { id: 'f3', key: 'consultant_mobile', label: 'Consultant Mobile', type: 'text', section: 'Consultant Info' },
    { id: 'f4', key: 'consultant_type', label: 'Consultant Type', type: 'select', options: ['Company', 'Freelancer'], section: 'Consultant Info' },
    { id: 'f5', key: 'iso_standards', label: 'ISO Standards', type: 'select', options: ISO_STANDARDS, section: 'Project Details' },
    { id: 'f6', key: 'surveillance_type', label: 'Surveillance', type: 'select', options: ['3 Years (NIL)', 'Regular'], section: 'Project Details' },
    { id: 'f7', key: 'accreditation_body', label: 'Accreditation', type: 'select', options: ['ASCB', 'EIAC', 'EGAC'], section: 'Project Details' },
    { id: 'f8', key: 'has_trade_license', label: 'Trade License?', type: 'select', options: ['Yes', 'No'], section: 'Project Details' },
    { id: 'f9', key: 'has_vat_cert', label: 'VAT Certificate?', type: 'select', options: ['Yes', 'No'], section: 'Project Details' },
    { id: 'f10', key: 'financial_evaluation', label: 'Financial Evaluation', type: 'select', options: ['High', 'Medium', 'Low'], section: 'Financials' },
    { id: 'f11', key: 'initial_payment_status', label: 'Initial Payment', type: 'select', options: ['Collected', 'Not Collected', 'Under Collection'], section: 'Financials' },
];

// --- 1. SIMPLE STANDARD TEMPLATE ---
const SIMPLE_TEMPLATE_BLOCKS = [
    { id: 'b1', type: 'header' },
    { id: 'b2', type: 'section_title', title: 'PROJECT SUMMARY' },
    { id: 'b3', type: 'grid', columns: [{ label: 'CLIENT', variable: '{{clientName}}' }, { label: 'REF NO', variable: '{{elNumber}}' }] },
    { id: 'b4', type: 'text', content: 'Dear {{contactPerson}},\n\nThis document serves as a summary for the project {{serviceType}}.\n\nStart Date: {{startDate}}\nAmount: {{amount}}\n\nRemarks:\n{{remarks}}' },
    { id: 'b5', type: 'divider' },
    { id: 'b6', type: 'grid', columns: [{ label: 'Sign & Date', variable: '' }] }
];

const SIMPLE_TEMPLATE_HTML = `
<script id="builder-data" type="application/json">${JSON.stringify(SIMPLE_TEMPLATE_BLOCKS)}</script>
<div style="font-family: 'Inter', Arial, sans-serif; color: #000; line-height: 1.4; max-width: 210mm; margin: 0 auto; background: white;">
    <div style="display: flex; border-bottom: 2px solid #000; margin-bottom: 10px;">
        <div style="width: 35%; padding: 15px; border-right: 2px solid #000; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="font-size: 28px; font-weight: 800; color: #1e293b; line-height: 1;">AP<span style="color: #0d9488;">+</span></div>
            <div style="font-size: 10px; letter-spacing: 3px; font-weight: bold; margin-top: 4px; color: #334155;">ASSIST PLUS</div>
        </div>
        <div style="flex: 1; padding: 15px; text-align: center; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: #0f172a;">
            Assist Plus Accounting &<br/>Auditing Services
        </div>
    </div>
    <div style="background-color: #f1f5f9; color: #0f172a; font-weight: 800; font-size: 11px; padding: 6px; text-align: center; border: 1px solid #000; border-bottom: none; text-transform: uppercase; letter-spacing: 0.5px;">PROJECT SUMMARY</div>
    <div style="display: flex; border: 1px solid #000; border-bottom: none;">
        <div style="flex: 1; display: flex; border-right: 1px solid #000;">
            <div style="width: 110px; background-color: white; padding: 6px; font-size: 10px; font-weight: bold; border-right: 1px solid #000; display: flex; align-items: center; text-transform: uppercase;">CLIENT</div>
            <div style="flex: 1; padding: 6px; font-size: 11px; font-family: monospace; color: #475569;">{{clientName}}</div>
        </div>
        <div style="flex: 1; display: flex;">
            <div style="width: 110px; background-color: white; padding: 6px; font-size: 10px; font-weight: bold; border-right: 1px solid #000; display: flex; align-items: center; text-transform: uppercase;">REF NO</div>
            <div style="flex: 1; padding: 6px; font-size: 11px; font-family: monospace; color: #475569;">{{elNumber}}</div>
        </div>
    </div>
    <div style="border: 1px solid #000; border-bottom: none; padding: 10px; min-height: 60px; font-size: 12px; white-space: pre-wrap;">Dear {{contactPerson}},\n\nThis document serves as a summary for the project {{serviceType}}.\n\nStart Date: {{startDate}}\nAmount: {{amount}}\n\nRemarks:\n{{remarks}}</div>
    <div style="padding: 10px 0; border-left: 1px solid #000; border-right: 1px solid #000;"><hr style="border: 0; border-top: 2px solid #000;" /></div>
    <div style="display: flex; border: 1px solid #000; border-bottom: none;">
        <div style="flex: 1; display: flex; border-right: 1px solid #000;">
            <div style="width: 110px; background-color: white; padding: 6px; font-size: 10px; font-weight: bold; border-right: 1px solid #000; display: flex; align-items: center; text-transform: uppercase;">Sign & Date</div>
            <div style="flex: 1; padding: 6px; font-size: 11px; font-family: monospace; color: #475569;"></div>
        </div>
    </div>
    <div style="border-top: 1px solid #000;"></div>
</div>
`;

// --- 2. MASTER INTERCOM TEMPLATE ---
const MASTER_INTERCOM_HTML = `
<div style="width: 210mm; font-family: Arial, sans-serif; font-size: 10px; color: black; background: white; border: 2px solid black; margin: 0 auto; box-sizing: border-box;">
  <!-- Header -->
  <div style="display: flex; border-bottom: 2px solid black;">
    <div style="width: 30%; border-right: 1px solid black; padding: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
       <h1 style="font-size: 24px; font-weight: 900; margin: 0; color: #1e293b; line-height: 1;">AP<span style="color: #0d9488;">+</span></h1>
       <div style="font-size: 8px; letter-spacing: 3px; font-weight: bold; margin-top: 4px;">ASSIST PLUS</div>
    </div>
    <div style="width: 40%; border-right: 1px solid black; padding: 5px; display: flex; align-items: center; justify-content: center; text-align: center; font-weight: bold; font-size: 14px;">
       Assist Plus Accounting &<br>Auditing Services
    </div>
    <div style="width: 30%;">
       <div style="display: flex; border-bottom: 1px solid black; height: 50%;">
          <div style="width: 40%; background: #f3f4f6; font-weight: bold; display: flex; align-items: center; justify-content: center; border-right: 1px solid black;">REF NO:</div>
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: monospace;">{{elNumber}}</div>
       </div>
       <div style="display: flex; height: 50%;">
          <div style="width: 40%; background: #f3f4f6; font-weight: bold; display: flex; align-items: center; justify-content: center; border-right: 1px solid black;">DATE:</div>
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; font-family: monospace;">{{startDate}}</div>
       </div>
    </div>
  </div>

  <!-- Title -->
  <div style="background: #f3f4f6; padding: 5px; text-align: center; font-weight: bold; border-bottom: 2px solid black; font-size: 11px;">
     APAA ( TEAM AUH ) - INTERCOM
  </div>

  <!-- Info Fields -->
  <div style="display: flex; border-bottom: 2px solid black;">
     <!-- Left Column -->
     <div style="width: 50%; border-right: 1px solid black; padding: 5px;">
        <div style="display: flex; margin-bottom: 5px; align-items: center;">
           <div style="width: 100px; font-weight: bold; font-size: 9px;">COMPANY NAME</div>
           <div style="flex: 1; border-bottom: 1px dashed #999; padding-left: 5px; height: 14px; overflow: hidden; white-space: nowrap;">{{clientName}}</div>
        </div>
        <div style="display: flex; margin-bottom: 5px; align-items: center;">
           <div style="width: 100px; font-weight: bold; font-size: 9px;">SCOPE OF WORK</div>
           <div style="flex: 1; border-bottom: 1px dashed #999; padding-left: 5px; height: 14px; overflow: hidden; white-space: nowrap;">{{scope_of_work}}</div>
        </div>
        <div style="display: flex; margin-bottom: 5px; align-items: center;">
           <div style="width: 100px; font-weight: bold; font-size: 9px;">CONTACT PERSON</div>
           <div style="flex: 1; border-bottom: 1px dashed #999; padding-left: 5px; height: 14px;">{{contactPerson}}</div>
        </div>
        <div style="display: flex; margin-bottom: 5px; align-items: center;">
           <div style="width: 100px; font-weight: bold; font-size: 9px;">PHONE / MOBILE</div>
           <div style="flex: 1; border-bottom: 1px dashed #999; padding-left: 5px; height: 14px;">{{phone}}</div>
        </div>
        <div style="display: flex; align-items: center;">
           <div style="width: 100px; font-weight: bold; font-size: 9px;">EMAIL ID</div>
           <div style="flex: 1; border-bottom: 1px dashed #999; padding-left: 5px; height: 14px;">{{email}}</div>
        </div>
     </div>
     <!-- Right Column -->
     <div style="width: 50%; padding: 5px;">
        <div style="display: flex; margin-bottom: 5px; align-items: center;">
           <div style="width: 100px; font-weight: bold; font-size: 9px;">CONTRACT DATE</div>
           <div style="flex: 1; border-bottom: 1px dashed #999; padding-left: 5px; height: 14px;">{{startDate}}</div>
        </div>
        <div style="display: flex; margin-bottom: 5px; align-items: center;">
           <div style="width: 100px; font-weight: bold; font-size: 9px;">ADDRESS</div>
           <div style="flex: 1; border-bottom: 1px dashed #999; padding-left: 5px; height: 14px;"></div>
        </div>
        <div style="display: flex; margin-bottom: 5px; align-items: center;">
           <div style="width: 100px; font-weight: bold; font-size: 9px;">CONSULTANT</div>
           <div style="flex: 1; border-bottom: 1px dashed #999; padding-left: 5px; height: 14px;">{{consultant_name}}</div>
        </div>
        <div style="display: flex; margin-bottom: 5px; align-items: center;">
           <div style="width: 100px; font-weight: bold; font-size: 9px;">PHONE / MOBILE</div>
           <div style="flex: 1; border-bottom: 1px dashed #999; padding-left: 5px; height: 14px;">{{consultant_mobile}}</div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 15px; margin-top: 10px;">
           <div style="display: flex; align-items: center; gap: 5px;">
              <div style="width: 10px; height: 10px; background: black; border: 1px solid black;"></div> <span style="font-weight: bold; font-size: 9px;">COMPANY</span>
           </div>
           <div style="display: flex; align-items: center; gap: 5px;">
              <div style="width: 10px; height: 10px; border: 1px solid black;"></div> <span style="font-weight: bold; font-size: 9px;">FREELANCER</span>
           </div>
        </div>
     </div>
  </div>

  <!-- Services Table -->
  <div style="border-bottom: 2px solid black;">
     <!-- Row 1 -->
     <div style="display: flex; border-bottom: 1px solid black;">
        <div style="width: 80px; background: #f3f4f6; font-weight: bold; border-right: 1px solid black; display: flex; align-items: center; justify-content: center; padding: 4px; font-size: 9px;">SERVICE</div>
        <div style="flex: 1; display: flex;">
           ${['ICV','ISO','ACCOUNTING','VAT','CT','AUDIT','VALUATION','TRAINING','ADNOC','LEGAL','ADOSH'].map(s => `
             <div style="flex: 1; text-align: center; border-right: 1px solid black; padding: 4px; font-size: 8px; font-weight: bold; display: flex; align-items: center; justify-content: center; word-break: break-word;">${s === 'LEGAL' ? 'LEGAL<br>CONSULTANCY' : s}</div>
           `).join('')}
        </div>
     </div>
     <!-- Row 2 -->
     <div style="display: flex; border-bottom: 1px solid black;">
        <div style="width: 80px; background: #f3f4f6; font-weight: bold; border-right: 1px solid black; display: flex; align-items: center; justify-content: center; padding: 4px; font-size: 9px;">STANDARD</div>
        <div style="flex: 1; display: flex;">
           <div style="flex: 1; text-align: center; border-right: 1px solid black; padding: 4px; font-size: 8px; font-weight: bold;">ISO 9001:2015</div>
           <div style="flex: 1; text-align: center; border-right: 1px solid black; padding: 4px; font-size: 8px; font-weight: bold;">ISO 14001:2015</div>
           <div style="flex: 1; text-align: center; border-right: 1px solid black; padding: 4px; font-size: 8px; font-weight: bold;">ISO 45001:2018</div>
           <div style="flex: 1; text-align: center; border-right: 1px solid black; padding: 4px; font-size: 8px; font-weight: bold;">ISO 22000:2005</div>
           <div style="flex: 1; text-align: center; padding: 4px; font-size: 8px; font-weight: bold;">ISO 22301</div>
        </div>
     </div>
     <!-- Row 3 -->
     <div style="display: flex; border-bottom: 1px solid black;">
        <div style="width: 80px; background: #f3f4f6; font-weight: bold; border-right: 1px solid black; display: flex; align-items: center; justify-content: center; padding: 4px; font-size: 9px;">SURVEILLANCE</div>
        <div style="flex: 1; display: flex;">
           <div style="width: 25%; text-align: center; border-right: 1px solid black; padding: 4px; font-size: 9px;">3 YEARS (NIL)</div>
           <div style="width: 25%; text-align: center; border-right: 1px solid black; padding: 4px; font-size: 9px;">REGULAR</div>
           <div style="flex: 1; text-align: center; padding: 4px; font-size: 9px; font-style: italic; color: #555;">(2nd & 3rd year w/ charge)</div>
        </div>
     </div>
     <!-- Row 4 -->
     <div style="display: flex;">
        <div style="width: 80px; background: #f3f4f6; font-weight: bold; border-right: 1px solid black; display: flex; align-items: center; justify-content: center; padding: 4px; font-size: 9px;">ACCREDITATION</div>
        <div style="flex: 1; display: flex;">
           <div style="flex: 1; text-align: center; border-right: 1px solid black; padding: 4px; font-weight: bold; font-size: 9px;">ASCB</div>
           <div style="flex: 1; text-align: center; border-right: 1px solid black; padding: 4px; font-weight: bold; font-size: 9px;">EIAC</div>
           <div style="flex: 1; text-align: center; padding: 4px; font-weight: bold; font-size: 9px;">EGAC</div>
        </div>
     </div>
  </div>

  <!-- Checkboxes -->
  <div style="display: flex; border-bottom: 2px solid black; padding: 5px 0;">
     <div style="flex: 1; display: flex; justify-content: center; align-items: center; gap: 5px; border-right: 1px solid black; font-size: 9px;">
        <span style="font-weight: bold;">RECERTIFICATION</span>
        <div style="width: 10px; height: 10px; border: 1px solid black; border-radius: 50%;"></div> Yes
        <div style="width: 10px; height: 10px; border: 1px solid black; border-radius: 50%;"></div> No
     </div>
     <div style="flex: 1; display: flex; justify-content: center; align-items: center; gap: 5px; border-right: 1px solid black; font-size: 9px;">
        <span style="font-weight: bold;">TRADE LICENSE</span>
        <div style="width: 10px; height: 10px; border: 1px solid black; border-radius: 50%;"></div> Yes
        <div style="width: 10px; height: 10px; border: 1px solid black; border-radius: 50%;"></div> No
     </div>
     <div style="flex: 1; display: flex; justify-content: center; align-items: center; gap: 5px; border-right: 1px solid black; font-size: 9px;">
        <span style="font-weight: bold;">VAT CERTIFICATE</span>
        <div style="width: 10px; height: 10px; border: 1px solid black; border-radius: 50%;"></div> Yes
        <div style="width: 10px; height: 10px; border: 1px solid black; border-radius: 50%;"></div> No
     </div>
     <div style="flex: 1; display: flex; justify-content: center; align-items: center; gap: 5px; font-size: 9px;">
        <span style="font-weight: bold;">PROFILE</span>
        <div style="width: 10px; height: 10px; border: 1px solid black; border-radius: 50%;"></div> Yes
        <div style="width: 10px; height: 10px; border: 1px solid black; border-radius: 50%;"></div> No
     </div>
  </div>

  <!-- Financial Matrix -->
  <div style="border-bottom: 2px solid black;">
     <div style="display: flex; background: #f3f4f6; border-bottom: 1px solid black;">
        <div style="flex: 1; text-align: center; padding: 4px; font-weight: bold; border-right: 1px solid black; font-size: 9px;">FINANCIAL EVALUATION</div>
        <div style="flex: 1; text-align: center; padding: 4px; font-weight: bold; border-right: 1px solid black; font-size: 9px;">LEVEL OF CLIENT</div>
        <div style="flex: 1; text-align: center; padding: 4px; font-weight: bold; font-size: 9px;">INITIAL PAYMENT</div>
     </div>
     <div style="display: flex; border-bottom: 1px solid #ccc;">
        <div style="flex: 1; text-align: center; padding: 4px; border-right: 1px solid black; font-size: 10px;">High</div>
        <div style="flex: 1; text-align: center; padding: 4px; border-right: 1px solid black; font-size: 10px;">Competent</div>
        <div style="flex: 1; text-align: center; padding: 4px; font-size: 10px;">Collected</div>
     </div>
     <div style="display: flex; border-bottom: 1px solid #ccc;">
        <div style="flex: 1; text-align: center; padding: 4px; border-right: 1px solid black; font-size: 10px;">Medium</div>
        <div style="flex: 1; text-align: center; padding: 4px; border-right: 1px solid black; font-size: 10px;">Average</div>
        <div style="flex: 1; text-align: center; padding: 4px; font-size: 10px; background: #dcfce7; font-weight: bold; color: #166534;">Not Collected</div>
     </div>
     <div style="display: flex;">
        <div style="flex: 1; text-align: center; padding: 4px; border-right: 1px solid black; font-size: 10px;">Low</div>
        <div style="flex: 1; text-align: center; padding: 4px; border-right: 1px solid black; font-size: 10px;">Normal</div>
        <div style="flex: 1; text-align: center; padding: 4px; font-size: 10px;">Under Collection</div>
     </div>
  </div>

  <!-- Footer -->
  <div style="display: flex; border-bottom: 2px solid black;">
     <div style="width: 50%; display: flex; border-right: 1px solid black;">
        <div style="width: 80px; background: #f3f4f6; font-weight: bold; padding: 5px; display: flex; align-items: center; justify-content: center; font-size: 9px; border-right: 1px solid black;">PROCESSING</div>
        <div style="flex: 1; display: flex;">
           <div style="flex: 1; text-align: center; padding: 5px; background: #dcfce7; font-weight: bold; border-right: 1px solid black; color: #166534; font-size: 10px;">NORMAL</div>
           <div style="flex: 1; text-align: center; padding: 5px; font-size: 10px;">URGENT</div>
        </div>
     </div>
     <div style="width: 50%; display: flex;">
        <div style="width: 100px; background: #f3f4f6; font-weight: bold; padding: 5px; display: flex; align-items: center; justify-content: center; font-size: 9px; border-right: 1px solid black;">TARGET DATE</div>
        <div style="flex: 1; padding: 5px; text-align: center; font-size: 11px;">{{targetDate}}</div>
     </div>
  </div>

  <!-- Remarks -->
  <div style="border-bottom: 2px solid black; padding: 5px; min-height: 80px;">
     <div style="font-weight: bold; font-size: 9px; margin-bottom: 5px;">REMARKS</div>
     <div style="font-size: 11px; white-space: pre-wrap;">{{remarks}}</div>
  </div>

  <!-- Signatures -->
  <div style="display: flex; padding: 40px 10px 20px 10px; text-align: center;">
     <div style="flex: 1;">
        <div style="font-weight: bold; font-size: 9px; margin-bottom: 40px;">PREPARED BY</div>
        <div style="border-top: 1px solid black; width: 80%; margin: 0 auto; font-weight: bold; padding-top: 5px; font-size: 9px;">MARKETING EXECUTIVE</div>
     </div>
     <div style="flex: 1;">
        <div style="font-weight: bold; font-size: 9px; margin-bottom: 40px;">APPROVED BY</div>
        <div style="border-top: 1px solid black; width: 80%; margin: 0 auto; font-weight: bold; padding-top: 5px; font-size: 9px;">SALES MANAGER</div>
     </div>
     <div style="flex: 1;">
        <div style="font-weight: bold; font-size: 9px; margin-bottom: 40px;">RECEIVED BY</div>
        <div style="border-top: 1px solid black; width: 80%; margin: 0 auto; font-weight: bold; padding-top: 5px; font-size: 9px;">TECHNICAL MANAGER</div>
     </div>
     <div style="flex: 1;">
        <div style="font-weight: bold; font-size: 9px; margin-bottom: 40px;">EXECUTED BY</div>
        <div style="border-top: 1px solid black; width: 80%; margin: 0 auto; font-weight: bold; padding-top: 5px; font-size: 9px;">TECHNICAL EXECUTIVE</div>
     </div>
  </div>
</div>
`;

export const DEFAULT_TEMPLATES: DocTemplate[] = [
    {
        id: 't1',
        name: 'Standard Project Form',
        category: 'Form',
        updatedAt: '2025-11-20',
        content: SIMPLE_TEMPLATE_HTML,
        isVisibleToEmployees: true
    },
    {
        id: 't2',
        name: 'Master Intercom Sheet',
        category: 'Report',
        updatedAt: '2025-11-21',
        content: MASTER_INTERCOM_HTML,
        isVisibleToEmployees: true
    }
];

export const GLOBAL_PORTALS: PortalDefinition[] = [
    { id: 'gp-1', label: 'MoIAT ICV Portal', url: 'https://icv.moiat.gov.ae', type: 'Government', scope: 'Global', description: 'Official Ministry of Industry & Advanced Technology portal for ICV submissions.' },
    { id: 'gp-2', label: 'FTA eServices', url: 'https://eservices.tax.gov.ae', type: 'Government', scope: 'Global', description: 'Federal Tax Authority portal for VAT and Tax returns.' },
    { id: 'gp-3', label: 'Assist+ Drive', url: 'https://drive.google.com', type: 'Internal', scope: 'Global', description: 'Internal document repository.' },
];

export const TEAM_MEMBERS: TeamMember[] = [
  { 
    id: 't1', name: 'Alaes', role: 'Admin', username: 'alaes', email: 'alaes@assistplus.ae', password: 'password', avatar: 'https://picsum.photos/id/1005/50/50', 
    activeProjects: 8, completedProjects: 120, completionRate: 98, avgClosingTime: 6.2, rating: 4.9, workloadScore: 85,
    assignmentConfig: { mode: 'Auto-Smart', smartWeighting: 'Balanced', specialties: ['Audit', 'ICV Certification'], maxActiveLoad: 10, roundRobinLogic: 'Sequential' }
  },
  { 
    id: 't2', name: 'Ahmad', role: 'Auditor', username: 'ahmad', email: 'ahmad@assistplus.ae', password: 'password', avatar: 'https://picsum.photos/id/1012/50/50', 
    activeProjects: 14, completedProjects: 95, completionRate: 92, avgClosingTime: 5.5, rating: 4.7, workloadScore: 75,
    assignmentConfig: { mode: 'Round-Robin', smartWeighting: 'Prioritize Load', specialties: ['Accounting', 'Tax'], maxActiveLoad: 15, roundRobinLogic: 'Least Workload' }
  },
  { 
    id: 't3', name: 'Fatima', role: 'Manager', username: 'fatima', email: 'fatima@assistplus.ae', password: 'password', avatar: 'https://picsum.photos/id/1027/50/50', 
    activeProjects: 12, completedProjects: 200, completionRate: 88, avgClosingTime: 9.0, rating: 4.5, workloadScore: 95,
    assignmentConfig: { mode: 'Specialist', smartWeighting: 'Balanced', specialties: ['Consulting', 'Other'], maxActiveLoad: 15, roundRobinLogic: 'Sequential' }
  },
  { 
    id: 't4', name: 'Lakshmi', role: 'Auditor', username: 'lakshmi', email: 'lakshmi@assistplus.ae', password: 'password', avatar: 'https://picsum.photos/id/1011/50/50', 
    activeProjects: 6, completedProjects: 150, completionRate: 96, avgClosingTime: 4.8, rating: 4.8, workloadScore: 60,
    assignmentConfig: { mode: 'Auto-Smart', smartWeighting: 'Prioritize Speed', specialties: ['Other'], maxActiveLoad: 12, roundRobinLogic: 'Sequential' }
  },
  { 
    id: 't5', name: 'Sinan', role: 'Super Admin', username: 'admin', email: 'sinan@assistplus.ae', password: 'admin', avatar: 'https://picsum.photos/id/1009/50/50', 
    activeProjects: 3, completedProjects: 300, completionRate: 99, avgClosingTime: 7.0, rating: 5.0, workloadScore: 30,
    assignmentConfig: { mode: 'Manual', smartWeighting: 'Balanced', specialties: ['Audit'], maxActiveLoad: 5, roundRobinLogic: 'Sequential' }
  },
  { 
    id: 't6', name: 'Pooja', role: 'Auditor', username: 'pooja', email: 'pooja@assistplus.ae', password: 'password', avatar: 'https://picsum.photos/id/1025/50/50', 
    activeProjects: 7, completedProjects: 80, completionRate: 94, avgClosingTime: 6.5, rating: 4.6, workloadScore: 70,
    assignmentConfig: { mode: 'Auto-Smart', smartWeighting: 'Balanced', specialties: ['Audit', 'Tax'], maxActiveLoad: 10, roundRobinLogic: 'Sequential' }
  },
  { 
    id: 't7', name: 'Anas', role: 'Auditor', username: 'anas', email: 'anas@assistplus.ae', password: 'password', avatar: 'https://picsum.photos/id/1014/50/50', 
    activeProjects: 9, completedProjects: 60, completionRate: 91, avgClosingTime: 6.0, rating: 4.8, workloadScore: 65,
    assignmentConfig: { mode: 'Auto-Smart', smartWeighting: 'Balanced', specialties: ['Audit'], maxActiveLoad: 12, roundRobinLogic: 'Sequential' }
  },
  { 
    id: 't8', name: 'Sara', role: 'Auditor', username: 'sara', email: 'sara@assistplus.ae', password: 'password', avatar: 'https://picsum.photos/id/1023/50/50', 
    activeProjects: 4, completedProjects: 30, completionRate: 90, avgClosingTime: 7.5, rating: 4.5, workloadScore: 45,
    assignmentConfig: { mode: 'Round-Robin', smartWeighting: 'Balanced', specialties: ['Audit'], maxActiveLoad: 8, roundRobinLogic: 'Sequential' }
  },
  { 
    id: 't9', name: 'Wajd', role: 'Auditor', username: 'wajd', email: 'wajd@assistplus.ae', password: 'password', avatar: 'https://picsum.photos/id/1024/50/50', 
    activeProjects: 2, completedProjects: 40, completionRate: 93, avgClosingTime: 6.8, rating: 4.7, workloadScore: 35,
    assignmentConfig: { mode: 'Auto-Smart', smartWeighting: 'Balanced', specialties: ['Consulting'], maxActiveLoad: 8, roundRobinLogic: 'Sequential' }
  }
];

const DEFAULT_TASKS = [
    { id: 't-1', label: 'Send Proposal', isCompleted: true },
    { id: 't-2', label: 'Receive Signed Contract', isCompleted: true },
    { id: 't-3', label: 'Collect KYC Documents', isCompleted: false },
    { id: 't-4', label: 'Initial Audit Review', isCompleted: false },
    { id: 't-5', label: 'Final Management Approval', isCompleted: false },
];

// Enhanced Mock Documents
const DEFAULT_DOCS: any[] = [
    { id: 'd-1', name: 'Trade License.pdf', type: 'Supporting Document', status: 'Approved', uploadedBy: 'Admin', uploadDate: '2025-08-25' },
    { id: 'd-2', name: 'FY23 Financials.xlsx', type: 'Financial Statement', status: 'Pending Review', uploadedBy: 'Client', uploadDate: '2025-08-26', financialYear: '2023' },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p001',
    clientName: 'FASTTRACK FOR INTERIOR DESIGN LLC',
    clientType: 'Company',
    licenseType: 'Commercial',
    contactPerson: 'Ahmed Al Mansoori',
    email: 'info@fasttrack.ae',
    phone: '+971 50 123 4567',
    projectName: 'ICV Certification FY24',
    serviceType: 'ICV Certification',
    elNumber: 'EL-2024-001',
    amount: 2500,
    billingAdvance: 1250,
    billingBalance: 1250,
    status: 'Cancelled',
    proposalSent: true,
    proposalSigned: true,
    paymentStatus: 'Partially Paid',
    paymentProofReceived: true,
    contractSigned: true,
    icdReceived: false,
    startDate: '2025-08-26',
    targetDeadline: '2025-09-02',
    promisedDays: '5-8 days',
    daysElapsed: 0,
    timerStatus: 'On Track',
    assignedTo: 't2', 
    assignmentMode: 'Manual',
    coordinates: { lat: 25.1972, lng: 55.2744, area: 'Downtown Dubai' },
    activityLog: [],
    reminders: [
        { id: 'r1', title: 'Follow up on missing details', dueDate: '2025-09-01', assigneeId: 't2', isCompleted: false, type: 'Internal' }
    ],
    latestReason: {
      category: 'CLIENT_UNRESPONSIVE',
      detail: 'Client stopped responding after partial payment.',
      type: 'Client',
      date: '2025-09-10',
      user: 'Sinan'
    },
    transitionLogs: [
      { id: 'tl-1', projectId: 'p001', previousStatus: 'Under Process', newStatus: 'Cancelled', reasonCategory: 'CLIENT_UNRESPONSIVE', reasonDetail: 'Client stopped responding.', internalOrExternal: 'Client', createdBy: 't5', createdByName: 'Sinan', createdAt: '2025-09-10' }
    ],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS,
    portals: [
        { id: 'l1', label: 'Client OneDrive', url: 'https://onedrive.live.com', type: 'Client', isCustom: true }
    ],
    customData: {
        scope_of_work: 'Full ICV Certification for FY2023',
        consultant_name: 'Ahmad',
        financial_evaluation: 'Medium'
    }
  },
  {
    id: 'p002',
    clientName: 'MCX EVENTS EXHIBITIONS LLC-FZ',
    clientType: 'Company',
    licenseType: 'Commercial',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@mcxevents.ae',
    phone: '+971 55 987 6543',
    projectName: 'Annual Audit 2024',
    serviceType: 'Audit',
    elNumber: 'EL-2024-002',
    amount: 5000,
    billingAdvance: 5000,
    billingBalance: 0,
    status: 'Completed',
    proposalSent: true,
    proposalSigned: true,
    paymentStatus: 'Paid',
    paymentProofReceived: true,
    contractSigned: true,
    icdReceived: true,
    startDate: '2025-10-21',
    targetDeadline: '2025-10-28',
    promisedDays: '5-8 days',
    daysElapsed: 7,
    timerStatus: 'On Track',
    assignedTo: 't7', 
    assignmentMode: 'Manual',
    coordinates: { lat: 25.0805, lng: 55.1403, area: 'Dubai Marina' },
    activityLog: [],
    tasks: DEFAULT_TASKS.map(t => ({...t, isCompleted: true})),
    documents: DEFAULT_DOCS.map(d => ({...d, status: 'Approved'})),
    icvStatus: 'Certified',
    icvCertificate: {
        id: 'icv-1',
        certificateNumber: 'ICV-2025-9988',
        score: 85.5,
        issueDate: '2025-10-27',
        expiryDate: '2026-10-27',
        certifyingBody: 'Assist Plus',
        fileId: 'd-100'
    }
  },
  {
    id: 'p003',
    clientName: 'Wood Packers Pallets LLC',
    clientType: 'Company',
    licenseType: 'Industrial',
    contactPerson: 'Rahul Gupta',
    email: 'ops@woodpackers.ae',
    phone: '+971 52 333 4444',
    projectName: 'Tax Filing Q3',
    serviceType: 'Tax',
    amount: 3500,
    billingAdvance: 3500,
    billingBalance: 0,
    status: 'Completed',
    proposalSent: true,
    proposalSigned: true,
    paymentStatus: 'Paid',
    paymentProofReceived: true,
    contractSigned: true,
    icdReceived: true,
    startDate: '2025-09-10',
    targetDeadline: '2025-09-17',
    promisedDays: '5-8 days',
    daysElapsed: 6,
    timerStatus: 'On Track',
    assignedTo: 't7', 
    assignmentMode: 'Manual',
    coordinates: { lat: 24.9857, lng: 55.0805, area: 'Jebel Ali Industrial' },
    activityLog: [],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS
  },
  {
    id: 'p004',
    clientName: 'LIVAR PACKAGING MATERIALS LLC',
    clientType: 'Company',
    licenseType: 'Industrial',
    contactPerson: 'Mohammed Fayed',
    email: 'procurement@livar.ae',
    phone: '+971 50 555 1234',
    projectName: 'ICV Audit 2025',
    serviceType: 'ICV Certification',
    elNumber: 'EL-2025-045',
    amount: 4000,
    billingAdvance: 0,
    billingBalance: 4000,
    status: 'Review Completed',
    proposalSent: true,
    proposalSigned: true,
    paymentStatus: 'Pending',
    paymentProofReceived: false,
    contractSigned: true,
    icdReceived: true,
    startDate: '2025-11-10',
    targetDeadline: '2025-11-18',
    promisedDays: '5-8 days',
    daysElapsed: 10,
    timerStatus: 'At Risk',
    assignedTo: 't2', 
    assignmentMode: 'Manual',
    coordinates: { lat: 25.1354, lng: 55.2350, area: 'Al Quoz' },
    activityLog: [],
    reminders: [
        { id: 'r2', title: 'Submit Final Draft', dueDate: '2025-11-17', assigneeId: 't2', isCompleted: false, type: 'Internal' }
    ],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS
  },
  {
    id: 'p005',
    clientName: 'ARABILLA FOR MEDICAL TECHNOLOGY',
    clientType: 'Company',
    licenseType: 'Commercial',
    contactPerson: 'Dr. Emily Stone',
    email: 'info@arabilla.ae',
    phone: '+971 4 321 6789',
    projectName: 'Internal Systems Audit',
    serviceType: 'Internal Audit',
    elNumber: 'EL-2025-012',
    amount: 3000,
    billingAdvance: 0,
    billingBalance: 3000,
    status: 'Under Review',
    proposalSent: true,
    proposalSigned: true,
    paymentStatus: 'Pending',
    paymentProofReceived: false,
    contractSigned: true,
    icdReceived: true,
    startDate: '2025-11-05',
    targetDeadline: '2025-11-13',
    promisedDays: '5-8 days',
    daysElapsed: 20,
    timerStatus: 'Late',
    delayReason: 'Internal Issue',
    latestReason: { category: 'INTERNAL_CAPACITY', detail: 'Auditor overloaded, reassignment pending.', type: 'Internal', date: '2025-11-15', user: 'Fatima' },
    assignedTo: 't7', 
    assignmentMode: 'Manual',
    coordinates: { lat: 25.2207, lng: 55.2850, area: 'DIFC' },
    activityLog: [],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS
  },
  {
    id: 'p006',
    clientName: 'RISEUP GENERAL CONTRACTING',
    clientType: 'Company',
    licenseType: 'Commercial',
    contactPerson: 'Eng. Ali Hassan',
    email: 'projects@riseup.ae',
    phone: '+971 55 111 2222',
    projectName: 'Financial Audit 2024',
    serviceType: 'Audit',
    amount: 4000,
    billingAdvance: 0,
    billingBalance: 4000,
    status: 'On Hold',
    proposalSent: true,
    proposalSigned: true,
    paymentStatus: 'Pending',
    paymentProofReceived: false,
    contractSigned: true,
    icdReceived: false,
    startDate: '2025-09-16',
    targetDeadline: '2025-09-24',
    promisedDays: '5-8 days',
    daysElapsed: 45,
    timerStatus: 'Late',
    delayReason: 'Missing Docs',
    latestReason: { category: 'CLIENT_DELAY_DOCUMENTS', detail: 'Waiting for bank statements for 3 weeks.', type: 'Client', date: '2025-09-25', user: 'Fatima' },
    remarks: 'Waiting for bank statements.',
    assignedTo: 't3', 
    assignmentMode: 'Manual',
    coordinates: { lat: 25.2667, lng: 55.3167, area: 'Deira' },
    activityLog: [],
    transitionLogs: [
        { id: 'tl-2', projectId: 'p006', previousStatus: 'Under Process', newStatus: 'On Hold', reasonCategory: 'CLIENT_DELAY_DOCUMENTS', reasonDetail: 'Bank statements missing', internalOrExternal: 'Client', createdBy: 't3', createdByName: 'Fatima', createdAt: '2025-09-25' }
    ],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS
  },
  {
    id: 'p007',
    clientName: 'LAVA PRINTS DMCC',
    clientType: 'Company',
    licenseType: 'Commercial',
    contactPerson: 'Priya Singh',
    email: 'print@lava.ae',
    phone: '+971 52 888 9999',
    projectName: 'DMCC Audit Compliance',
    serviceType: 'Audit',
    amount: 3000,
    billingAdvance: 0,
    billingBalance: 3000,
    status: 'Under Process',
    proposalSent: true,
    proposalSigned: true,
    paymentStatus: 'Pending',
    paymentProofReceived: false,
    contractSigned: true,
    icdReceived: true,
    startDate: '2025-11-14',
    targetDeadline: '2025-11-21',
    promisedDays: '5-8 days',
    daysElapsed: 5,
    timerStatus: 'On Track',
    assignedTo: 't2', 
    assignmentMode: 'Manual',
    coordinates: { lat: 25.0657, lng: 55.1403, area: 'JLT' },
    activityLog: [],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS
  },
  {
    id: 'p008',
    clientName: 'Emirates Tech Solutions',
    clientType: 'Company',
    licenseType: 'Commercial',
    contactPerson: 'Omar Khalid',
    email: 'omar@emirates-tech.ae',
    phone: '+971 50 777 8888',
    projectName: 'VAT Registration',
    serviceType: 'VAT Registration',
    amount: 1500,
    billingAdvance: 0,
    billingBalance: 1500,
    status: 'Lead',
    proposalSent: true,
    proposalSigned: false,
    paymentStatus: 'Not Sent',
    paymentProofReceived: false,
    contractSigned: false,
    icdReceived: false,
    startDate: '2025-11-18',
    targetDeadline: '2025-11-25',
    promisedDays: '5-8 days',
    daysElapsed: 1,
    timerStatus: 'On Track',
    assignedTo: 't5', 
    assignmentMode: 'Manual',
    coordinates: { lat: 25.1124, lng: 55.3900, area: 'Dubai Silicon Oasis' },
    activityLog: [],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS
  },
  {
    id: 'p009',
    clientName: 'Dubai Healthcare City',
    clientType: 'Company',
    licenseType: 'Commercial',
    contactPerson: 'Dr. Fatima Al Raisi',
    email: 'admin@dhcc-clinic.ae',
    phone: '+971 4 111 2222',
    projectName: 'Operational Audit',
    serviceType: 'Audit',
    amount: 12000,
    billingAdvance: 0,
    billingBalance: 12000,
    status: 'Proposal Sent',
    proposalSent: true,
    proposalSigned: false,
    paymentStatus: 'Not Sent',
    paymentProofReceived: false,
    contractSigned: false,
    icdReceived: false,
    startDate: '2025-11-15',
    targetDeadline: '2025-11-22',
    promisedDays: '5-8 days',
    daysElapsed: 4,
    timerStatus: 'On Track',
    assignedTo: 't1', 
    assignmentMode: 'Manual',
    coordinates: { lat: 25.2300, lng: 55.3200, area: 'Dubai Healthcare City' },
    activityLog: [],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS
  },
  // --- ADDED MOCK PROJECTS FOR EXTENDED CLIENT DIRECTORY LIST ---
  {
    id: 'p010',
    clientName: 'Future Vision Media FZ',
    clientType: 'Company',
    licenseType: 'Commercial',
    contactPerson: 'Karim Ahmed',
    email: 'karim@futurevision.ae',
    phone: '+971 50 222 3333',
    projectName: 'Media Audit 2024',
    serviceType: 'Audit',
    amount: 3500,
    billingAdvance: 1000,
    billingBalance: 2500,
    status: 'Under Process',
    proposalSent: true,
    proposalSigned: true,
    paymentStatus: 'Partially Paid',
    paymentProofReceived: true,
    contractSigned: true,
    icdReceived: false,
    startDate: '2025-11-20',
    targetDeadline: '2025-11-27',
    promisedDays: '5-8 days',
    daysElapsed: 2,
    timerStatus: 'On Track',
    assignedTo: 't6', 
    assignmentMode: 'Manual',
    coordinates: { lat: 25.0936, lng: 55.1519, area: 'Dubai Media City' },
    activityLog: [],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS
  },
  {
    id: 'p011',
    clientName: 'Green Earth Landscapes',
    clientType: 'Company',
    licenseType: 'Commercial',
    contactPerson: 'Susan White',
    email: 'susan@greenearth.ae',
    phone: '+971 55 444 5555',
    projectName: 'Tax Consulting',
    serviceType: 'Consulting',
    amount: 2000,
    billingAdvance: 2000,
    billingBalance: 0,
    status: 'Completed',
    proposalSent: true,
    proposalSigned: true,
    paymentStatus: 'Paid',
    paymentProofReceived: true,
    contractSigned: true,
    icdReceived: false,
    startDate: '2025-10-05',
    targetDeadline: '2025-10-12',
    promisedDays: '5-8 days',
    daysElapsed: 5,
    timerStatus: 'On Track',
    assignedTo: 't9', 
    assignmentMode: 'Manual',
    coordinates: { lat: 25.0456, lng: 55.2345, area: 'Arabian Ranches' },
    activityLog: [],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS
  },
  {
    id: 'p012',
    clientName: 'Apex Construction LLC',
    clientType: 'Company',
    licenseType: 'Industrial',
    contactPerson: 'Eng. John Doe',
    email: 'projects@apexbuild.ae',
    phone: '+971 52 666 7777',
    projectName: 'ICV Renewal 2025',
    serviceType: 'ICV Certification',
    elNumber: 'EL-2025-089',
    amount: 4500,
    billingAdvance: 0,
    billingBalance: 4500,
    status: 'Lead',
    proposalSent: false,
    proposalSigned: false,
    paymentStatus: 'Not Sent',
    paymentProofReceived: false,
    contractSigned: false,
    icdReceived: false,
    startDate: '2025-11-22',
    targetDeadline: '2025-11-29',
    promisedDays: '5-8 days',
    daysElapsed: 0,
    timerStatus: 'On Track',
    assignedTo: 't1', 
    assignmentMode: 'Manual',
    coordinates: { lat: 24.9600, lng: 55.0900, area: 'Dubai Investment Park' },
    activityLog: [],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS
  },
  {
    id: 'p013',
    clientName: 'Blue Ocean Logistics',
    clientType: 'Company',
    licenseType: 'Commercial',
    contactPerson: 'Captain Ray',
    email: 'ops@blueocean.ae',
    phone: '+971 50 888 9999',
    projectName: 'VAT Return Q4',
    serviceType: 'VAT Filing',
    amount: 1200,
    billingAdvance: 1200,
    billingBalance: 0,
    status: 'Under Process',
    proposalSent: true,
    proposalSigned: true,
    paymentStatus: 'Paid',
    paymentProofReceived: true,
    contractSigned: true,
    icdReceived: false,
    startDate: '2025-11-15',
    targetDeadline: '2025-11-22',
    promisedDays: '5-8 days',
    daysElapsed: 7,
    timerStatus: 'On Track',
    assignedTo: 't8', 
    assignmentMode: 'Manual',
    coordinates: { lat: 25.2600, lng: 55.2800, area: 'Port Rashid' },
    activityLog: [],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS
  },
  {
    id: 'p014',
    clientName: 'TechNova Solutions',
    clientType: 'Company',
    licenseType: 'Professional',
    contactPerson: 'Lisa Chen',
    email: 'lisa@technova.ae',
    phone: '+971 55 123 9876',
    projectName: 'Liquidation Report',
    serviceType: 'Liquidation',
    amount: 6000,
    billingAdvance: 3000,
    billingBalance: 3000,
    status: 'On Hold',
    proposalSent: true,
    proposalSigned: true,
    paymentStatus: 'Partially Paid',
    paymentProofReceived: true,
    contractSigned: true,
    icdReceived: false,
    startDate: '2025-10-10',
    targetDeadline: '2025-10-18',
    promisedDays: '5-8 days',
    daysElapsed: 40,
    timerStatus: 'Late',
    delayReason: 'Missing Docs',
    remarks: 'Pending NOC from bank.',
    latestReason: { category: 'CLIENT_DELAY_DOCUMENTS', detail: 'Bank NOC pending.', type: 'Client', date: '2025-10-25', user: 'Sara' },
    assignedTo: 't8', 
    assignmentMode: 'Manual',
    coordinates: { lat: 25.1000, lng: 55.1600, area: 'Internet City' },
    activityLog: [],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS
  },
  {
    id: 'p015',
    clientName: 'Golden Sands Tourism',
    clientType: 'Company',
    licenseType: 'Commercial',
    contactPerson: 'Mr. Ali',
    email: 'ali@goldensands.ae',
    phone: '+971 50 765 4321',
    projectName: 'Audit FY23',
    serviceType: 'Audit',
    amount: 8000,
    billingAdvance: 0,
    billingBalance: 8000,
    status: 'Proposal Signed',
    proposalSent: true,
    proposalSigned: true,
    paymentStatus: 'Pending',
    paymentProofReceived: false,
    contractSigned: false,
    icdReceived: false,
    startDate: '2025-11-21',
    targetDeadline: '2025-11-28',
    promisedDays: '5-8 days',
    daysElapsed: 1,
    timerStatus: 'On Track',
    assignedTo: 't4', 
    assignmentMode: 'Manual',
    coordinates: { lat: 25.2500, lng: 55.3000, area: 'Bur Dubai' },
    activityLog: [],
    tasks: DEFAULT_TASKS,
    documents: DEFAULT_DOCS
  }
];

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'l1', userId: 't1', userName: 'Alaes', action: 'Login', target: 'System', timestamp: '2025-11-18T08:00:00' },
  { id: 'l2', userId: 't3', userName: 'Fatima', action: 'Edit', target: 'Project P006', details: 'Changed status to On Hold due to missing docs', timestamp: '2025-11-18T09:30:00', projectId: 'p006' },
  { id: 'l3', userId: 't2', userName: 'Ahmad', action: 'Follow-up', target: 'Project P004', details: 'Sent email to client for payment', timestamp: '2025-11-18T10:15:00', projectId: 'p004' },
  { id: 'l4', userId: 't5', userName: 'Sinan', action: 'Create', target: 'New User (Wajd)', timestamp: '2025-11-18T11:00:00' },
  { id: 'l5', userId: 't1', userName: 'Alaes', action: 'View', target: 'Weekly Reports', timestamp: '2025-11-18T14:20:00' },
  { id: 'l6', userId: 't7', userName: 'Anas', action: 'Edit', target: 'Project P002', details: 'Marked payment as Paid', timestamp: '2025-11-18T15:45:00', projectId: 'p002' },
];
