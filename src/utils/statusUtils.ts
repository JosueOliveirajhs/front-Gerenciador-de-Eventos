import { CompanyStatus } from '../types/developer';

interface StatusConfig {
  color: string;
  text: string;
  badgeClass: string;
  icon: string;
  description: string;
  actions: string[];
}

export const statusConfigs: Record<CompanyStatus, StatusConfig> = {
  ACTIVE: {
    color: '#10b981',
    text: 'Ativa',
    badgeClass: 'statusActive',
    icon: '✅',
    description: 'Empresa com acesso total à plataforma',
    actions: ['suspender', 'cancelar']
  },
  TRIAL: {
    color: '#f59e0b',
    text: 'Trial',
    badgeClass: 'statusTrial',
    icon: '⏳',
    description: 'Período de teste gratuito',
    actions: ['ativar', 'suspender', 'cancelar']
  },
  SUSPENDED: {
    color: '#ef4444',
    text: 'Suspensa',
    badgeClass: 'statusSuspended',
    icon: '⚠️',
    description: 'Acesso temporariamente bloqueado',
    actions: ['reativar', 'cancelar']
  },
  CANCELED: {
    color: '#6b7280',
    text: 'Cancelada',
    badgeClass: 'statusCanceled',
    icon: '❌',
    description: 'Assinatura encerrada',
    actions: []
  }
};

export const getStatusConfig = (status: CompanyStatus): StatusConfig => {
  return statusConfigs[status];
};

export const getStatusText = (status: CompanyStatus): string => {
  return statusConfigs[status].text;
};

export const getStatusColor = (status: CompanyStatus): string => {
  return statusConfigs[status].color;
};

export const getStatusBadgeClass = (status: CompanyStatus): string => {
  return statusConfigs[status].badgeClass;
};

export const getStatusIcon = (status: CompanyStatus): string => {
  return statusConfigs[status].icon;
};

export const getStatusDescription = (status: CompanyStatus): string => {
  return statusConfigs[status].description;
};

export const getAvailableActions = (status: CompanyStatus): string[] => {
  return statusConfigs[status].actions;
};

export const getNextStatusOptions = (currentStatus: CompanyStatus): CompanyStatus[] => {
  switch (currentStatus) {
    case 'ACTIVE':
      return ['SUSPENDED', 'CANCELED'];
    case 'TRIAL':
      return ['ACTIVE', 'SUSPENDED', 'CANCELED'];
    case 'SUSPENDED':
      return ['ACTIVE', 'CANCELED'];
    case 'CANCELED':
      return [];
    default:
      return [];
  }
};

export const getStatusBadgeStyle = (status: CompanyStatus): React.CSSProperties => {
  return {
    backgroundColor: statusConfigs[status].color + '20', // 20% opacity
    color: statusConfigs[status].color,
    borderColor: statusConfigs[status].color + '40'
  };
};