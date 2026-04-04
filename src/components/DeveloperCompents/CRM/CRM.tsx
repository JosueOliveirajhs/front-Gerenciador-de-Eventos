// src/pages/developer/CRM.tsx

import React, { useState } from 'react';
import {
  MdAdd,
  MdMoreVert,
  MdRefresh,
  MdAttachMoney,
  MdPerson,
  MdTrendingUp,
} from 'react-icons/md';
import { FaChartLine, FaUsers, FaPercentage } from 'react-icons/fa';
import styles from './CRM.module.css';

interface Lead {
  id: number;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  value: number;
  probability: number;
  source: string;
  assignedTo: string;
  lastContact: string;
  createdAt: string;
  notes?: string;
}

export const CRM: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 1,
      companyName: 'Tech Solutions Ltda',
      contactName: 'João Silva',
      contactEmail: 'joao@techsolutions.com',
      contactPhone: '(11) 98765-4321',
      status: 'qualified',
      value: 15000,
      probability: 60,
      source: 'Website',
      assignedTo: 'Carlos Santos',
      lastContact: '2024-01-15T14:30:00',
      createdAt: '2024-01-10T09:00:00'
    },
    {
      id: 2,
      companyName: 'Construtora Alpha',
      contactName: 'Maria Oliveira',
      contactEmail: 'maria@alpha.com.br',
      contactPhone: '(11) 91234-5678',
      status: 'proposal',
      value: 45000,
      probability: 80,
      source: 'Indicação',
      assignedTo: 'Ana Paula',
      lastContact: '2024-01-14T11:20:00',
      createdAt: '2024-01-05T15:30:00'
    },
    {
      id: 3,
      companyName: 'Studio Design',
      contactName: 'Pedro Costa',
      contactEmail: 'pedro@studiodesign.com',
      contactPhone: '(11) 99876-5432',
      status: 'new',
      value: 8000,
      probability: 20,
      source: 'LinkedIn',
      assignedTo: 'Carlos Santos',
      lastContact: '2024-01-16T09:15:00',
      createdAt: '2024-01-16T09:00:00'
    }
  ]);

  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(leads);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const pipelineStages = [
    { id: 'new', name: 'Novo', color: '#3b82f6' },
    { id: 'contacted', name: 'Contatado', color: '#8b5cf6' },
    { id: 'qualified', name: 'Qualificado', color: '#f59e0b' },
    { id: 'proposal', name: 'Proposta', color: '#ec4899' },
    { id: 'negotiation', name: 'Negociação', color: '#10b981' },
    { id: 'won', name: 'Ganho', color: '#059669' },
    { id: 'lost', name: 'Perdido', color: '#dc2626' }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    const stage = pipelineStages.find(s => s.id === status);
    return stage?.color || '#94a3b8';
  };

  const getStatusName = (status: string) => {
    const stage = pipelineStages.find(s => s.id === status);
    return stage?.name || status;
  };

  const totalPipelineValue = leads
    .filter(l => l.status !== 'lost')
    .reduce((sum, l) => sum + l.value, 0);

  const weightedPipelineValue = leads
    .filter(l => l.status !== 'lost')
    .reduce((sum, l) => sum + (l.value * l.probability / 100), 0);

  const wonLeads = leads.filter(l => l.status === 'won').length;
  const lostLeads = leads.filter(l => l.status === 'lost').length;
  const conversionRate = leads.length > 0 ? (wonLeads / leads.length) * 100 : 0;

  return (
    <div className={styles.crm}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <FaChartLine />
            CRM Comercial
          </h1>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.primaryButton}
            onClick={() => {
              setEditingLead(null);
              setShowLeadModal(true);
            }}
          >
            <MdAdd />
            Novo Lead
          </button>
          <button className={styles.refreshButton}>
            <MdRefresh />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <MdAttachMoney />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Pipeline Total</span>
            <span className={styles.kpiValue}>{formatCurrency(totalPipelineValue)}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FaPercentage />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Pipeline Ponderado</span>
            <span className={styles.kpiValue}>{formatCurrency(weightedPipelineValue)}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FaUsers />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Leads</span>
            <span className={styles.kpiValue}>{leads.length}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <MdTrendingUp />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Conversão</span>
            <span className={styles.kpiValue}>{conversionRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className={styles.pipeline}>
        {pipelineStages.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage.id);
          const stageValue = stageLeads.reduce((sum, l) => sum + l.value, 0);

          return (
            <div key={stage.id} className={styles.pipelineColumn}>
              <div className={styles.columnHeader} style={{ borderColor: stage.color }}>
                <h3>{stage.name}</h3>
                <span className={styles.columnCount}>{stageLeads.length}</span>
                <span className={styles.columnValue}>{formatCurrency(stageValue)}</span>
              </div>

              <div className={styles.columnContent}>
                {stageLeads.map(lead => (
                  <div key={lead.id} className={styles.leadCard}>
                    <div className={styles.leadHeader}>
                      <strong>{lead.companyName}</strong>
                      <button className={styles.leadMenu}>
                        <MdMoreVert />
                      </button>
                    </div>

                    <div className={styles.leadContact}>
                      <MdPerson />
                      <span>{lead.contactName}</span>
                    </div>

                    <div className={styles.leadValue}>
                      <span>Valor: {formatCurrency(lead.value)}</span>
                      <span className={styles.leadProbability}>
                        {lead.probability}%
                      </span>
                    </div>

                    <div className={styles.leadFooter}>
                      <span className={styles.leadSource}>{lead.source}</span>
                      <span className={styles.leadDate}>
                        {formatDate(lead.lastContact)}
                      </span>
                    </div>
                  </div>
                ))}

                {stageLeads.length === 0 && (
                  <div className={styles.emptyColumn}>
                    <p>Nenhum lead</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};