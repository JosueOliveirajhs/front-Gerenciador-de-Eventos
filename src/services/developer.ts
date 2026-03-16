// types/developer.ts

// Categorias baseadas no enum CategoriaEmpresa do backend
export type CategoriaEmpresa = 'Buffet' | 'Decoracao' | 'Fotografia' | 'Outros';

// Interface principal da Empresa (baseada no modelo Empresa.java)
export interface Company {
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

// DTO para criação de empresa (baseado no backend)
export interface CreateCompanyDTO {
  nome: string;
  descricao?: string;
  categoria: CategoriaEmpresa;
  localizacao?: string;
  telefone?: string;
  email?: string;
}

// Resposta da API (igual ao Company, mas explícito)
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

// Filtros para busca
export interface CompanyFilters {
  busca?: string;
  categoria?: string;
}

// Estatísticas calculadas no frontend
export interface CompanyStats {
  total: number;
  porCategoria: Record<CategoriaEmpresa, number>;
  verificadas: number;
  naoVerificadas: number;
  mediaAvaliacoes: number;
}

// Status possíveis (para UI, não existem no backend)
export type CompanyStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELED';

// Planos (existem no backend em User.plan_type)
export type CompanyPlan = 'ESSENCIAL' | 'PROFISSIONAL' | 'PREMIUM' | 'ENTERPRISE';

// Configuração de status para UI
export interface StatusConfig {
  color: string;
  text: string;
  badgeClass: string;
  icon: string;
  description: string;
}

// Configuração de plano para UI
export interface PlanConfig {
  name: string;
  label: string;
  color: string;
  badgeClass: string;
  features: string[];
}

// Estatísticas gerais do dashboard
export interface DashboardStats {
  totalEmpresas: number;
  totalUsuarios: number;
  totalEventos: number;
  totalClientes: number;
  volumeFinanceiro: number;
  empresasPorCategoria: Record<CategoriaEmpresa, number>;
  empresasVerificadas: number;
  empresasNaoVerificadas: number;
}