
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, Blob } from "@google/genai";
import { MessageSquare, X, Send, Sparkles, Bot, User, Loader2, Maximize2, Minimize2, MapPin, Search, Star, CheckCircle2, Paperclip, Mic, ChevronDown, History, MoreHorizontal, Clock, ArrowRight, GripHorizontal, FileText, BarChart2, ShieldAlert, Image as ImageIcon, Trash2, StopCircle, Volume2, MicOff, Zap, Mail, Calendar, Link, ExternalLink, Briefcase, Users } from 'lucide-react';
import { Project, TeamMember } from '../types';

interface ChatbotProps {
  projects: Project[];
  members: TeamMember[];
  onUpdateProject: (project: Project) => void;
  onOpenProject?: (projectId: string) => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  groundingMetadata?: any;
  image?: string;
  relatedProjectId?: string;
  relatedProjectName?: string;
}

interface HistoryItem {
  id: string;
  title: string;
  category: 'Docs' | 'Summaries' | 'Analysis';
  date: string;
}

interface ActiveContext {
    type: 'project' | 'client' | 'member';
    data: any;
    label: string;
}

// Audio Helpers
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: uint8ArrayToBase64(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Visualizer Component ---
const VoiceVisualizer = () => {
    return (
        <div className="relative flex items-center justify-center w-64 h-64">
            {/* Core */}
            <div className="absolute w-24 h-24 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-full blur-md animate-pulse z-20 shadow-[0_0_30px_rgba(99,102,241,0.6)]"></div>
            
            {/* Spinning Rings */}
            <div className="absolute w-40 h-40 border-2 border-purple-500/30 rounded-[40%] animate-[spin_4s_linear_infinite] z-10"></div>
            <div className="absolute w-44 h-44 border-2 border-indigo-500/20 rounded-[45%] animate-[spin_6s_linear_infinite_reverse] z-10"></div>
            
            {/* Waveform Bars (Simulated) */}
            <div className="absolute inset-0 flex items-center justify-center gap-1 z-0 opacity-50">
                {[...Array(12)].map((_, i) => (
                    <div 
                        key={i} 
                        className="w-1.5 bg-indigo-400 rounded-full animate-waveform"
                        style={{ 
                            height: '40px',
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '1.2s'
                        }}
                    ></div>
                ))}
            </div>
            
            <style>{`
                @keyframes waveform {
                    0%, 100% { height: 20px; opacity: 0.3; }
                    50% { height: 100px; opacity: 1; }
                }
            `}</style>
        </div>
    );
};

// Custom Animated Assist+ Icon
const AssistPlusIcon = ({ compact = false }: { compact?: boolean }) => (
  <div className={`relative flex items-center justify-center group ${compact ? 'w-24 h-24' : 'w-32 h-32'}`}>
    <div className="absolute inset-0 border-2 border-teal-500/20 rounded-full animate-[spin_10s_linear_infinite] group-hover:border-teal-500/40 transition-colors"></div>
    <div className="absolute inset-4 border-2 border-dashed border-slate-700 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
    <svg viewBox="0 0 100 100" className={`${compact ? 'w-12 h-12' : 'w-20 h-20'} drop-shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all duration-500`}>
      <line x1="50" y1="10" x2="50" y2="90" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
      <line x1="10" y1="50" x2="90" y2="50" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
      <rect x="15" y="15" width="30" height="30" rx="4" fill="#1e293b" className="group-hover:fill-slate-700 transition-colors" />
      <text x="30" y="38" fontSize="20" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="serif">A</text>
      <rect x="55" y="55" width="30" height="30" rx="4" fill="#1e293b" className="group-hover:fill-slate-700 transition-colors" />
      <text x="70" y="78" fontSize="20" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="serif">P</text>
      <path d="M60 40 L70 30 L80 35 L90 20" stroke="#94a3b8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse" />
      <rect x="20" y="65" width="4" height="20" fill="#94a3b8" rx="1" />
      <rect x="28" y="75" width="4" height="10" fill="#94a3b8" rx="1" />
      <rect x="36" y="60" width="4" height="25" fill="#94a3b8" rx="1" />
    </svg>
  </div>
);

export const Chatbot: React.FC<ChatbotProps> = ({ projects, members, onUpdateProject, onOpenProject }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am your Assist+ AI Manager. I can help with project insights, live voice assistance, and more. How can I help?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Context Awareness
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Keep a ref to projects for tool execution
  const projectsRef = useRef(projects);
  useEffect(() => { projectsRef.current = projects; }, [projects]);

  // Dragging State (Window)
  const [position, setPosition] = useState<{ x: number, y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number, startY: number, initialX: number, initialY: number } | null>(null);

  // Sidebar State
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Docs' | 'Summaries'>('All');
  
  // Rate Limiting
  const [cooldown, setCooldown] = useState(0);

  // Live API State
  const [isLive, setIsLive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<{ user: string; model: string }>({ user: '', model: '' });
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const liveSessionRef = useRef<any>(null); // To store the session promise or object
  
  // Attachments
  const [attachment, setAttachment] = useState<{ type: 'image', data: string, mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tools Definition for Live API & Text
  const tools: any[] = [
    { googleMaps: {} },
    {
        functionDeclarations: [
            {
                name: 'create_reminder',
                description: 'Create a reminder for a specific project. Use this when the user asks to set a reminder or follow up.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        projectName: {
                            type: Type.STRING,
                            description: 'The approximate name of the project or client. If context is provided, use that.',
                        },
                        title: {
                            type: Type.STRING,
                            description: 'The content/title of the reminder.',
                        },
                        dueDate: {
                            type: Type.STRING,
                            description: 'The due date for the reminder in YYYY-MM-DD format. If today is mentioned, use today\'s date.',
                        },
                    },
                    required: ['projectName', 'title'],
                },
            },
            {
                name: 'update_project_status',
                description: 'Update the status of a project. Valid statuses are: Lead, Proposal Sent, Proposal Signed, Under Review, Under Process, On Hold, Review Completed, Completed, Cancelled.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        projectName: {
                            type: Type.STRING,
                            description: 'The approximate name of the project or client.',
                        },
                        newStatus: {
                            type: Type.STRING,
                            description: 'The new status for the project.',
                        },
                    },
                    required: ['projectName', 'newStatus'],
                },
            }
        ]
    }
  ];

  // --- TOOL EXECUTION LOGIC ---
  // Returns object with text result AND related project data for UI
  const executeAction = async (name: string, args: any): Promise<{ result: string, relatedProject?: Project }> => {
      const currentProjects = projectsRef.current;
      let { projectName, title, dueDate, newStatus } = args;

      // Context Resolution
      if (activeContext && activeContext.type === 'project' && (!projectName || projectName.toLowerCase().includes('this') || projectName.toLowerCase().includes('current'))) {
          projectName = activeContext.data.clientName;
      }

      // Find Project
      const matchedProject = currentProjects.find(p => 
          p.projectName.toLowerCase().includes(projectName.toLowerCase()) || 
          p.clientName.toLowerCase().includes(projectName.toLowerCase())
      );

      if (!matchedProject) {
          return { result: "Project not found. Please specify the client name." };
      }

      // 1. Create Reminder
      if (name === 'create_reminder') {
          const newReminder = {
              id: `r-${Date.now()}`,
              title: title,
              dueDate: dueDate || new Date().toISOString().split('T')[0],
              isCompleted: false,
              type: 'Internal' as const
          };
          
          const updatedProject = { 
              ...matchedProject, 
              reminders: [...(matchedProject.reminders || []), newReminder] 
          };
          
          onUpdateProject(updatedProject);
          return { 
              result: `Reminder set for ${matchedProject.clientName}: "${title}" on ${newReminder.dueDate}.`,
              relatedProject: updatedProject
          };
      }

      // 2. Update Status
      if (name === 'update_project_status') {
          // Validate Status
          const validStatuses = ['Lead', 'Proposal Sent', 'Proposal Signed', 'Under Review', 'Under Process', 'On Hold', 'Review Completed', 'Completed', 'Cancelled', 'Not Active', 'End'];
          const targetStatus = validStatuses.find(s => s.toLowerCase() === newStatus.toLowerCase());

          if (!targetStatus) {
              return { result: `Invalid status. Valid options are: ${validStatuses.join(', ')}` };
          }

          const updatedProject = {
              ...matchedProject,
              status: targetStatus as any,
              activityLog: [...matchedProject.activityLog, { date: new Date().toISOString().split('T')[0], action: `Status updated to ${targetStatus} by AI`, user: 'AI Assistant' }]
          };

          onUpdateProject(updatedProject);
          return { 
              result: `Project status for ${matchedProject.clientName} updated to ${targetStatus}.`,
              relatedProject: updatedProject
          };
      }

      return { result: "Unknown tool command." };
  };

  // --- MOCK HISTORY ---
  const historyItems: HistoryItem[] = [
      { id: 'h3', title: 'Client Feedback Insights', category: 'Docs', date: '2 days ago' },
      { id: 'h5', title: 'Tax Filing Procedures', category: 'Docs', date: 'Last week' },
      { id: 'h1', title: 'Project Delay Analysis', category: 'Analysis', date: 'Today' },
      { id: 'h2', title: 'Audit vs ICV loads', category: 'Summaries', date: 'Yesterday' },
      { id: 'h4', title: 'Q4 Strategy Draft', category: 'Summaries', date: 'Last week' },
  ];

  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isExpanded, liveTranscript]);

  useEffect(() => {
    if (cooldown > 0) {
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (isOpen && position === null) {
        const initialX = window.innerWidth / 2 - 225; 
        const initialY = window.innerHeight / 2 - 300;
        setPosition({ x: Math.max(20, initialX), y: Math.max(20, initialY) });
    }
  }, [isOpen]);

  // --- Drop Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
  };

  const handleDragLeave = () => {
      setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      const projectData = e.dataTransfer.getData('project');
      const clientData = e.dataTransfer.getData('client');
      const memberData = e.dataTransfer.getData('member');

      if (projectData) {
          try {
              const data = JSON.parse(projectData);
              setActiveContext({ type: 'project', data: data, label: data.clientName || 'Project' });
              setIsOpen(true);
          } catch (err) {
              console.error("Failed to parse dropped project", err);
          }
      } else if (clientData) {
          try {
              const data = JSON.parse(clientData);
              setActiveContext({ type: 'client', data: data, label: data.clientName || 'Client' });
              setIsOpen(true);
          } catch (err) {
              console.error("Failed to parse dropped client", err);
          }
      } else if (memberData) {
          try {
              const data = JSON.parse(memberData);
              setActiveContext({ type: 'member', data: data, label: data.name || 'Team Member' });
              setIsOpen(true);
          } catch (err) {
              console.error("Failed to parse dropped member", err);
          }
      }
  };

  // --- Live API Logic ---
  const startLiveSession = async () => {
      if (isLive) {
          // Stop session
          liveSessionRef.current?.then((session: any) => session.close());
          audioStream?.getTracks().forEach(track => track.stop());
          setIsLive(false);
          setLiveTranscript({ user: '', model: '' });
          return;
      }

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setAudioStream(stream);
          setIsLive(true);

          let nextStartTime = 0;
          const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          
          // Resume AudioContext if suspended (Browser policy)
          await outputAudioContext.resume();

          const outputNode = outputAudioContext.createGain();
          outputNode.connect(outputAudioContext.destination); // Ensure output connects to speakers
          const sources = new Set<AudioBufferSourceNode>();

          // Prepare Context Data for System Instruction
          const systemInstruction = `
            You are a helpful and efficient Project Management Assistant for Assist+ (S++).
            Current Date: ${new Date().toISOString().split('T')[0]}.
            
            IMPORTANT: You must ALWAYS speak and respond in English, regardless of the user's accent or input language.
            
            ${activeContext ? `ACTIVE CONTEXT (${activeContext.type.toUpperCase()}): ${JSON.stringify(activeContext.data)}. User refers to this as "this ${activeContext.type}".` : ''}

            PROJECTS: ${JSON.stringify(projects.map(p => ({ id: p.id, name: p.projectName, client: p.clientName })), null, 2)}
            MEMBERS: ${JSON.stringify(members.map(m => m.name), null, 2)}
            
            Can perform: create_reminder, update_project_status.
            Keep responses concise and spoken-friendly.
          `;

          const sessionPromise = ai.live.connect({
              model: 'gemini-2.5-flash-native-audio-preview-09-2025',
              callbacks: {
                  onopen: () => {
                      console.log('Live Session Opened');
                      const source = inputAudioContext.createMediaStreamSource(stream);
                      const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                      
                      scriptProcessor.onaudioprocess = (e) => {
                          const inputData = e.inputBuffer.getChannelData(0);
                          const pcmBlob = createBlob(inputData);
                          sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                      };
                      
                      source.connect(scriptProcessor);
                      scriptProcessor.connect(inputAudioContext.destination);
                  },
                  onmessage: async (msg: LiveServerMessage) => {
                      // 1. Audio Output
                      const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                      if (audioData) {
                          nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                          const buffer = await decodeAudioData(
                              base64ToUint8Array(audioData),
                              outputAudioContext,
                              24000,
                              1
                          );
                          const source = outputAudioContext.createBufferSource();
                          source.buffer = buffer;
                          source.connect(outputNode);
                          source.addEventListener('ended', () => sources.delete(source));
                          source.start(nextStartTime);
                          nextStartTime += buffer.duration;
                          sources.add(source);
                      }

                      // 2. Transcription
                      if (msg.serverContent?.outputTranscription) {
                          setLiveTranscript(prev => ({ ...prev, model: prev.model + msg.serverContent?.outputTranscription?.text }));
                      } else if (msg.serverContent?.inputTranscription) {
                          setLiveTranscript(prev => ({ ...prev, user: prev.user + msg.serverContent?.inputTranscription?.text }));
                      }

                      // 3. Tool Calls
                      if (msg.toolCall) {
                          for (const fc of msg.toolCall.functionCalls) {
                              // We just discard the project metadata in voice mode for simplicity, 
                              // or we could trigger a toast. For now, just execute logic.
                              const { result } = await executeAction(fc.name, fc.args);
                              
                              sessionPromise.then(session => session.sendToolResponse({
                                  functionResponses: {
                                      id: fc.id,
                                      name: fc.name,
                                      response: { result }
                                  }
                              }));
                          }
                      }

                      // 4. Interruption
                      if (msg.serverContent?.interrupted) {
                          sources.forEach(s => { s.stop(); sources.delete(s); });
                          nextStartTime = 0;
                      }
                  },
                  onclose: () => {
                      console.log('Live Session Closed');
                      setIsLive(false);
                  },
                  onerror: (e) => {
                      console.error('Live API Error', e);
                      setIsLive(false);
                  }
              },
              config: {
                  responseModalities: [Modality.AUDIO],
                  systemInstruction: systemInstruction,
                  tools: tools,
                  inputAudioTranscription: {},
                  outputAudioTranscription: {}
              }
          });
          
          liveSessionRef.current = sessionPromise;

      } catch (err) {
          console.error("Microphone Error:", err);
          alert("Could not access microphone. Please allow permissions.");
          setIsLive(false);
      }
  };

  // --- Drag Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (position) {
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y
        };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        
        setPosition({
            x: dragRef.current.initialX + dx,
            y: dragRef.current.initialY + dy
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // --- Standard Chat Logic ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  const base64String = event.target.result as string;
                  setAttachment({
                      type: 'image',
                      data: base64String.split(',')[1],
                      mimeType: file.type
                  });
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSend = async (manualInput?: string) => {
    if (isLoading || cooldown > 0) return;

    const textToSend = manualInput || input;
    if (!textToSend.trim() && !attachment && !activeContext) return;

    if (!manualInput) {
        setInput('');
        setAttachment(null);
    }
    
    const newUserMsg: ChatMessage = { role: 'user', text: textToSend };
    if (attachment && attachment.type === 'image') {
        newUserMsg.image = attachment.data;
    }
    
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);
    setCooldown(5); 

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Use gemini-2.5-flash for text, 3-pro for image logic if complex
        const model = attachment ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
        
        const systemInstruction = `
          You are an intelligent Project Management Assistant.
          ${activeContext ? `ACTIVE CONTEXT (${activeContext.type.toUpperCase()}): ${JSON.stringify(activeContext.data)}. User refers to this as "this ${activeContext.type}".` : ''}
          PROJECTS: ${JSON.stringify(projects.map(p => ({ project: p.projectName, status: p.status, client: p.clientName })), null, 2)}
        `;

        const historyContents = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        const currentParts: any[] = [];
        if (attachment) {
            currentParts.push({
                inlineData: {
                    mimeType: attachment.mimeType,
                    data: attachment.data
                }
            });
        }
        if (textToSend) currentParts.push({ text: textToSend });

        const config: any = {
            systemInstruction,
            tools: tools
        };

        const response = await ai.models.generateContent({
          model: model,
          contents: [...historyContents, { role: 'user', parts: currentParts }],
          config: config
        });

        // 1. Check Function Calls
        const calls = response.functionCalls;
        if (calls && calls.length > 0) {
            const call = calls[0];
            const { result, relatedProject } = await executeAction(call.name, call.args);
            
            // 2. Send Result Back for Confirmation Text
            const confirmationResponse = await ai.models.generateContent({
                model: model,
                contents: [
                    ...historyContents,
                    { role: 'user', parts: currentParts },
                    { role: 'model', parts: [{ functionCall: call }] },
                    { role: 'user', parts: [{ functionResponse: { name: call.name, response: { result: result } } }] }
                ],
                config: config
            });
            
            const text = confirmationResponse.text || "Action completed successfully.";
            setMessages(prev => [...prev, { 
                role: 'model', 
                text: text,
                relatedProjectId: relatedProject?.id,
                relatedProjectName: relatedProject?.projectName 
            }]);
        } else {
            // Standard Text Response
            const text = response.text || "I processed that.";
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            setMessages(prev => [...prev, { role: 'model', text: text, groundingMetadata }]);
        }

    } catch (error) {
        console.error("Gemini Error:", error);
        setMessages(prev => [...prev, { role: 'model', text: "Connection error." }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLoadHistory = (item: HistoryItem) => {
      if (item.title === 'Project Delay Analysis') {
          handleSend("Analyze the current projects for delays. Identify SLA breaches.");
      } else {
          setInput(`Tell me about ${item.title}`);
      }
  };

  const filteredHistory = historyItems.filter(item => {
      if (historyFilter === 'All') return true;
      return item.category === historyFilter;
  });

  const suggestions = [
    { icon: Clock, label: 'Set Reminder', action: 'Remind me to follow up on [Project] tomorrow.', color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { icon: ShieldAlert, label: 'Analyze Risks', action: 'Which projects are at risk of SLA breach?', color: 'text-red-400', bg: 'bg-red-400/10' },
    { icon: Mail, label: 'Draft Email', action: 'Draft a payment follow-up email for [Client].', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { icon: BarChart2, label: 'Weekly Summary', action: 'Summarize the team performance for this week.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  const quickCapabilities = ['Summarize', 'Keyinsights', 'Compare', 'Drafts', 'Search'];

  return (
    <>
      {/* Floating Toggle Button with Drop Zone */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 group border border-slate-700 ${isDragOver ? 'bg-teal-600 scale-125' : 'bg-slate-900 hover:bg-teal-600 hover:scale-105'} text-white`}
        >
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></div>
          <Bot size={28} className={`transition-transform ${isDragOver ? 'animate-bounce' : 'group-hover:rotate-12'}`} />
          {isDragOver && <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-xs whitespace-nowrap">Drop Item Here</span>}
        </button>
      )}

      {/* Main Window */}
      {isOpen && position && (
        <div 
            className={`fixed z-[100] shadow-2xl rounded-[32px] border bg-[#09090b] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isDragOver ? 'border-teal-500 ring-2 ring-teal-500/50' : 'border-[#27272a]'}`}
            style={{ 
                left: position.x, 
                top: position.y,
                width: isExpanded ? '1100px' : '450px',
                height: isExpanded ? '800px' : '650px',
                maxHeight: '90vh',
                maxWidth: '95vw',
                transition: isDragging ? 'none' : 'width 0.3s ease, height 0.3s ease' 
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragOver && (
                <div className="absolute inset-0 bg-teal-900/50 z-[110] flex items-center justify-center backdrop-blur-sm">
                    <div className="text-white text-center">
                        <Link size={48} className="mx-auto mb-2 animate-bounce" />
                        <h3 className="text-xl font-bold">Drop to Set Context</h3>
                        <p className="text-sm opacity-80">Drag projects, clients, or members here.</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div 
                className="h-14 bg-[#09090b] border-b border-[#27272a] flex items-center justify-between px-6 cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2 text-slate-400">
                    <GripHorizontal size={20} />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {isLive ? <span className="text-red-500 flex items-center gap-1 animate-pulse"><Volume2 size={12}/> LIVE VOICE MODE</span> : (isExpanded ? 'AI Manager Pro' : 'AI Assistant')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-[#27272a] rounded-full text-slate-400 hover:text-white transition-colors">
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-900/30 hover:text-red-400 rounded-full text-slate-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 flex flex-col p-6 relative overflow-hidden bg-[#09090b]">
                    
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative pr-2 pb-24">
                        {isLive ? (
                            // LIVE MODE UI
                            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in">
                                <VoiceVisualizer />
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-bold text-white">Listening...</h3>
                                    <p className="text-sm text-slate-400">Speak naturally (English only).</p>
                                    {activeContext && (
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <span className="text-xs bg-teal-900/50 text-teal-400 px-2 py-1 rounded border border-teal-800">Context: {activeContext.label}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Live Transcript */}
                                <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-xl p-4 min-h-[100px] flex flex-col gap-2 shadow-inner">
                                    {liveTranscript.user && (
                                        <p className="text-sm text-slate-300 transition-opacity duration-300"><span className="text-slate-500 font-bold">You:</span> {liveTranscript.user}</p>
                                    )}
                                    {liveTranscript.model && (
                                        <p className="text-sm text-teal-400 transition-opacity duration-300"><span className="text-teal-600 font-bold">AI:</span> {liveTranscript.model}</p>
                                    )}
                                    {!liveTranscript.user && !liveTranscript.model && (
                                        <p className="text-xs text-slate-600 italic text-center mt-4">Transcript will appear here...</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // STANDARD CHAT UI
                            <div className="space-y-6 pb-4 h-full flex flex-col">
                                {messages.length === 1 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
                                        
                                        {/* 1. Greeting & Capabilities */}
                                        <div className="mb-6 space-y-4 flex-shrink-0">
                                            <div>
                                                <h1 className={`${isExpanded ? 'text-2xl' : 'text-xl'} font-medium text-white tracking-tight`}>{getGreeting()}, Team!</h1>
                                                <p className="text-slate-400 text-sm font-light">What would you like to explore?</p>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                {quickCapabilities.map(cap => (
                                                    <button 
                                                        key={cap}
                                                        onClick={() => setInput(cap)}
                                                        className="px-3 py-1.5 rounded-full bg-[#18181b] border border-[#27272a] text-[11px] font-medium text-slate-300 hover:bg-[#27272a] hover:text-white transition-all hover:border-slate-600"
                                                    >
                                                        {cap}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 2. Hero Card (Middle) */}
                                        <div className="relative p-8 bg-[#121214] border border-[#27272a] rounded-3xl overflow-hidden group hover:border-[#3f3f46] transition-colors flex-shrink-0 min-h-[220px] flex flex-col justify-center">
                                            {/* Background Glow */}
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                                            {/* Content Layer (Left) */}
                                            <div className="relative z-10 max-w-[60%] space-y-6">
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-light text-slate-400">Ask something about your</h3>
                                                    <h3 className="text-2xl font-bold text-white leading-tight">workspace or documents</h3>
                                                </div>
                                                
                                                <div className="relative group/input">
                                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover/input:opacity-100 transition duration-500"></div>
                                                    <input 
                                                        type="text" 
                                                        placeholder='"Generate a one page summary..."' 
                                                        disabled 
                                                        className="relative w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-slate-500 italic cursor-not-allowed pointer-events-none"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-600 font-mono">... Wait a minute</p>
                                            </div>
                                            
                                            {/* Logo Layer (Right - Background) */}
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[40%] h-full flex items-center justify-center z-0 opacity-80 pointer-events-none">
                                                <div className="scale-125 transform transition-transform duration-700 group-hover:scale-110">
                                                    <AssistPlusIcon />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. Suggestions (Bottom) */}
                                        <div className="mt-auto pt-6 grid grid-cols-2 gap-3 flex-shrink-0">
                                            {suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setInput(s.action)}
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-[#18181b] border border-[#27272a] hover:bg-[#202023] hover:border-slate-700 transition-all text-left group"
                                                >
                                                    <div className={`p-2.5 rounded-lg ${s.bg} ${s.color} group-hover:scale-110 transition-transform`}>
                                                        <s.icon size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="block text-sm font-medium text-slate-200 truncate">{s.label}</span>
                                                        <span className="block text-[10px] text-slate-500 truncate opacity-70 group-hover:opacity-100">Try: "{s.action}"</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* MESSAGES RENDER */}
                                {messages.map((msg, idx) => (
                                    // Skip first message if it's the welcome message (since we show hero state instead)
                                    (idx === 0 && messages.length === 1) ? null :
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-[#27272a] text-white' : 'bg-transparent text-slate-300'}`}>
                                            {msg.role === 'model' && <div className="flex items-center gap-2 mb-2 text-teal-400 font-bold text-[10px] uppercase tracking-wider"><Sparkles size={10}/> AI Manager</div>}
                                            {msg.image && (
                                                <div className="mb-3">
                                                    <img src={`data:image/png;base64,${msg.image}`} alt="Upload" className="max-w-full rounded-lg max-h-48 border border-white/10" />
                                                </div>
                                            )}
                                            <div className="whitespace-pre-wrap leading-relaxed text-sm">{msg.text}</div>
                                            {/* Reference Link for Tool Execution */}
                                            {msg.relatedProjectId && onOpenProject && (
                                                <div className="mt-3">
                                                    <button 
                                                        onClick={() => onOpenProject(msg.relatedProjectId!)}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-teal-900/30 border border-teal-800 rounded-lg hover:bg-teal-900/50 transition-colors group"
                                                    >
                                                        <ExternalLink size={12} className="text-teal-400 group-hover:text-white" />
                                                        <span className="text-xs font-bold text-teal-400 group-hover:text-white">
                                                            View Reference: {msg.relatedProjectName || 'Project'}
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                            {msg.groundingMetadata?.groundingChunks && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                                                        <a key={i} href={chunk.web?.uri} target="_blank" className="text-[10px] bg-black/30 border border-white/10 px-2 py-1 rounded text-blue-400 truncate max-w-[150px] flex items-center gap-1 hover:bg-white/5">
                                                            <Search size={8} /> {chunk.web?.title || 'Source'}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && <div className="text-slate-500 text-xs animate-pulse pl-4">Thinking...</div>}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Active Context Indicator */}
                    {activeContext && (
                        <div className="absolute bottom-[4.5rem] left-6 right-6 flex items-center">
                            <div className="bg-teal-900/30 border border-teal-800 text-teal-400 px-3 py-1.5 rounded-full text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                                {activeContext.type === 'project' ? <FileText size={12} /> : activeContext.type === 'client' ? <Briefcase size={12} /> : <Users size={12} />}
                                <span className="font-bold truncate max-w-[200px]">Context: {activeContext.label}</span>
                                <button onClick={() => setActiveContext(null)} className="hover:text-white"><X size={12} /></button>
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="absolute bottom-6 left-6 right-6">
                        {attachment && (
                            <div className="absolute bottom-full mb-2 left-0 bg-[#18181b] border border-[#27272a] p-2 rounded-xl flex items-center gap-2">
                                <div className="relative"><img src={`data:${attachment.mimeType};base64,${attachment.data}`} alt="Preview" className="w-12 h-12 object-cover rounded-lg" /></div>
                                <button onClick={() => setAttachment(null)} className="p-1 hover:bg-white/10 rounded-full ml-2"><X size={14} className="text-slate-400" /></button>
                            </div>
                        )}

                        <div className="relative flex items-center bg-[#18181b] border border-[#27272a] rounded-2xl p-1.5 pl-4 shadow-xl focus-within:border-slate-600 transition-colors">
                            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                            
                            {isLive ? (
                                <div className="flex-1 flex items-center justify-center h-9">
                                    <button 
                                        onClick={startLiveSession}
                                        className="bg-red-500/20 text-red-500 hover:bg-red-500/30 px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-all border border-red-500/50"
                                    >
                                        <StopCircle size={16} /> End Voice Session
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {isExpanded && (
                                        <div className="flex gap-2 text-slate-400 mr-2 border-r border-[#27272a] pr-2 py-1">
                                            <button onClick={() => fileInputRef.current?.click()} className="hover:text-white transition-colors rotate-45"><Paperclip size={16} /></button>
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={activeContext ? "Ask about this context..." : "Ask AI..."}
                                        className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none h-9 disabled:opacity-50"
                                        disabled={isLoading || cooldown > 0}
                                    />
                                    <div className="flex items-center gap-2 ml-1">
                                        <button 
                                            onClick={startLiveSession}
                                            className={`p-2 rounded-xl transition-all ${isLive ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} 
                                            disabled={isLoading || cooldown > 0}
                                            title="Start Voice Chat"
                                        >
                                            <Mic size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleSend()}
                                            disabled={(!input.trim() && !attachment) || isLoading || cooldown > 0}
                                            className={`px-4 py-2 text-white rounded-xl font-medium text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${cooldown > 0 ? 'bg-slate-700 text-slate-400' : 'bg-[#6366f1] hover:bg-[#4f46e5]'}`}
                                        >
                                            {cooldown > 0 ? `${cooldown}s` : 'Send'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                </div>

                {/* Sidebar (Expanded) */}
                {isExpanded && (
                    <div className="w-[350px] border-l border-[#27272a] bg-[#09090b] p-6 flex flex-col h-full animate-in slide-in-from-right duration-300">
                        <div className="flex items-center gap-2 text-slate-400 mb-6">
                            <History size={16} />
                            <h3 className="text-base font-medium text-white">Recent conversations</h3>
                        </div>
                        <div className="flex gap-2 mb-6">
                            <button onClick={() => setHistoryFilter('Docs')} className={`flex-1 px-3 py-2 border rounded-lg text-xs transition-all ${historyFilter === 'Docs' ? 'bg-[#27272a] text-white border-slate-600' : 'bg-[#18181b] border-[#27272a] text-slate-300'}`}>Docs</button>
                            <button onClick={() => setHistoryFilter('Summaries')} className={`flex-1 px-3 py-2 border rounded-lg text-xs transition-all ${historyFilter === 'Summaries' ? 'bg-[#27272a] text-white border-slate-600' : 'bg-[#18181b] border-[#27272a] text-slate-300'}`}>Summaries</button>
                        </div>
                        <div className="space-y-4 mb-6 flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {filteredHistory.map((item) => (
                                <div key={item.id} onClick={() => handleLoadHistory(item)} className="group cursor-pointer border-b border-[#18181b] pb-3 last:border-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${item.category === 'Docs' ? 'bg-blue-900/30 text-blue-400' : 'bg-orange-900/30 text-orange-400'}`}>{item.category}</span>
                                        <span className="text-[10px] text-slate-600">{item.date}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 group-hover:text-white transition-colors leading-snug">{item.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </>
  );
};
