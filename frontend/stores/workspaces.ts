import { defineStore } from 'pinia'

export type WorkspaceRole = 'owner' | 'editor' | 'viewer'
export interface WorkspaceUser { _id: string; username: string; name?: string; avatar?: { url?: string } }
export interface WorkspaceSummary { _id: string; name: string; description?: string; type: 'personal' | 'team'; owner: WorkspaceUser; role: WorkspaceRole; memberCount: number }
export interface WorkspaceDetail extends Omit<WorkspaceSummary, 'memberCount'> { members: Array<{ user: WorkspaceUser; role: WorkspaceRole; joinedAt: string }> }
export interface WorkspaceInvitation { _id: string; role: 'editor' | 'viewer'; workspace: { _id: string; name: string; type: string }; inviter: WorkspaceUser; createdAt: string }

export const useWorkspacesStore = defineStore('workspaces', {
  state: () => ({ workspaces: [] as WorkspaceSummary[], invitations: [] as WorkspaceInvitation[], activeWorkspaceId: null as string | null, activeWorkspace: null as WorkspaceDetail | null, loading: false }),
  getters: {
    activeSummary: (state) => state.workspaces.find((workspace) => workspace._id === state.activeWorkspaceId) || null,
    activeRole(): WorkspaceRole | null { return this.activeWorkspace?.role || this.activeSummary?.role || null },
    canCreateTodos(): boolean { return this.activeRole === 'owner' || this.activeRole === 'editor' },
  },
  actions: {
    async fetchWorkspaces() { const config = useRuntimeConfig(); this.loading = true; try { const data = await $fetch<{ workspaces: WorkspaceSummary[] }>(`${config.public.apiBase}/workspaces`, { credentials: 'include' }); this.workspaces = data.workspaces; if (!this.activeWorkspaceId || !data.workspaces.some((item) => item._id === this.activeWorkspaceId)) this.activeWorkspaceId = data.workspaces[0]?._id || null; return data.workspaces } finally { this.loading = false } },
    setActive(id: string) { this.activeWorkspaceId = id; this.activeWorkspace = null },
    async fetchWorkspace(id: string) { const config = useRuntimeConfig(); this.loading = true; try { const data = await $fetch<{ workspace: WorkspaceDetail; role: WorkspaceRole }>(`${config.public.apiBase}/workspaces/${id}`, { credentials: 'include' }); this.activeWorkspace = { ...data.workspace, role: data.role }; this.activeWorkspaceId = id; return this.activeWorkspace } finally { this.loading = false } },
    async createWorkspace(payload: { name: string; description?: string }) { const config = useRuntimeConfig(); const data = await $fetch<{ workspace: WorkspaceSummary }>(`${config.public.apiBase}/workspaces`, { method: 'POST', body: payload, credentials: 'include' }); await this.fetchWorkspaces(); this.setActive(data.workspace._id); return data.workspace },
    async fetchInvitations() { const config = useRuntimeConfig(); const data = await $fetch<{ invitations: WorkspaceInvitation[] }>(`${config.public.apiBase}/workspaces/invitations`, { credentials: 'include' }); this.invitations = data.invitations; return data.invitations },
    async respondToInvitation(id: string, accept: boolean) { const config = useRuntimeConfig(); await $fetch(`${config.public.apiBase}/workspaces/invitations/${id}/${accept ? 'accept' : 'decline'}`, { method: 'POST', credentials: 'include' }); this.invitations = this.invitations.filter((item) => item._id !== id); if (accept) await this.fetchWorkspaces() },
    async inviteMember(workspaceId: string, payload: { email: string; role: 'editor' | 'viewer' }) { const config = useRuntimeConfig(); return $fetch(`${config.public.apiBase}/workspaces/${workspaceId}/invitations`, { method: 'POST', body: payload, credentials: 'include' }) },
    async updateMemberRole(workspaceId: string, memberId: string, role: 'editor' | 'viewer') { const config = useRuntimeConfig(); await $fetch(`${config.public.apiBase}/workspaces/${workspaceId}/members/${memberId}`, { method: 'PATCH', body: { role }, credentials: 'include' }); await this.fetchWorkspace(workspaceId) },
    async removeMember(workspaceId: string, memberId: string) { const config = useRuntimeConfig(); await $fetch(`${config.public.apiBase}/workspaces/${workspaceId}/members/${memberId}`, { method: 'DELETE', credentials: 'include' }); await this.fetchWorkspace(workspaceId) },
  },
})
