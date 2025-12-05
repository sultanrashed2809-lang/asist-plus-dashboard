
import { Project, TeamMember, ActivityLog, Notification, Status, CalendarEvent } from '../types';
import { MOCK_PROJECTS, TEAM_MEMBERS, MOCK_ACTIVITY_LOGS } from '../constants';

const STORAGE_KEYS = {
  PROJECTS: 'assist_plus_projects',
  MEMBERS: 'assist_plus_members',
  LOGS: 'assist_plus_logs',
  LOGO: 'assist_plus_logo',
  NOTIFICATIONS: 'assist_plus_notifications',
  EVENTS: 'assist_plus_events'
};

// Simulated Network Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class BackendService {
    
    // --- INITIALIZATION ---
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(MOCK_PROJECTS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
            localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(TEAM_MEMBERS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(MOCK_ACTIVITY_LOGS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
            localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
        }
        this.runTriggers(); // Run background jobs on load
    }

    // --- PERMISSIONS ENGINE ---
    private canEditProject(user: TeamMember, project: Project): boolean {
        if (['Super Admin', 'Admin'].includes(user.role)) return true;
        if (user.role === 'Manager') return true; 
        if (user.role === 'Auditor') return project.assignedTo === user.id;
        return false;
    }

    private canChangeStatus(user: TeamMember, currentStatus: Status, newStatus: Status): boolean {
        const role = user.role;
        
        // Super Admin & Admin can do anything
        if (['Super Admin', 'Admin'].includes(role)) return true;

        // Manager Permissions
        if (role === 'Manager') {
            // Managers approve reviews or put things on hold/cancel
            if (currentStatus === 'Under Review' && newStatus === 'Review Completed') return true;
            if (newStatus === 'On Hold' || newStatus === 'Cancelled') return true;
            if (newStatus === 'Under Process') return true; // Revert/Reject
            return false;
        }

        // Auditor Permissions
        if (role === 'Auditor') {
            // Can start process and submit for review
            if (newStatus === 'Under Process') return true;
            if (currentStatus === 'Under Process' && newStatus === 'Under Review') return true;
            if (currentStatus === 'Lead' && newStatus === 'Proposal Sent') return true;
            // Cannot Complete or Cancel directly
            return false;
        }

        return false;
    }

    // --- LOGGING ENGINE ---
    private async logAction(userId: string, userName: string, action: ActivityLog['action'], target: string, details?: string, projectId?: string) {
        const newLog: ActivityLog = {
            id: `log-${Date.now()}`,
            userId,
            userName,
            action,
            target,
            details,
            projectId,
            timestamp: new Date().toISOString()
        };
        const logs = await this.fetchLogs();
        logs.unshift(newLog);
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
        return newLog;
    }

    // --- TRIGGERS & WORKFLOWS ---
    private async runTriggers() {
        const projects = await this.fetchProjects();
        let updates = false;
        const notifications: Notification[] = this.getNotifications();

        projects.forEach(p => {
            if (p.status === 'Completed' || p.status === 'Cancelled') return;

            // 1. Timer Trigger
            const now = new Date();
            const deadline = new Date(p.targetDeadline);
            const diffTime = deadline.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            let newTimerStatus = p.timerStatus;
            if (diffDays < 0) newTimerStatus = 'Late';
            else if (diffDays <= 2) newTimerStatus = 'At Risk';
            else newTimerStatus = 'On Track';

            if (newTimerStatus !== p.timerStatus) {
                p.timerStatus = newTimerStatus;
                updates = true;
                
                // 2. Generate Notification if Late
                if (newTimerStatus === 'Late') {
                    notifications.unshift({
                        id: `n-${Date.now()}-${p.id}`,
                        type: 'High',
                        category: 'Risk',
                        title: 'SLA Breach Detected',
                        message: `Project ${p.projectName} is now OVERDUE. Immediate action required.`,
                        timestamp: 'Just now',
                        read: false,
                        actionUrl: p.id
                    });
                }
            }
        });

        if (updates) {
            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        }
    }

    // --- PUBLIC API METHODS ---

    // PROJECTS
    async fetchProjects(): Promise<Project[]> {
        await delay(300);
        try {
            const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    }

    async createProject(project: Project, user?: TeamMember): Promise<Project> {
        await delay(300);
        const projects = await this.fetchProjects();
        const newProjects = [project, ...projects];
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(newProjects));
        
        if (user) {
            this.logAction(user.id, user.name, 'Create', `Project ${project.projectName}`, 'Created new project');
        }
        return project;
    }

    async updateProject(project: Project, user?: TeamMember, remarks?: string): Promise<Project> {
        await delay(200);
        const projects = await this.fetchProjects();
        const index = projects.findIndex(p => p.id === project.id);
        
        if (index === -1) throw new Error("Project not found");
        const oldProject = projects[index];

        // 1. Permission Check
        if (user && !this.canEditProject(user, oldProject)) {
            throw new Error("Permission Denied: You cannot edit this project.");
        }

        // 2. Workflow Logic
        if (user && oldProject.status !== project.status) {
            // A. Role Check
            if (!this.canChangeStatus(user, oldProject.status, project.status)) {
                throw new Error(`Permission Denied: Role ${user.role} cannot move status from ${oldProject.status} to ${project.status}`);
            }
            
            // B. Mandatory Remarks Enforcement
            const isRejection = (oldProject.status === 'Under Review' && project.status === 'Under Process') ||
                                (oldProject.status === 'Review Completed' && project.status === 'Under Process');
            
            const isCriticalAction = ['On Hold', 'Cancelled'].includes(project.status);

            if ((isRejection || isCriticalAction) && (!remarks || remarks.trim() === '')) {
                 throw new Error("Validation Failed: Mandatory remarks are required for Rejection, Cancellation, or On Hold status.");
            }

            // C. Log Status Change
            const actionType = isRejection ? 'Rejection' : 'Status Change';
            const logDetail = `Changed status to ${project.status}. ${remarks ? `[Remark: ${remarks}]` : ''}`;
            
            this.logAction(
                user.id, 
                user.name, 
                actionType, 
                `Project ${project.projectName}`, 
                logDetail, 
                project.id
            );
        } else if (user) {
            // Log General Edit
            this.logAction(user.id, user.name, 'Edit', `Project ${project.projectName}`, 'Updated project details', project.id);
        }

        // Apply Update
        // If remarks provided during status change, append to internal remarks field if needed, or just keep as separate log
        if (remarks) {
            project.remarks = remarks; // Update main remark field for visibility
        }

        projects[index] = project;
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
        return project;
    }

    async importProjects(newProjects: Project[]): Promise<Project[]> {
        await delay(500);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(newProjects));
        this.logAction('system', 'System', 'Create', 'Bulk Import', `Imported ${newProjects.length} projects`);
        return newProjects;
    }

    // MEMBERS
    async fetchMembers(): Promise<TeamMember[]> {
        await delay(200);
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || '[]');
    }

    async updateMember(member: TeamMember): Promise<TeamMember> {
        await delay(200);
        const members = await this.fetchMembers();
        const index = members.findIndex(m => m.id === member.id);
        if (index !== -1) {
            members[index] = member;
            localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
        }
        return member;
    }

    async addMember(member: TeamMember): Promise<TeamMember> {
        await delay(200);
        const members = await this.fetchMembers();
        members.push(member);
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
        return member;
    }

    async deleteMember(id: string): Promise<void> {
        await delay(200);
        const members = await this.fetchMembers();
        const filtered = members.filter(m => m.id !== id);
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(filtered));
    }

    // CALENDAR EVENTS
    async fetchCalendarEvents(): Promise<CalendarEvent[]> {
        await delay(100);
        const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
        return data ? JSON.parse(data) : [];
    }

    async createCalendarEvent(event: CalendarEvent): Promise<CalendarEvent> {
        await delay(200);
        const events = await this.fetchCalendarEvents();
        events.push(event);
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
        return event;
    }

    // AUTH
    async login(username: string, password: string): Promise<TeamMember | null> {
        await delay(500);
        const members = await this.fetchMembers();
        const user = members.find(m => m.username === username && m.password === password);
        if (user) {
            this.logAction(user.id, user.name, 'Login', 'System');
        }
        return user || null;
    }

    // LOGS & NOTIFICATIONS
    async fetchLogs(): Promise<ActivityLog[]> {
        await delay(100);
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
    }

    getNotifications(): Notification[] {
        const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        return data ? JSON.parse(data) : [];
    }

    async markNotificationRead(id: string): Promise<void> {
        const notifs = this.getNotifications();
        const index = notifs.findIndex(n => n.id === id);
        if (index !== -1) {
            notifs[index].read = true;
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
        }
    }

    // COMPANY SETTINGS
    async fetchCompanyLogo(): Promise<string | null> {
        await delay(100);
        return localStorage.getItem(STORAGE_KEYS.LOGO);
    }

    async updateCompanyLogo(logo: string | null): Promise<void> {
        await delay(200);
        if (logo) localStorage.setItem(STORAGE_KEYS.LOGO, logo);
        else localStorage.removeItem(STORAGE_KEYS.LOGO);
    }
}

export const api = new BackendService();
