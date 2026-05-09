// src/components/DeveloperCompents/Organizations/OrganizationForm.tsx
import React, { useState, useEffect } from 'react';
import { 
  MdSave,
  MdCancel,
  MdBusiness,
  MdAttachMoney,
  MdError,
  MdArrowBack
} from 'react-icons/md';
import { organizationService } from '../../../services/organization';
import { Organization, CreateOrganizationDTO, PlanType, OrgStatus } from '../../../types/developer';
import { getPlanConfig, getAvailablePlans } from '../../../utils/planUtils';
import { getStatusConfig } from '../../../utils/statusUtils';
import styles from './OrganizationsForm.module.css';

interface OrganizationFormProps {
  organizationId?: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const OrganizationForm: React.FC<OrganizationFormProps> = ({ 
  organizationId, 
  onSuccess, 
  onCancel 
}) => {
  const isEditing = !!organizationId;

  const [formData, setFormData] = useState<CreateOrganizationDTO>({
    name: '',
    cnpj: '',
    planType: 'ESSENCIAL',
    status: 'TRIAL'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const availablePlans = getAvailablePlans();
  const statusOptions: Array<{ value: OrgStatus; label: string }> = [
    { value: 'ACTIVE', label: 'Ativa' },
    { value: 'TRIAL', label: 'Trial' },
    { value: 'SUSPENDED', label: 'Suspensa' },
    { value: 'CANCELLED', label: 'Cancelada' }
  ];

  useEffect(() => {
    if (isEditing) {
      loadOrganization();
    }
  }, [organizationId]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getOrganizationById(organizationId!);
      setFormData({
        name: data.name,
        cnpj: data.cnpj || '',
        planType: data.planType,
        status: data.status
      });
    } catch (error) {
      console.error('❌ Erro ao carregar organização:', error);
      setError('Erro ao carregar dados da organização');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validações
      if (!formData.name.trim()) {
        setError('Nome é obrigatório');
        setLoading(false);
        return;
      }

      if (formData.cnpj && formData.cnpj.replace(/\D/g, '').length !== 14) {
        setError('CNPJ inválido. Deve conter 14 dígitos.');
        setLoading(false);
        return;
      }

      if (isEditing) {
        await organizationService.updateOrganization(organizationId!, formData);
      } else {
        await organizationService.createOrganization(formData);
      }
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (err: any) {
      console.error('❌ Erro ao salvar organização:', err);
      if (err.response?.status === 403) {
        setError('Acesso negado. Você não tem permissão para esta ação.');
      } else if (err.response?.status === 409) {
        setError('Já existe uma organização com este CNPJ.');
      } else {
        setError('Erro ao salvar organização. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 14) {
      return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setFormData(prev => ({ ...prev, cnpj: formatted }));
  };

  if (loading && isEditing) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando organização...</p>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h1>
          <MdBusiness />
          {isEditing ? 'Editar Organização' : 'Nova Organização'}
        </h1>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <MdError />
          {error}
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          Organização {isEditing ? 'atualizada' : 'criada'} com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name">
            <MdBusiness />
            Nome da Organização *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Digite o nome da organização"
            required
            disabled={loading || success}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cnpj">
            CNPJ
          </label>
          <input
            type="text"
            id="cnpj"
            name="cnpj"
            value={formData.cnpj}
            onChange={handleCNPJChange}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            disabled={loading || success}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="planType">
              <MdAttachMoney />
              Plano *
            </label>
            <select
              id="planType"
              name="planType"
              value={formData.planType}
              onChange={handleInputChange}
              required
              disabled={loading || success}
            >
              {availablePlans.map(plan => (
                <option key={plan.value} value={plan.value}>
                  {plan.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="status">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              disabled={loading || success}
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.planType && (
          <div className={styles.planInfo}>
            <h4>Recursos do plano {getPlanConfig(formData.planType).label}:</h4>
            <ul>
              {getPlanConfig(formData.planType).features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={loading || success}
          >
            <MdCancel />
            Cancelar
          </button>
          <button 
            type="submit" 
            className={styles.saveButton}
            disabled={loading || success}
          >
            <MdSave />
            {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};