// types/developer.ts

// ==================== ORGANIZATION (Empresas Assinantes) ====================

// Planos disponíveis (baseado no enum PlanType)
export type PlanType = 'ESSENCIAL' | 'PROFISSIONAL' | 'PREMIUM' | 'ENTERPRISE';

// Status possíveis da organização
export type OrgStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';

// Interface principal da Organization
export interface Organization {
  id: number;
  name: string;
  cnpj?: string;
  planType: PlanType;
  status: OrgStatus;
  createdAt: string;
  
  // Relacionamentos (opcionais para listagem)
  users?: User[];
  events?: Event[];
}

// DTO para criação/atualização de Organization
export interface CreateOrganizationDTO {
  name: string;
  cnpj?: string;
  planType: PlanType;
  status: OrgStatus;
}

// Resumo da organização (para a aba Resumo)
export interface OrganizationSummary {
  id: number;
  name: string;
  cnpj?: string;
  planType: PlanType;
  status: OrgStatus;
  createdAt: string;
  
  // Métricas
  totalUsers: number;
  totalEvents: number;
  totalClients: number;
  financialVolume: number;
  
  // Últimos eventos
  recentEvents: Event[];
  recentUsers: User[];
}

// Estatísticas gerais de Organizations
export interface OrganizationStats {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  cancelled: number;
  byPlan: Record<PlanType, number>;
  newThisMonth: number;
  mrr: number; // Monthly Recurring Revenue
}

// ==================== EMPRESA (Catálogo de Fornecedores) ====================

// Categorias baseadas no enum CategoriaEmpresa
export type CategoriaEmpresa = 'Buffet' | 'Decoracao' | 'Fotografia' | 'Outros';

// Interface da Empresa (Catálogo)
export interface Empresa {
  id: number;
  nome: string;
  descricao?: string;
  categoria: CategoriaEmpresa;
  avaliacao?: number;
  observacao?: string;
  localizacao?: string;
  telefone?: string;
  email?: string;
  verificado: boolean;
}

// DTO para criação de empresa (catálogo)
export interface CreateEmpresaDTO {
  nome: string;
  descricao?: string;
  categoria: CategoriaEmpresa;
  localizacao?: string;
  telefone?: string;
  email?: string;
}

// Resposta da API (igual ao Empresa)
export interface EmpresaResponse {
  id: number;
  nome: string;
  descricao?: string;
  categoria: CategoriaEmpresa;
  avaliacao?: number;
  observacao?: string;
  localizacao?: string;
  telefone?: string;
  email?: string;
  verificado: boolean;
}

// Estatísticas do catálogo
export interface CatalogoStats {
  total: number;
  porCategoria: Record<CategoriaEmpresa, number>;
  verificadas: number;
  naoVerificadas: number;
  mediaAvaliacoes: number;
}

// Filtros para busca no catálogo
export interface CatalogoFilters {
  busca?: string;
  categoria?: string;
  verificado?: boolean;
  avaliacaoMin?: number;
}

// ==================== COMPARTILHADOS ====================

// Usuário da organização
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastAccess?: string;
  createdAt: string;
}

// Evento da organização
export interface Event {
  id: number;
  title: string;
  type: string;
  date: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  clientCount: number;
  value: number;
}

// Configuração de plano para UI
export interface PlanConfig {
  name: string;
  label: string;
  color: string;
  badgeClass: string;
  features: string[];
  limits: {
    users: number;
    events: number;
    clients: number;
    storage: number; // em GB
  };
}

// Configuração de status para UI
export interface StatusConfig {
  color: string;
  text: string;
  badgeClass: string;
  icon: string;
  description: string;
}