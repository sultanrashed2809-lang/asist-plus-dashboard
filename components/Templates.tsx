
import React, { useState, useEffect, useRef } from 'react';
import { DocTemplate, FieldDefinition } from '../types';
import { DEFAULT_FIELDS, DEFAULT_TEMPLATES } from '../constants';
import { FileText, Plus, Save, Trash2, Edit2, LayoutTemplate, Grid, Type, Heading, Move, X, ChevronDown, Check, Columns, Image as ImageIcon, Minus, Eye, EyeOff } from 'lucide-react';

interface TemplatesProps {
    onUpdateFields: (fields: FieldDefinition[]) => void;
    onUpdateTemplates: (templates: DocTemplate[]) => void;
}

// Builder Types
type BlockType = 'header' | 'section_title' | 'grid' | 'text' | 'spacer' | 'image' | 'divider';

interface BuilderBlock {
    id: string;
    type: BlockType;
    title?: string; // For section_title
    content?: string; // For text block or Image URL/Base64
    imageStyle?: { width: number, align: 'left' | 'center' | 'right' };
    columns?: { label: string; variable: string; width?: number }[]; // For grid
}

const INITIAL_BUILDER_STATE: BuilderBlock[] = [
    { id: 'b1', type: 'header' },
    { id: 'b2', type: 'section_title', title: 'PROJECT DETAILS' },
    { id: 'b3', type: 'grid', columns: [{ label: 'REF NO', variable: '{{elNumber}}' }, { label: 'DATE', variable: '{{startDate}}' }] },
    { id: 'b4', type: 'section_title', title: 'CLIENT INFO' },
    { id: 'b5', type: 'grid', columns: [{ label: 'COMPANY NAME', variable: '{{clientName}}' }] },
    { id: 'b6', type: 'grid', columns: [{ label: 'CONTACT PERSON', variable: '{{contactPerson}}' }, { label: 'PHONE', variable: '{{phone}}' }] },
    { id: 'b7', type: 'grid', columns: [{ label: 'EMAIL', variable: '{{email}}' }] },
];

export const Templates: React.FC<TemplatesProps> = ({ onUpdateFields, onUpdateTemplates }) => {
    const [activeTab, setActiveTab] = useState<'templates' | 'fields'>('templates');
    const [fields, setFields] = useState<FieldDefinition[]>(DEFAULT_FIELDS);
    const [templates, setTemplates] = useState<DocTemplate[]>(DEFAULT_TEMPLATES);
    
    // Editor State
    const [editingTemplate, setEditingTemplate] = useState<DocTemplate | null>(null);
    const [builderBlocks, setBuilderBlocks] = useState<BuilderBlock[]>([]);
    
    // File Upload Ref
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

    // Field Editor State
    const [isEditingField, setIsEditingField] = useState(false);
    const [fieldForm, setFieldForm] = useState<Partial<FieldDefinition>>({});

    // --- Load Template into Builder ---
    useEffect(() => {
        if (editingTemplate) {
            // Try to extract builder state from HTML content (hidden script tag)
            const match = editingTemplate.content.match(/<script id="builder-data" type="application\/json">(.*?)<\/script>/);
            if (match && match[1]) {
                try {
                    const parsed = JSON.parse(match[1]);
                    setBuilderBlocks(parsed);
                } catch (e) {
                    console.error("Failed to parse builder data", e);
                    setBuilderBlocks(INITIAL_BUILDER_STATE);
                }
            } else if (editingTemplate.content.trim() === '') {
                setBuilderBlocks(INITIAL_BUILDER_STATE);
            } else {
                setBuilderBlocks(INITIAL_BUILDER_STATE); 
            }
        }
    }, [editingTemplate]);

    // --- Helper: Generate HTML from Builder Blocks ---
    const generateHtml = (blocks: BuilderBlock[]) => {
        let html = `<div style="font-family: 'Inter', Arial, sans-serif; color: #000; line-height: 1.4; max-width: 210mm; margin: 0 auto; background: white;">`;
        
        blocks.forEach(block => {
            if (block.type === 'header') {
                html += `
                    <div style="display: flex; border-bottom: 2px solid #000; margin-bottom: 10px;">
                        <div style="width: 35%; padding: 15px; border-right: 2px solid #000; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                            <div style="font-size: 28px; font-weight: 800; color: #1e293b; line-height: 1;">AP<span style="color: #0d9488;">+</span></div>
                            <div style="font-size: 10px; letter-spacing: 3px; font-weight: bold; margin-top: 4px; color: #334155;">ASSIST PLUS</div>
                        </div>
                        <div style="flex: 1; padding: 15px; text-align: center; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: #0f172a;">
                            Assist Plus Accounting &<br/>Auditing Services
                        </div>
                    </div>
                `;
            } else if (block.type === 'section_title') {
                html += `
                    <div style="background-color: #f1f5f9; color: #0f172a; font-weight: 800; font-size: 11px; padding: 6px; text-align: center; border: 1px solid #000; border-bottom: none; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${block.title}
                    </div>
                `;
            } else if (block.type === 'grid') {
                html += `<div style="display: flex; border: 1px solid #000; border-bottom: none;">`;
                block.columns?.forEach((col, idx) => {
                    const isLast = idx === (block.columns?.length || 0) - 1;
                    html += `
                        <div style="flex: 1; display: flex; border-right: ${isLast ? 'none' : '1px solid #000'};">
                            <div style="width: 110px; background-color: white; padding: 6px; font-size: 10px; font-weight: bold; border-right: 1px solid #000; display: flex; align-items: center; text-transform: uppercase;">${col.label}</div>
                            <div style="flex: 1; padding: 6px; font-size: 11px; font-family: monospace; color: #475569;">${col.variable}</div>
                        </div>
                    `;
                });
                html += `</div>`;
            } else if (block.type === 'text') {
                html += `
                    <div style="border: 1px solid #000; border-bottom: none; padding: 10px; min-height: 60px; font-size: 12px; white-space: pre-wrap;">${block.content || ''}</div>
                `;
            } else if (block.type === 'image') {
                const align = block.imageStyle?.align || 'center';
                const width = block.imageStyle?.width || 100;
                html += `
                    <div style="padding: 10px; border: 1px solid #000; border-bottom: none; display: flex; justify-content: ${align};">
                        ${block.content ? `<img src="${block.content}" style="max-width: ${width}%; max-height: 300px; object-fit: contain;" />` : '<div style="width: 100px; height: 100px; background: #eee; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999;">Image</div>'}
                    </div>
                `;
            } else if (block.type === 'divider') {
                html += `
                    <div style="padding: 10px 0; border-left: 1px solid #000; border-right: 1px solid #000;">
                        <hr style="border: 0; border-top: 2px solid #000;" />
                    </div>
                `;
            } else if (block.type === 'spacer') {
                html += `<div style="height: 20px; border-top: 1px solid #000;"></div>`;
            }
        });

        html += `<div style="border-top: 1px solid #000;"></div></div>`; // Close wrapper and last border

        const scriptData = `<script id="builder-data" type="application/json">${JSON.stringify(blocks)}</script>`;
        return scriptData + html;
    };

    // --- Builder Actions ---
    const addBlock = (type: BlockType) => {
        const newBlock: BuilderBlock = {
            id: `b-${Date.now()}`,
            type,
            title: type === 'section_title' ? 'NEW SECTION' : undefined,
            columns: type === 'grid' ? [{ label: 'LABEL', variable: '' }] : undefined,
            content: type === 'text' ? 'Enter text here...' : undefined
        };
        
        // Auto trigger file upload for image
        if (type === 'image') {
            setUploadTargetId(newBlock.id);
            setTimeout(() => fileInputRef.current?.click(), 100);
        }

        setBuilderBlocks([...builderBlocks, newBlock]);
    };

    const updateBlock = (id: string, updates: Partial<BuilderBlock>) => {
        setBuilderBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const deleteBlock = (id: string) => {
        setBuilderBlocks(prev => prev.filter(b => b.id !== id));
    };

    const moveBlock = (index: number, direction: -1 | 1) => {
        if (index + direction < 0 || index + direction >= builderBlocks.length) return;
        const newBlocks = [...builderBlocks];
        const temp = newBlocks[index];
        newBlocks[index] = newBlocks[index + direction];
        newBlocks[index + direction] = temp;
        setBuilderBlocks(newBlocks);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && uploadTargetId) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    updateBlock(uploadTargetId, { content: ev.target.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
        setUploadTargetId(null);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset
    };

    // --- Save Template ---
    const handleSaveTemplate = () => {
        if (!editingTemplate) return;
        
        const finalHtml = generateHtml(builderBlocks);
        
        const updated = templates.some(t => t.id === editingTemplate.id)
            ? templates.map(t => t.id === editingTemplate.id ? { ...editingTemplate, content: finalHtml, updatedAt: new Date().toISOString().split('T')[0] } : t)
            : [...templates, { ...editingTemplate, id: `t-${Date.now()}`, content: finalHtml, updatedAt: new Date().toISOString().split('T')[0] }];
        
        setTemplates(updated);
        onUpdateTemplates(updated);
        setEditingTemplate(null);
    };

    const handleDeleteTemplate = (id: string) => {
        if (confirm('Delete this template?')) {
            const updated = templates.filter(t => t.id !== id);
            setTemplates(updated);
            onUpdateTemplates(updated);
            if (editingTemplate?.id === id) setEditingTemplate(null);
        }
    };

    // --- Field Management (Existing Logic) ---
    const handleSaveField = () => {
        if (!fieldForm.label || !fieldForm.key) return;
        const newField = fieldForm as FieldDefinition;
        if (fields.some(f => f.id === newField.id)) {
            setFields(fields.map(f => f.id === newField.id ? newField : f));
        } else {
            setFields([...fields, newField]);
        }
        setIsEditingField(false);
        onUpdateFields([...fields, newField]);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Templates & Fields</h2>
                    <p className="text-sm text-slate-500">Manage document templates and custom project fields.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('templates')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'templates' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500'}`}
                    >
                        Doc Templates
                    </button>
                    <button 
                        onClick={() => setActiveTab('fields')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'fields' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500'}`}
                    >
                        Custom Fields
                    </button>
                </div>
            </div>

            {activeTab === 'templates' && (
                <div className="grid grid-cols-12 gap-6 h-full min-h-[600px]">
                    {/* LEFT: Template List */}
                    <div className="col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 overflow-y-auto flex flex-col">
                        <button 
                            onClick={() => setEditingTemplate({ 
                                id: `temp-${Date.now()}`, 
                                name: 'New Template', 
                                category: 'Form', 
                                content: '', 
                                updatedAt: new Date().toISOString().split('T')[0],
                                isVisibleToEmployees: true
                            })}
                            className="w-full py-3 mb-4 bg-slate-900 dark:bg-slate-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
                        >
                            <Plus size={16} /> New Template
                        </button>
                        <div className="space-y-2 flex-1">
                            {templates.map(t => (
                                <div key={t.id} onClick={() => setEditingTemplate(t)} className={`p-3 rounded-lg border cursor-pointer transition-all ${editingTemplate?.id === t.id ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate max-w-[120px]">{t.name}</h4>
                                        <div className="flex items-center gap-1">
                                            {t.isVisibleToEmployees ? <Eye size={12} className="text-teal-500" /> : <EyeOff size={12} className="text-slate-400" />}
                                            <span className="text-[10px] bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{t.category}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 flex justify-between">
                                        <span>{t.updatedAt}</span>
                                        <Trash2 size={12} className="hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }} />
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Visual Builder */}
                    <div className="col-span-9 bg-slate-100 dark:bg-[#050505] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
                        {editingTemplate ? (
                            <>
                                {/* Builder Toolbar */}
                                <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shadow-sm z-10">
                                    <div className="flex gap-4 items-center w-1/3">
                                        <input 
                                            type="text" 
                                            className="w-full bg-transparent font-bold text-slate-800 dark:text-white outline-none border-b border-transparent focus:border-teal-500 transition-colors placeholder-slate-400" 
                                            value={editingTemplate.name}
                                            onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                            placeholder="Template Name"
                                        />
                                        <button 
                                            onClick={() => setEditingTemplate({...editingTemplate, isVisibleToEmployees: !editingTemplate.isVisibleToEmployees})}
                                            className={`p-2 rounded-full transition-colors ${editingTemplate.isVisibleToEmployees ? 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
                                            title={editingTemplate.isVisibleToEmployees ? "Visible to Employees" : "Hidden from Employees"}
                                        >
                                            {editingTemplate.isVisibleToEmployees ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => addBlock('section_title')} className="p-2 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" title="Section Title"><Heading size={18} /></button>
                                        <button onClick={() => addBlock('grid')} className="p-2 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" title="Grid Row"><Grid size={18} /></button>
                                        <button onClick={() => addBlock('text')} className="p-2 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" title="Text Area"><Type size={18} /></button>
                                        <button onClick={() => addBlock('image')} className="p-2 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" title="Add Image/Logo"><ImageIcon size={18} /></button>
                                        <button onClick={() => addBlock('divider')} className="p-2 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" title="Add Divider Line"><Minus size={18} /></button>
                                        
                                        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2"></div>
                                        <button onClick={handleSaveTemplate} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 shadow-md">
                                            <Save size={16} /> Save Template
                                        </button>
                                    </div>
                                </div>

                                {/* Builder Canvas (Scrollable) */}
                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex justify-center bg-slate-100 dark:bg-[#0a0a0a]">
                                    <div className="w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl p-8 relative flex flex-col">
                                        
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                                        {builderBlocks.map((block, index) => (
                                            <div key={block.id} className="group relative border border-transparent hover:border-blue-400 transition-colors">
                                                
                                                {/* Block Actions */}
                                                <div className="absolute -right-10 top-0 hidden group-hover:flex flex-col gap-1 z-20">
                                                    <button onClick={() => moveBlock(index, -1)} className="p-1 bg-slate-200 hover:bg-white rounded shadow text-slate-600"><Move size={12} className="rotate-180" /></button>
                                                    <button onClick={() => moveBlock(index, 1)} className="p-1 bg-slate-200 hover:bg-white rounded shadow text-slate-600"><Move size={12} /></button>
                                                    <button onClick={() => deleteBlock(block.id)} className="p-1 bg-red-100 hover:bg-red-500 hover:text-white rounded shadow text-red-500"><Trash2 size={12} /></button>
                                                </div>

                                                {/* HEADER BLOCK */}
                                                {block.type === 'header' && (
                                                    <div className="flex border-b-2 border-black mb-4 select-none">
                                                        <div className="w-[35%] p-4 flex flex-col items-center justify-center border-r-2 border-black">
                                                            <h1 className="text-3xl font-extrabold text-slate-800">AP<span className="text-teal-600">+</span></h1>
                                                            <div className="text-[10px] font-bold tracking-[0.2em] mt-1 text-slate-600">ASSIST PLUS</div>
                                                        </div>
                                                        <div className="flex-1 p-2 flex items-center justify-center text-center font-bold text-lg text-slate-900">
                                                            Assist Plus Accounting &<br/>Auditing Services
                                                        </div>
                                                    </div>
                                                )}

                                                {/* SECTION TITLE */}
                                                {block.type === 'section_title' && (
                                                    <input 
                                                        value={block.title}
                                                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                                                        className="w-full bg-slate-100 font-extrabold text-[11px] p-1.5 text-center border border-black uppercase outline-none focus:bg-yellow-50 placeholder-slate-500 tracking-wider"
                                                        placeholder="SECTION TITLE"
                                                    />
                                                )}

                                                {/* GRID ROW */}
                                                {block.type === 'grid' && (
                                                    <div className="flex border border-black border-t-0 first:border-t relative">
                                                        {block.columns?.map((col, cIdx) => (
                                                            <div key={cIdx} className="flex-1 flex border-r border-black last:border-r-0 relative group/col">
                                                                {/* Label */}
                                                                <input 
                                                                    value={col.label}
                                                                    onChange={(e) => {
                                                                        const newCols = [...(block.columns || [])];
                                                                        newCols[cIdx].label = e.target.value;
                                                                        updateBlock(block.id, { columns: newCols });
                                                                    }}
                                                                    className="w-[110px] bg-white p-1.5 text-[10px] font-bold border-r border-black outline-none focus:bg-yellow-50 uppercase"
                                                                />
                                                                {/* Variable Selector */}
                                                                <div className="flex-1 relative">
                                                                    <input 
                                                                        value={col.variable}
                                                                        onChange={(e) => {
                                                                            const newCols = [...(block.columns || [])];
                                                                            newCols[cIdx].variable = e.target.value;
                                                                            updateBlock(block.id, { columns: newCols });
                                                                        }}
                                                                        className="w-full h-full p-1.5 text-[11px] outline-none focus:bg-blue-50 font-mono text-slate-600"
                                                                        placeholder="{{variable}}"
                                                                    />
                                                                    {/* Quick Var Select (Hover) */}
                                                                    <div className="absolute right-0 top-0 bottom-0 hidden group-hover/col:flex items-center pr-1">
                                                                        <select 
                                                                            className="w-4 h-4 opacity-0 absolute inset-0 cursor-pointer"
                                                                            onChange={(e) => {
                                                                                const newCols = [...(block.columns || [])];
                                                                                newCols[cIdx].variable = `{{${e.target.value}}}`;
                                                                                updateBlock(block.id, { columns: newCols });
                                                                            }}
                                                                        >
                                                                            <option value="">Select...</option>
                                                                            <option value="clientName">Client Name</option>
                                                                            <option value="elNumber">Ref No</option>
                                                                            <option value="startDate">Date</option>
                                                                            <option value="amount">Amount</option>
                                                                            {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                                                                        </select>
                                                                        <ChevronDown size={10} className="text-slate-400 pointer-events-none" />
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Remove Column (if > 1) */}
                                                                {block.columns && block.columns.length > 1 && (
                                                                    <button 
                                                                        onClick={() => {
                                                                            const newCols = block.columns?.filter((_, i) => i !== cIdx);
                                                                            updateBlock(block.id, { columns: newCols });
                                                                        }}
                                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/col:opacity-100 z-10"
                                                                    >
                                                                        <X size={8} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        
                                                        {/* Add Column Button */}
                                                        {(block.columns?.length || 0) < 4 && (
                                                            <button 
                                                                onClick={() => updateBlock(block.id, { columns: [...(block.columns || []), { label: 'LABEL', variable: '' }] })}
                                                                className="absolute -right-3 top-1/2 -translate-y-1/2 bg-blue-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 z-10"
                                                                title="Add Column"
                                                            >
                                                                <Columns size={10} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* TEXT BLOCK */}
                                                {block.type === 'text' && (
                                                    <textarea 
                                                        value={block.content}
                                                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                                        className="w-full border border-black border-t-0 p-2 min-h-[60px] text-xs outline-none resize-y focus:bg-slate-50"
                                                        placeholder="Enter static text here..."
                                                    />
                                                )}

                                                {/* DIVIDER BLOCK */}
                                                {block.type === 'divider' && (
                                                    <div className="py-2 border-l border-r border-black px-4">
                                                        <hr className="border-t-2 border-black" />
                                                    </div>
                                                )}

                                                {/* IMAGE BLOCK */}
                                                {block.type === 'image' && (
                                                    <div className="relative border border-black border-t-0 p-2 flex justify-center group/img">
                                                        {block.content ? (
                                                            <img src={block.content} className="max-h-[300px] object-contain" alt="Attached" />
                                                        ) : (
                                                            <div className="w-full h-24 bg-slate-100 flex flex-col items-center justify-center text-slate-400 text-xs gap-2 border-2 border-dashed border-slate-300 rounded">
                                                                <ImageIcon size={24} />
                                                                <span>No Image Selected</span>
                                                            </div>
                                                        )}
                                                        <button 
                                                            onClick={() => {
                                                                setUploadTargetId(block.id);
                                                                fileInputRef.current?.click();
                                                            }}
                                                            className="absolute top-2 right-2 bg-white/80 p-1.5 rounded shadow text-slate-600 hover:text-blue-600 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    </div>
                                                )}

                                            </div>
                                        ))}

                                        {/* Drop Zone / Empty State */}
                                        {builderBlocks.length === 0 && (
                                            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg m-4">
                                                <div className="text-center text-slate-400">
                                                    <LayoutTemplate size={40} className="mx-auto mb-2 opacity-50" />
                                                    <p>Start building your form</p>
                                                    <div className="flex gap-2 justify-center mt-2">
                                                        <button onClick={() => addBlock('header')} className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">Add Header</button>
                                                        <button onClick={() => addBlock('grid')} className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">Add Row</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                                <FileText size={64} className="mb-4 opacity-20" />
                                <p className="text-lg font-medium">Select a template to edit</p>
                                <p className="text-sm opacity-60">or create a new one to use the builder</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Existing "Fields" Tab Logic... */}
            {activeTab === 'fields' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Custom Fields Config</h3>
                        <button onClick={() => { setFieldForm({ id: `f-${Date.now()}`, section: 'Project Details', type: 'text' }); setIsEditingField(true); }} className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-slate-700">
                            <Plus size={16} /> Add Field
                        </button>
                    </div>

                    {isEditingField && (
                        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <input placeholder="Label (e.g. Scope)" value={fieldForm.label || ''} onChange={e => setFieldForm({...fieldForm, label: e.target.value})} className="p-2 border rounded text-sm bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white" />
                                <input placeholder="Key (e.g. scope_of_work)" value={fieldForm.key || ''} onChange={e => setFieldForm({...fieldForm, key: e.target.value.toLowerCase().replace(/\s/g, '_')})} className="p-2 border rounded text-sm font-mono bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white" />
                                <select value={fieldForm.type} onChange={e => setFieldForm({...fieldForm, type: e.target.value as any})} className="p-2 border rounded text-sm bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                                    <option value="text">Text</option>
                                    <option value="textarea">Text Area</option>
                                    <option value="select">Select Dropdown</option>
                                    <option value="date">Date</option>
                                    <option value="checkbox">Checkbox</option>
                                </select>
                                <select value={fieldForm.section} onChange={e => setFieldForm({...fieldForm, section: e.target.value as any})} className="p-2 border rounded text-sm bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                                    <option>Client Info</option>
                                    <option>Project Details</option>
                                    <option>Consultant Info</option>
                                    <option>Financials</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsEditingField(false)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-200 rounded text-sm">Cancel</button>
                                <button onClick={handleSaveField} className="px-4 py-1.5 bg-teal-600 text-white rounded text-sm font-bold">Save Field</button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-3">Label</th>
                                    <th className="px-4 py-3">Key (Variable)</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Section</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {fields.map(f => (
                                    <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{f.label}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{`{{${f.key}}}`}</td>
                                        <td className="px-4 py-3"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">{f.type}</span></td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{f.section}</td>
                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                            <button onClick={() => { setFieldForm(f); setIsEditingField(true); }} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={14} /></button>
                                            <button onClick={() => { 
                                                const updated = fields.filter(field => field.id !== f.id);
                                                setFields(updated);
                                                onUpdateFields(updated);
                                            }} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
