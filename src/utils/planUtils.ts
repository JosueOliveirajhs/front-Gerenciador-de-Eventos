import { PlanType, PlanConfig } from '../types/developer';

export const planConfigs: Record<PlanType, PlanConfig> = {
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
      users: 5,
      events: 50,
      clients: 200,
      storage: 10
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
      users: 15,
      events: 200,
      clients: 1000,
      storage: 50
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
      users: 30,
      events: -1, // ilimitado
      clients: -1, // ilimitado
      storage: 200
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
      users: -1, // ilimitado
      events: -1, // ilimitado
      clients: -1, // ilimitado
      storage: 1000
    }
  }
};

export const getPlanConfig = (plan: PlanType): PlanConfig => {
  return planConfigs[plan];
};

export const getPlanLabel = (plan: PlanType): string => {
  return planConfigs[plan].label;
};

export const getPlanColor = (plan: PlanType): string => {
  return planConfigs[plan].color;
};

export const getPlanBadgeClass = (plan: PlanType): string => {
  return planConfigs[plan].badgeClass;
};

export const getPlanFeatures = (plan: PlanType): string[] => {
  return planConfigs[plan].features;
};

export const getPlanLimits = (plan: PlanType): PlanConfig['limits'] => {
  return planConfigs[plan].limits;
};

export const getAvailablePlans = (): Array<{ value: PlanType; label: string }> => {
  return [
    { value: 'ESSENCIAL', label: 'Essencial' },
    { value: 'PROFISSIONAL', label: 'Profissional' },
    { value: 'PREMIUM', label: 'Premium' },
    { value: 'ENTERPRISE', label: 'Enterprise' }
  ];
};