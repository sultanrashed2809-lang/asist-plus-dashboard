
import React, { useState, useEffect } from 'react';
import { Project, IntercomData, TeamMember, DocTemplate } from '../types';
import { INTERCOM_SERVICES, ISO_STANDARDS } from '../constants';
import { Printer, Save, CheckSquare, Square, RefreshCw, FileText } from 'lucide-react';

interface IntercomFormProps {
  project: Project;
  onUpdate: (data: IntercomData) => void;
  currentUser: TeamMember;
  templates?: DocTemplate[];
}

export const IntercomForm: React.FC<IntercomFormProps> = ({ project, onUpdate, currentUser, templates }) => {
  const [data, setData] = useState<IntercomData>({
    refNo: project.elNumber || `APAA/${new Date().getFullYear()}/ICV/001`,
    date: new Date().toISOString().split('T')[0],
    clientCompanyName: project.clientName || '',
    scopeOfWork: project.serviceType || '',
    clientContactPerson: project.contactPerson || '',
    clientPhone: project.phone || '',
    clientEmail: project.email || '',
    contractDate: new Date().toISOString().split('T')[0],
    consultantAddress: '',
    consultantName: '',
    consultantPhone: '',
    consultantEmail: '',
    consultantType: 'Company',
    services: [project.serviceType.toUpperCase()] || [],
    isoStandards: [],
    surveillance: '',
    accreditation: '',
    numberOfBranches: '',
    visitLocation: '',
    isRecertification: 'No',
    hasTradeLicense: 'Yes',
    vatCertificate: 'Yes',
    hasProfile: 'No',
    financialEvaluation: '',
    clientLevel: '',
    initialPayment: 'Not Collected',
    processingPriority: 'Normal',
    targetCompletionDate: project.targetDeadline || '',
    remarks: project.remarks || '',
    preparedBy: currentUser.name,
    preparedDate: new Date().toISOString().split('T')[0],
    approvedBy: '',
    approvedDate: '',
    receivedBy: '',
    receivedDate: '',
    executedBy: '',
    executedDate: ''
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  useEffect(() => {
    if (project.intercomData) {
      setData(project.intercomData);
    }
  }, [project.intercomData]);

  // Set default template to "Intercom Sheet" if available
  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplateId) {
        const defaultTemp = templates.find(t => t.name.toLowerCase().includes('intercom')) || templates[0];
        setSelectedTemplateId(defaultTemp.id);
    }
  }, [templates, selectedTemplateId]);

  const handleChange = (field: keyof IntercomData, value: any) => {
    const newData = { ...data, [field]: value };
    setData(newData);
  };

  const toggleService = (service: string) => {
    const current = [...data.services];
    const index = current.indexOf(service);
    if (index === -1) current.push(service);
    else current.splice(index, 1);
    handleChange('services', current);
  };

  const toggleIso = (standard: string) => {
    const current = [...data.isoStandards];
    const index = current.indexOf(standard);
    if (index === -1) current.push(standard);
    else current.splice(index, 1);
    handleChange('isoStandards', current);
  };

  const handleSave = () => {
    onUpdate(data);
    alert('Intercom Form Saved!');
  };

  const handlePrint = () => {
    // If a template is selected, use it for printing
    if (selectedTemplateId && templates) {
        const template = templates.find(t => t.id === selectedTemplateId);
        if (template) {
            let html = template.content;
            
            // --- DATA MAPPING ---
            // Replace placeholders with current form values
            const replacers: Record<string, string> = {
                '{{clientName}}': data.clientCompanyName || '',
                '{{elNumber}}': data.refNo || '',
                '{{startDate}}': data.date || '',
                '{{contactPerson}}': data.clientContactPerson || '',
                '{{phone}}': data.clientPhone || '',
                '{{email}}': data.clientEmail || '',
                '{{amount}}': project.amount ? project.amount.toLocaleString() : '0',
                '{{serviceType}}': project.serviceType || '',
                '{{scope_of_work}}': data.scopeOfWork || '',
                '{{consultant_name}}': data.consultantName || '',
                '{{consultant_mobile}}': data.consultantPhone || '',
                '{{consultant_type}}': data.consultantType || '',
                '{{iso_standards}}': data.isoStandards.join(', ') || '',
                '{{surveillance}}': data.surveillance || '',
                '{{accreditation}}': data.accreditation || '',
                '{{financial_evaluation}}': data.financialEvaluation || '',
                '{{initial_payment_status}}': data.initialPayment || '',
                '{{remarks}}': data.remarks || '',
            };

            // Replace all occurrences
            Object.keys(replacers).forEach(key => {
                const regex = new RegExp(key, 'g');
                html = html.replace(regex, replacers[key]);
            });

            // Clean up any remaining unreplaced variables {{...}}
            html = html.replace(/{{.*?}}/g, '');

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>${template.name} - ${data.clientCompanyName}</title>
                            <style>
                                body { margin: 0; padding: 20px; font-family: sans-serif; -webkit-print-color-adjust: exact; background: white; }
                                @page { size: A4; margin: 0; }
                                @media print { body { padding: 0; } }
                            </style>
                        </head>
                        <body>
                            ${html}
                            <script>
                                window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
            return;
        }
    }

    // Fallback to default browser print if no template
    window.print();
  };

  // Reusable Components for the Form UI
  const SectionHeader = ({ title }: { title: string }) => (
    <div className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs uppercase p-1.5 text-center border border-slate-400 dark:border-slate-600">
      {title}
    </div>
  );

  const RadioGroup = ({ label, options, value, onChange }: any) => (
    <div className="flex items-center gap-2 text-xs border border-slate-300 dark:border-slate-600 p-1 bg-white dark:bg-slate-800 h-full">
      <span className="font-bold text-[10px] uppercase min-w-[60px]">{label}</span>
      <div className="flex gap-2 border-l border-slate-300 dark:border-slate-600 pl-2">
        {options.map((opt: string) => (
          <label key={opt} className="flex items-center gap-1 cursor-pointer">
            <input 
              type="radio" 
              name={label} 
              checked={value === opt} 
              onChange={() => onChange(opt)}
              className="accent-teal-600"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 p-4 min-h-[800px]">
      {/* Action Bar (Hidden in Print) */}
      <div className="flex justify-between items-center mb-6 no-print bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
            <FileText size={20} className="text-teal-600" /> Project Intercom
        </h3>
        
        <div className="flex items-center gap-4">
            {/* Template Selector for Printing */}
            {templates && templates.length > 0 && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Print Template:</span>
                    <select 
                        value={selectedTemplateId} 
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-teal-500"
                    >
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            )}

            <div className="flex gap-2">
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded text-sm font-bold hover:bg-teal-700 transition-colors">
                    <Save size={16} /> Save
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded text-sm font-bold hover:bg-slate-700 transition-colors">
                    <Printer size={16} /> Print
                </button>
            </div>
        </div>
      </div>

      {/* THE FORM SHEET - Exact Replication Structure (For Data Entry) */}
      <div className="border-2 border-black dark:border-slate-500 text-slate-900 dark:text-slate-100 max-w-[210mm] mx-auto bg-white dark:bg-slate-900 print:border-black print:text-black print:w-full print:max-w-none shadow-xl">
        
        {/* Header Block */}
        <div className="flex border-b-2 border-black dark:border-slate-500">
          <div className="w-1/3 p-4 flex items-center justify-center border-r border-black dark:border-slate-500">
             <div className="text-center">
                <div className="text-2xl font-serif font-bold text-slate-800 dark:text-white">A<span className="text-teal-600">P</span></div>
                <div className="text-[10px] font-bold tracking-widest">ASSIST PLUS</div>
             </div>
          </div>
          <div className="w-1/3 p-2 flex items-center justify-center text-center font-bold text-lg border-r border-black dark:border-slate-500">
            Assist Plus Accounting &<br/>Auditing Services
          </div>
          <div className="w-1/3 flex flex-col">
             <div className="flex-1 flex border-b border-black dark:border-slate-500">
                <div className="w-1/3 bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold flex items-center justify-center border-r border-black dark:border-slate-500">REF NO:</div>
                <div className="flex-1 p-1">
                    <input type="text" value={data.refNo} onChange={v => handleChange('refNo', v.target.value)} className="w-full h-full bg-transparent outline-none font-mono text-center text-sm font-bold" />
                </div>
             </div>
             <div className="flex-1 flex">
                <div className="w-1/3 bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold flex items-center justify-center border-r border-black dark:border-slate-500">DATE:</div>
                <div className="flex-1 p-1 flex items-center justify-center text-xs font-mono">{data.date}</div>
             </div>
          </div>
        </div>

        <div className="border-b border-black dark:border-slate-500 text-center font-bold text-sm bg-slate-100 dark:bg-slate-800 py-1">
            APAA ( TEAM AUH ) - INTERCOM
        </div>

        {/* Client & Consultant Grid */}
        <div className="flex border-b border-black dark:border-slate-500">
            {/* Left: Client Info */}
            <div className="w-1/2 border-r border-black dark:border-slate-500 p-2 space-y-1">
                <div className="grid grid-cols-3 gap-1 items-center">
                    <label className="text-[10px] font-bold">COMPANY NAME</label>
                    <input type="text" className="col-span-2 text-xs border-b border-dashed border-slate-400 bg-transparent outline-none" value={data.clientCompanyName} onChange={e => handleChange('clientCompanyName', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-1 items-center">
                    <label className="text-[10px] font-bold">SCOPE OF WORK</label>
                    <input type="text" className="col-span-2 text-xs border-b border-dashed border-slate-400 bg-transparent outline-none" value={data.scopeOfWork} onChange={e => handleChange('scopeOfWork', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-1 items-center">
                    <label className="text-[10px] font-bold">CONTACT PERSON</label>
                    <input type="text" className="col-span-2 text-xs border-b border-dashed border-slate-400 bg-transparent outline-none" value={data.clientContactPerson} onChange={e => handleChange('clientContactPerson', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-1 items-center">
                    <label className="text-[10px] font-bold">PHONE / MOBILE</label>
                    <input type="text" className="col-span-2 text-xs border-b border-dashed border-slate-400 bg-transparent outline-none" value={data.clientPhone} onChange={e => handleChange('clientPhone', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-1 items-center">
                    <label className="text-[10px] font-bold">EMAIL ID</label>
                    <input type="text" className="col-span-2 text-xs border-b border-dashed border-slate-400 bg-transparent outline-none" value={data.clientEmail} onChange={e => handleChange('clientEmail', e.target.value)} />
                </div>
            </div>

            {/* Right: Consultant Info */}
            <div className="w-1/2 p-2 space-y-1">
                <div className="grid grid-cols-3 gap-1 items-center">
                    <label className="text-[10px] font-bold">CONTRACT DATE</label>
                    <input type="date" className="col-span-2 text-xs border-b border-dashed border-slate-400 bg-transparent outline-none" value={data.contractDate} onChange={e => handleChange('contractDate', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-1 items-center">
                    <label className="text-[10px] font-bold">ADDRESS</label>
                    <input type="text" className="col-span-2 text-xs border-b border-dashed border-slate-400 bg-transparent outline-none" value={data.consultantAddress} onChange={e => handleChange('consultantAddress', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-1 items-center">
                    <label className="text-[10px] font-bold">CONSULTANT</label>
                    <input type="text" className="col-span-2 text-xs border-b border-dashed border-slate-400 bg-transparent outline-none" value={data.consultantName} onChange={e => handleChange('consultantName', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-1 items-center">
                    <label className="text-[10px] font-bold">PHONE / MOBILE</label>
                    <input type="text" className="col-span-2 text-xs border-b border-dashed border-slate-400 bg-transparent outline-none" value={data.consultantPhone} onChange={e => handleChange('consultantPhone', e.target.value)} />
                </div>
                <div className="flex items-center justify-end gap-4 mt-2">
                    <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                        <div className={`w-3 h-3 border border-black dark:border-slate-400 flex items-center justify-center ${data.consultantType === 'Company' ? 'bg-black dark:bg-white' : ''}`}></div>
                        COMPANY
                    </label>
                    <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                        <div className={`w-3 h-3 border border-black dark:border-slate-400 flex items-center justify-center ${data.consultantType === 'Freelancer' ? 'bg-black dark:bg-white' : ''}`}></div>
                        FREELANCER
                    </label>
                </div>
            </div>
        </div>

        {/* Services Grid */}
        <div className="border-b border-black dark:border-slate-500">
            <div className="flex border-b border-black dark:border-slate-500">
                <div className="w-24 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold border-r border-black dark:border-slate-500">SERVICE</div>
                <div className="flex-1 flex flex-wrap">
                    {INTERCOM_SERVICES.map(service => (
                        <div key={service} onClick={() => toggleService(service)} className={`flex-1 min-w-[60px] p-2 text-[10px] font-bold text-center border-r border-black dark:border-slate-500 last:border-r-0 cursor-pointer ${data.services.includes(service) ? 'bg-teal-100 dark:bg-teal-900' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            {service}
                            {data.services.includes(service) && <CheckSquare size={10} className="inline ml-1" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* ISO Section */}
        <div className="border-b border-black dark:border-slate-500">
            <div className="flex border-b border-black dark:border-slate-500">
                <div className="w-24 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold border-r border-black dark:border-slate-500">STANDARD</div>
                <div className="flex-1 flex">
                    {ISO_STANDARDS.map(std => (
                        <div key={std} onClick={() => toggleIso(std)} className={`flex-1 p-1 text-[9px] font-bold text-center border-r border-black dark:border-slate-500 last:border-r-0 cursor-pointer ${data.isoStandards.includes(std) ? 'bg-teal-100 dark:bg-teal-900' : ''}`}>
                            {std}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex border-b border-black dark:border-slate-500">
                <div className="w-24 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold border-r border-black dark:border-slate-500">SURVEILLANCE</div>
                <div className="w-1/3 flex border-r border-black dark:border-slate-500">
                    <label onClick={() => handleChange('surveillance', '3 Years (NIL)')} className={`flex-1 text-[10px] p-1 text-center cursor-pointer border-r border-black dark:border-slate-500 ${data.surveillance === '3 Years (NIL)' ? 'bg-teal-100 dark:bg-teal-900' : ''}`}>3 YEARS (NIL)</label>
                    <label onClick={() => handleChange('surveillance', 'Regular')} className={`flex-1 text-[10px] p-1 text-center cursor-pointer ${data.surveillance === 'Regular' ? 'bg-teal-100 dark:bg-teal-900' : ''}`}>REGULAR</label>
                </div>
                <div className="flex-1 text-[10px] p-1 text-center italic text-slate-500">(2nd & 3rd year w/ charge)</div>
            </div>
            <div className="flex">
                <div className="w-24 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold border-r border-black dark:border-slate-500">ACCREDITATION</div>
                <div className="flex-1 flex">
                    {['ASCB', 'EIAC', 'EGAC'].map(acc => (
                        <div key={acc} onClick={() => handleChange('accreditation', acc)} className={`flex-1 p-1 text-center text-xs font-bold border-r border-black dark:border-slate-500 last:border-r-0 cursor-pointer ${data.accreditation === acc ? 'bg-teal-100 dark:bg-teal-900' : ''}`}>{acc}</div>
                    ))}
                </div>
            </div>
        </div>

        {/* Certifications Row */}
        <div className="flex border-b border-black dark:border-slate-500">
            <RadioGroup label="RECERTIFICATION" options={['Yes', 'No']} value={data.isRecertification} onChange={(v: any) => handleChange('isRecertification', v)} />
            <RadioGroup label="TRADE LICENSE" options={['Yes', 'No']} value={data.hasTradeLicense} onChange={(v: any) => handleChange('hasTradeLicense', v)} />
            <RadioGroup label="VAT CERTIFICATE" options={['Yes', 'No']} value={data.vatCertificate} onChange={(v: any) => handleChange('vatCertificate', v)} />
            <RadioGroup label="PROFILE" options={['Yes', 'No']} value={data.hasProfile} onChange={(v: any) => handleChange('hasProfile', v)} />
        </div>

        {/* Financial Evaluation Matrix */}
        <div className="border-b border-black dark:border-slate-500">
            <div className="grid grid-cols-3 border-b border-black dark:border-slate-500 text-center bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                <div className="border-r border-black dark:border-slate-500 p-1">FINANCIAL EVALUATION</div>
                <div className="border-r border-black dark:border-slate-500 p-1">LEVEL OF CLIENT</div>
                <div className="p-1">INITIAL PAYMENT</div>
            </div>
            <div className="grid grid-cols-3 text-center text-xs">
                {/* Col 1 */}
                <div className="border-r border-black dark:border-slate-500">
                    {['High', 'Medium', 'Low'].map(val => (
                        <div key={val} onClick={() => handleChange('financialEvaluation', val)} className={`border-b border-black dark:border-slate-500 last:border-b-0 p-1 cursor-pointer hover:bg-slate-50 ${data.financialEvaluation === val ? 'bg-teal-100 dark:bg-teal-900 font-bold' : ''}`}>{val}</div>
                    ))}
                </div>
                {/* Col 2 */}
                <div className="border-r border-black dark:border-slate-500">
                    {['Competent', 'Average', 'Normal'].map(val => (
                        <div key={val} onClick={() => handleChange('clientLevel', val)} className={`border-b border-black dark:border-slate-500 last:border-b-0 p-1 cursor-pointer hover:bg-slate-50 ${data.clientLevel === val ? 'bg-teal-100 dark:bg-teal-900 font-bold' : ''}`}>{val}</div>
                    ))}
                </div>
                {/* Col 3 */}
                <div>
                    {['Collected', 'Not Collected', 'Under Collection'].map(val => (
                        <div key={val} onClick={() => handleChange('initialPayment', val)} className={`border-b border-black dark:border-slate-500 last:border-b-0 p-1 cursor-pointer hover:bg-slate-50 ${data.initialPayment === val ? 'bg-teal-100 dark:bg-teal-900 font-bold' : ''}`}>{val}</div>
                    ))}
                </div>
            </div>
        </div>

        {/* Workflow */}
        <div className="flex border-b border-black dark:border-slate-500">
            <div className="w-24 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold border-r border-black dark:border-slate-500 p-1">PROCESSING</div>
            <div className="flex items-center border-r border-black dark:border-slate-500">
                <div onClick={() => handleChange('processingPriority', 'Normal')} className={`px-4 py-1 text-xs border-r border-black dark:border-slate-500 cursor-pointer ${data.processingPriority === 'Normal' ? 'bg-teal-100 dark:bg-teal-900' : ''}`}>NORMAL</div>
                <div onClick={() => handleChange('processingPriority', 'Urgent')} className={`px-4 py-1 text-xs cursor-pointer ${data.processingPriority === 'Urgent' ? 'bg-red-100 dark:bg-red-900' : ''}`}>URGENT</div>
            </div>
            <div className="w-32 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold border-r border-black dark:border-slate-500 p-1 border-l border-black">TARGET DATE</div>
            <div className="flex-1 p-1">
                <input type="date" value={data.targetCompletionDate} onChange={e => handleChange('targetCompletionDate', e.target.value)} className="w-full text-xs outline-none bg-transparent" />
            </div>
        </div>

        {/* Remarks */}
        <div className="border-b border-black dark:border-slate-500 min-h-[100px] p-2">
            <label className="text-[10px] font-bold">REMARKS</label>
            <textarea 
                value={data.remarks} 
                onChange={e => handleChange('remarks', e.target.value)}
                className="w-full h-full min-h-[80px] text-xs resize-none outline-none bg-transparent border-none p-1"
                placeholder="Enter additional notes here..."
            />
        </div>

        {/* Signatures */}
        <div className="flex text-[10px] p-2 pt-8 pb-4">
            <div className="flex-1 text-center space-y-8">
                <div className="font-bold">PREPARED BY</div>
                <div className="border-b border-black dark:border-slate-500 w-3/4 mx-auto">{data.preparedBy}</div>
                <div className="font-bold">MARKETING EXECUTIVE</div>
            </div>
            <div className="flex-1 text-center space-y-8">
                <div className="font-bold">APPROVED BY</div>
                <div className="border-b border-black dark:border-slate-500 w-3/4 mx-auto">{data.approvedBy}</div>
                <div className="font-bold">SALES MANAGER</div>
            </div>
            <div className="flex-1 text-center space-y-8">
                <div className="font-bold">RECEIVED BY</div>
                <div className="border-b border-black dark:border-slate-500 w-3/4 mx-auto">{data.receivedBy}</div>
                <div className="font-bold">TECHNICAL MANAGER</div>
            </div>
            <div className="flex-1 text-center space-y-8">
                <div className="font-bold">EXECUTED BY</div>
                <div className="border-b border-black dark:border-slate-500 w-3/4 mx-auto">{data.executedBy}</div>
                <div className="font-bold">TECHNICAL EXECUTIVE</div>
            </div>
        </div>

      </div>
      
      {/* Print Styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 5mm; }
          body { -webkit-print-color-adjust: exact; background: white !important; color: black !important; }
          nav, aside, .no-print, button { display: none !important; }
          .dark { color: black !important; background: white !important; }
          input, textarea { border: none !important; }
          .bg-slate-200, .bg-slate-100 { background-color: #f1f5f9 !important; } 
          .border-slate-500 { border-color: black !important; }
        }
      `}</style>
    </div>
  );
};
