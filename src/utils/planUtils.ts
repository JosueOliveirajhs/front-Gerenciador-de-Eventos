import { CompanyPlan, PlanConfig } from '../types/developer';

export const planConfigs: Record<CompanyPlan, PlanConfig> = {
  ESSENCIAL: {
    name: 'ESSENCIAL',
    label: 'Essencial',
    color: '#6b7280',
    badgeClass: 'planEssencial',
    features: [
      'CRM Básico',
      'Financeiro Básico',
      'Fluxo de Eventos Básico',
      'Até 5 usuários',
      'Até 50 eventos/mês'
    ],
    limits: {
      usuarios: 5,
      eventos: 50,
      clientes: 200,
      armazenamento: 10
    }
  },
  PROFISSIONAL: {
    name: 'PROFISSIONAL',
    label: 'Profissional',
    color: '#3b82f6',
    badgeClass: 'planProfissional',
    features: [
      'CRM Avançado',
      'Financeiro Completo',
      'Controle de Estoque',
      'Gestão de Equipe',
      'Dashboard Profissional',
      'Até 15 usuários',
      'Até 200 eventos/mês'
    ],
    limits: {
      usuarios: 15,
      eventos: 200,
      clientes: 1000,
      armazenamento: 50
    }
  },
  PREMIUM: {
    name: 'PREMIUM',
    label: 'Premium',
    color: '#8b5cf6',
    badgeClass: 'planPremium',
    features: [
      'Tudo do Profissional',
      'Portal do Cliente',
      'Dashboard Premium',
      'Relatórios Avançados',
      'Integrações API',
      'Até 30 usuários',
      'Eventos ilimitados'
    ],
    limits: {
      usuarios: 30,
      eventos: -1, // ilimitado
      clientes: -1, // ilimitado
      armazenamento: 200
    }
  },
  ENTERPRISE: {
    name: 'ENTERPRISE',
    label: 'Enterprise',
    color: '#ec4899',
    badgeClass: 'planEnterprise',
    features: [
      'Tudo do Premium',
      'Dashboard Customizado',
      'SLA Prioritário',
      'Gerente de Conta Dedicado',
      'Treinamento Presencial',
      'Usuários ilimitados',
      'Eventos ilimitados'
    ],
    limits: {
      usuarios: -1, // ilimitado
      eventos: -1, // ilimitado
      clientes: -1, // ilimitado
      armazenamento: 1000
    }
  }
};

export const getPlanConfig = (plan: CompanyPlan): PlanConfig => {
  return planConfigs[plan];
};

export const getPlanLabel = (plan: CompanyPlan): string => {
  return planConfigs[plan].label;
};

export const getPlanColor = (plan: CompanyPlan): string => {
  return planConfigs[plan].color;
};

export const getPlanBadgeClass = (plan: CompanyPlan): string => {
  return planConfigs[plan].badgeClass;
};

export const getPlanFeatures = (plan: CompanyPlan): string[] => {
  return planConfigs[plan].features;
};

export const getPlanLimits = (plan: CompanyPlan): PlanConfig['limits'] => {
  return planConfigs[plan].limits;
};

export const getPlanProgress = (
  plan: CompanyPlan,
  current: { usuarios: number; eventos: number; clientes: number; armazenamento: number }
): { usuarios: number; eventos: number; clientes: number; armazenamento: number } => {
  const limits = planConfigs[plan].limits;
  
  return {
    usuarios: limits.usuarios === -1 ? 0 : (current.usuarios / limits.usuarios) * 100,
    eventos: limits.eventos === -1 ? 0 : (current.eventos / limits.eventos) * 100,
    clientes: limits.clientes === -1 ? 0 : (current.clientes / limits.clientes) * 100,
    armazenamento: (current.armazenamento / limits.armazenamento) * 100
  };
};

export const getAvailablePlans = (): Array<{ value: CompanyPlan; label: string }> => {
  return [
    { value: 'ESSENCIAL', label: 'Essencial' },
    { value: 'PROFISSIONAL', label: 'Profissional' },
    { value: 'PREMIUM', label: 'Premium' },
    { value: 'ENTERPRISE', label: 'Enterprise' }
  ];
};