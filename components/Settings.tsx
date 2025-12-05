
import React, { useState, useRef } from 'react';
import { Upload, Download, Database, AlertCircle, CheckCircle, Save, RefreshCw, FileSpreadsheet, XCircle, Image as ImageIcon, Trash2, Building } from 'lucide-react';
import { Project, Status, ServiceType, PaymentStatus, TeamMember } from '../types';

interface SettingsProps {
  projects: Project[];
  members: TeamMember[];
  onImportProjects: (projects: Project[]) => void;
  currentUser: TeamMember;
  companyLogo: string | null;
  onUpdateLogo: (logo: string | null) => void;
}

export const Settings: React.FC<SettingsProps> = ({ projects, members, onImportProjects, currentUser, companyLogo, onUpdateLogo }) => {
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error' | 'warning'>('idle');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const headers = [
      'ID', 'Client Name', 'Trade license', 'Team member', 'Date of allocation', 'Fees', 
      'Status details', 'Billing Advance', 'Billing Balance', 
      'Project Name', 'Service Type', 
      'Proposal Sent', 'Proposal Signed', 'Payment Status', 'Contract Signed', 'ICD Received',
      'Promised Days', 'Days Elapsed', 'Timer Status', 'Comments'
    ];

    const escapeCsv = (value: any) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows = projects.map(p => [
      p.id, p.clientName, p.licenseType || '', 
      members.find(m => m.id === p.assignedTo)?.name || '', 
      p.startDate, p.amount, 
      p.status, 
      p.billingAdvance || 0, p.billingBalance || 0,
      p.projectName, p.serviceType, 
      p.proposalSent, p.proposalSigned, p.paymentStatus, p.contractSigned, p.icdReceived,
      p.promisedDays, p.daysElapsed, p.timerStatus, p.remarks || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(row => row.map(escapeCsv).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "assist_plus_projects_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- LOGO UPLOAD HANDLER ---
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              if (e.target?.result) {
                  onUpdateLogo(e.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  // --- STRICT EXCEL PARSER FOR 'UPDATED LIST.XLSX' ---
  const processData = (rawRows: any[][]) => {
    // ... (Existing parser logic remains unchanged for brevity, implementation is identical to previous version) ...
    // Note: In a real scenario I would include the full function here.
    // For this update, I'm focusing on the added Logo Logic. 
    // Assuming the previous parser logic exists here.
    
    // RE-INSERTING PARSER LOGIC TO ENSURE INTEGRITY
    const result: Project[] = [];
    const logMessages: string[] = [];

    if (rawRows.length < 2) {
        logMessages.push("File error: The file is too short. It must contain at least a Header Row and Data.");
        return { result, logs: logMessages };
    }

    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
        const rowStr = rawRows[i].map(cell => String(cell || '').toLowerCase()).join(' ');
        if (rowStr.includes('client name') || (rowStr.includes('client') && rowStr.includes('fees'))) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) {
        logMessages.push("CRITICAL ERROR: Could not find a 'Client Name' header.");
        return { result, logs: logMessages };
    }

    const headerRow = rawRows[headerRowIndex].map(cell => String(cell || '').trim().toLowerCase());
    const subHeaderRowIndex = headerRowIndex + 1;
    const subHeaderRow = (subHeaderRowIndex < rawRows.length) 
        ? rawRows[subHeaderRowIndex].map(cell => String(cell || '').trim().toLowerCase()) 
        : [];

    const findColHeader = (keywords: string[]) => headerRow.findIndex(header => keywords.some(k => header.includes(k)));
    const findColSub = (keywords: string[]) => subHeaderRow.findIndex(header => keywords.some(k => header.includes(k)));

    const idx = {
        clientName: findColHeader(['client name', 'client']),
        tradeLicense: findColHeader(['trade license', 'license']),
        teamMember: findColHeader(['team member', 'team']),
        dateAlloc: findColHeader(['date of allocation', 'allocation']),
        fees: findColHeader(['fees', 'total fees', 'amount']),
        moiat: findColHeader(['moiat', 'icv']),
        status: findColHeader(['status details', 'status']),
        comments: findColHeader(['comments', 'remarks']),
        advance: -1,
        balance: -1
    };

    idx.advance = findColSub(['advance', 'paid', 'collected', 'received']);
    idx.balance = findColSub(['balance', 'due', 'pending', 'outstanding']);

    if (idx.advance === -1) idx.advance = findColHeader(['advance', 'paid', 'collected', 'received']);
    if (idx.balance === -1) idx.balance = findColHeader(['balance', 'due', 'pending', 'outstanding']);

    if (idx.advance === -1) {
        const billingIdx = findColHeader(['billing']);
        if (billingIdx > -1) {
            idx.advance = billingIdx;
            idx.balance = billingIdx + 1;
        }
    }

    const parseDate = (val: any): string => {
        if (!val) return new Date().toISOString().split('T')[0];
        if (typeof val === 'number') {
             const date = new Date(Math.round((val - 25569) * 86400 * 1000));
             return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        }
        return new Date().toISOString().split('T')[0]; 
    };

    const parseAmount = (val: any): number => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const numStr = String(val).replace(/[^0-9.-]/g, '');
        const num = parseFloat(numStr);
        return isNaN(num) ? 0 : num;
    };

    const normalizeStatus = (val: any): Status => {
        const s = String(val || '').trim().toLowerCase();
        if (s === 'end' || s === 'completed') return 'Completed';
        if (s === 'under process' || s === 'in progress') return 'Under Process';
        if (s === 'on hold') return 'On Hold';
        if (s === 'review completed') return 'Review Completed';
        if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
        if (s === 'under review') return 'Under Review';
        if (s === 'not active') return 'Not Active';
        if (s === 'proposal sent') return 'Proposal Sent';
        if (s === 'proposal signed') return 'Proposal Signed';
        return 'Under Process';
    };

    const findMemberId = (name: any): string => {
        if (!name) return 't5';
        const cleanName = String(name).trim().toLowerCase();
        const member = members.find(m => m.name.toLowerCase().includes(cleanName));
        return member ? member.id : 't5';
    };

    for (let i = subHeaderRowIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;
        const rawClientName = row[idx.clientName];
        if (!rawClientName) continue;

        try {
            const p: any = {};
            p.id = `imp-${Date.now()}-${i}`;
            p.clientName = String(rawClientName).trim();
            p.clientType = 'Company'; 
            p.licenseType = idx.tradeLicense > -1 ? (row[idx.tradeLicense] || 'Commercial') : 'Commercial';
            p.assignedTo = idx.teamMember > -1 ? findMemberId(row[idx.teamMember]) : 't5';
            p.assignmentMode = 'Manual';
            p.startDate = idx.dateAlloc > -1 ? parseDate(row[idx.dateAlloc]) : new Date().toISOString().split('T')[0];
            p.amount = idx.fees > -1 ? parseAmount(row[idx.fees]) : 0;
            
            let calculatedAdvance = 0;
            if (idx.advance > -1) {
                const rawAdv = row[idx.advance];
                if (typeof rawAdv === 'number') calculatedAdvance = rawAdv;
                else if (rawAdv) {
                    const advStr = String(rawAdv).replace(/[^0-9.-]/g, '');
                    const advNum = parseFloat(advStr);
                    if (!isNaN(advNum)) calculatedAdvance = advNum;
                    else if (String(rawAdv).toLowerCase().includes('paid')) calculatedAdvance = p.amount * 0.5;
                }
            }
            p.billingAdvance = calculatedAdvance;

            let calculatedBalance = 0;
            if (idx.balance > -1) {
                 calculatedBalance = parseAmount(row[idx.balance]);
            } else {
                 calculatedBalance = Math.max(0, p.amount - p.billingAdvance);
            }
            p.billingBalance = calculatedBalance;

            if (p.amount === 0 && (p.billingAdvance > 0 || p.billingBalance > 0)) {
                 p.amount = p.billingAdvance + p.billingBalance;
            }

            p.status = idx.status > -1 ? normalizeStatus(row[idx.status]) : 'Lead';
            p.remarks = idx.comments > -1 ? String(row[idx.comments] || '') : '';
            p.icdReceived = idx.moiat > -1 ? String(row[idx.moiat] || '').toLowerCase().includes('done') : false;

            p.projectName = `${p.clientName} Project`;
            p.serviceType = String(p.licenseType).toLowerCase().includes('industrial') ? 'ICV Certification' : 'Audit';
            p.proposalSent = true;
            p.proposalSigned = true;
            p.contractSigned = true;
            p.paymentProofReceived = p.billingAdvance > 0;
            p.paymentStatus = p.billingBalance <= 0 && p.amount > 0 ? 'Paid' : p.billingAdvance > 0 ? 'Partially Paid' : 'Pending';
            p.targetDeadline = new Date(new Date(p.startDate).getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            p.promisedDays = '5-8 days';
            p.daysElapsed = 0;
            p.timerStatus = 'On Track';
            p.activityLog = [];
            p.contactPerson = '';
            p.email = '';
            p.phone = '';

            result.push(p as Project);
        } catch (err) {
            logMessages.push(`Skipping row ${i+1}: Error parsing.`);
        }
    }
    return { result, logs: logMessages };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.XLSX) {
        setImportStatus('error');
        setMessage("Excel parser library not loaded. Please refresh.");
        return;
    }

    setIsProcessing(true);
    setImportStatus('idle');
    setMessage('');
    setLogs([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        
        const { result, logs } = processData(rawData as any[][]);
        setLogs(logs);

        if (result.length > 0) {
            onImportProjects(result);
            setImportStatus('success');
            setMessage(`Successfully imported ${result.length} projects.`);
        } else {
            setImportStatus('warning');
            setMessage("No valid projects found. Check the file format.");
        }
      } catch (error) {
        console.error(error);
        setImportStatus('error');
        setMessage("Failed to parse Excel file.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const isSuperAdmin = currentUser.role === 'Super Admin';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Settings & Configuration</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">System parameters, branding, and data management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* BRANDING SECTION (Super Admin Only) */}
        <div className="bg-white dark:bg-[#151515] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Building size={20} className="text-purple-600" />
                    Company Branding
                </h3>
                {!isSuperAdmin && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">Read Only</span>}
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Set the company logo displayed on the login screen and sidebar.
            </p>

            <div className="flex flex-col items-center gap-4">
                <div className="w-full h-32 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden relative group">
                    {companyLogo ? (
                        <img src={companyLogo} alt="Company Logo" className="w-full h-full object-contain" />
                    ) : (
                        <ImageIcon className="text-slate-300 dark:text-slate-600" size={32} />
                    )}
                    
                    {isSuperAdmin && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => logoInputRef.current?.click()}
                                className="text-white text-xs font-bold"
                            >
                                Change
                            </button>
                        </div>
                    )}
                </div>

                {isSuperAdmin && (
                    <div className="flex gap-2 w-full">
                        <input 
                            type="file" 
                            ref={logoInputRef} 
                            onChange={handleLogoUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        <button 
                            onClick={() => logoInputRef.current?.click()}
                            className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition-colors"
                        >
                            Upload Logo
                        </button>
                        {companyLogo && (
                            <button 
                                onClick={() => onUpdateLogo(null)}
                                className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                title="Remove Logo"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Import Section */}
        <div className="bg-white dark:bg-[#151515] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <Database size={20} className="text-teal-600" />
            Import Data
          </h3>
          <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors group">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload}
              className="hidden" 
              id="file-upload"
              disabled={isProcessing}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                {isProcessing ? (
                    <RefreshCw size={32} className="text-teal-600 animate-spin" />
                ) : (
                    <FileSpreadsheet size={32} className="text-slate-400 dark:text-slate-500 group-hover:text-teal-600 transition-colors" />
                )}
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {isProcessing ? 'Processing Excel File...' : 'Click to Upload "Updated list.xlsx"'}
                </span>
            </label>
          </div>

          {/* Status Message */}
          {importStatus !== 'idle' && (
              <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
                  importStatus === 'success' ? 'bg-emerald-50 text-emerald-700' : 
                  importStatus === 'error' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
              }`}>
                  {importStatus === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : 
                   importStatus === 'error' ? <XCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                  <div>
                      <p className="font-bold">{message}</p>
                      {logs.length > 0 && (
                          <div className="mt-2 max-h-32 overflow-y-auto text-xs border-t border-black/10 pt-2">
                              {logs.map((log, i) => <p key={i} className="font-mono mb-0.5">{log}</p>)}
                          </div>
                      )}
                  </div>
              </div>
          )}
        </div>

        {/* Export Section */}
        <div className="bg-white dark:bg-[#151515] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <Save size={20} className="text-blue-600" />
            Backup & Export
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Download a full CSV backup of all projects, including financial data, status history, and remarks.</p>
          <button 
            onClick={handleExport}
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={18} /> Export to CSV
          </button>
        </div>
      </div>
    </div>
  );
};
