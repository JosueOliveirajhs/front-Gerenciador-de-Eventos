import { OrgStatus, StatusConfig } from '../types/developer';

export const statusConfigs: Record<OrgStatus, StatusConfig> = {
  ACTIVE: {
    color: '#10b981',
    text: 'Ativa',
    badgeClass: 'statusActive',
    icon: '✅',
    description: 'Empresa com acesso total à plataforma'
  },
  TRIAL: {
    color: '#f59e0b',
    text: 'Trial',
    badgeClass: 'statusTrial',
    icon: '⏳',
    description: 'Período de teste gratuito'
  },
  SUSPENDED: {
    color: '#ef4444',
    text: 'Suspensa',
    badgeClass: 'statusSuspended',
    icon: '⚠️',
    description: 'Acesso temporariamente bloqueado'
  },
  CANCELLED: {
    color: '#6b7280',
    text: 'Cancelada',
    badgeClass: 'statusCancelled',
    icon: '❌',
    description: 'Assinatura encerrada'
  }
};

export const getStatusConfig = (status: OrgStatus): StatusConfig => {
  return statusConfigs[status];
};

export const getStatusText = (status: OrgStatus): string => {
  return statusConfigs[status].text;
};

export const getStatusColor = (status: OrgStatus): string => {
  return statusConfigs[status].color;
};

export const getStatusBadgeClass = (status: OrgStatus): string => {
  return statusConfigs[status].badgeClass;
};

export const getStatusIcon = (status: OrgStatus): string => {
  return statusConfigs[status].icon;
};

export const getNextStatusOptions = (currentStatus: OrgStatus): OrgStatus[] => {
  switch (currentStatus) {
    case 'ACTIVE':
      return ['SUSPENDED', 'CANCELLED'];
    case 'TRIAL':
      return ['ACTIVE', 'SUSPENDED', 'CANCELLED'];
    case 'SUSPENDED':
      return ['ACTIVE', 'CANCELLED'];
    case 'CANCELLED':
      return [];
    default:
      return [];
  }
};