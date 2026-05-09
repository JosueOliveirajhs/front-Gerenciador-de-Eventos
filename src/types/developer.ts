// src/types/developer.ts

export interface CreateOrganizationDTO {
  name: string;
  cnpj?: string;
  planType: PlanType;
  status: OrgStatus;
  
  // Dados do administrador principal
  adminName: string;
  adminEmail: string;
  adminCpf: string;
  adminPassword?: string;
}

export interface Organization {
  id: number;
  name: string;
  cnpj?: string;
  planType: PlanType;
  status: OrgStatus;
  createdAt: string;
  updatedAt?: string;
  totalUsuarios?: number;
  totalEventos?: number;
}

export interface OrganizationSummary {
  totalUsers: number;
  totalEvents: number;
  totalClients: number;
  financialVolume: number;
  recentEvents: RecentEvent[];
  recentUsers: RecentUser[];
}

export interface OrganizationStats {
  totalOrganizations: number;
  activeOrganizations: number;
  trialOrganizations: number;
  suspendedOrganizations: number;
  cancelledOrganizations: number;
  totalUsers?: number;
  totalEvents?: number;
  totalRevenue?: number;
  // Campos alternativos
  total?: number;
  active?: number;
  trial?: number;
  suspended?: number;
  cancelled?: number;
}

export interface RecentEvent {
  id: number;
  title: string;
  date: string;
  status: string;
}

export interface RecentUser {
  id: number;
  name: string;
  email: string;
  lastAccess?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  cpf: string;
  role: UserRole;
  status: UserStatus;
  lastAccess?: string;
  createdAt: string;
}

export interface Event {
  id: number;
  title: string;
  type: string;
  date: string;
  status: string;
  clientCount: number;
  value: number;
}

export enum PlanType {
  ESSENCIAL = 'ESSENCIAL',
  PROFISSIONAL = 'PROFISSIONAL',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

export enum OrgStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  DIRECTOR = 'DIRECTOR',
  MANAGER = 'MANAGER',
  ANALYST = 'ANALYST',
  CLIENT = 'CLIENT'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  recentTransactions: Transaction[];
}

export interface Transaction {
  id: number;
  description: string;
  date: string;
  value: number;
  type: 'income' | 'expense';
}

export interface LogEntry {
  id: number;
  action: string;
  timestamp: string;
  details?: string;
  icon?: 'access' | 'event';
}

export interface SupportTicket {
  id: number;
  title: string;
  description: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

export interface UsageData {
  storageUsed: number;
  storageLimit: number;
  storagePercentage: number;
  apiCalls: number;
  apiLimit: number;
  apiPercentage: number;
  activeUsers: number;
  dailyApiCalls: any[];
}