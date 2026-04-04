// src/components/DeveloperCompents/Organizations/CreateOrganization.tsx
import React, { useState } from 'react';
import {
  MdBusiness,
  MdPerson,
  MdEmail,
  MdBadge,
  MdAttachMoney,
  MdClose,
  MdCheckCircle,
  MdError,
  MdLock,
  MdInfo
} from 'react-icons/md';
import { organizationService } from '../../../services/organization';
import { PlanType, OrgStatus, CreateOrganizationDTO } from '../../../types/developer';
import styles from './CreateOrganization.module.css';

interface CreateOrganizationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateOrganization: React.FC<CreateOrganizationProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<CreateOrganizationDTO & { adminPassword?: string }>({
    name: '',
    cnpj: '',
    planType: PlanType.ESSENCIAL,
    status: OrgStatus.ACTIVE,
    adminName: '',
    adminEmail: '',
    adminCpf: '',
    adminPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdOrg, setCreatedOrg] = useState<{ name: string; adminEmail: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const planOptions = [
    { 
      value: PlanType.ESSENCIAL, 
      label: 'Essencial', 
      price: 'R$ 99/mês',
      features: ['Até 5 usuários', 'Até 100 eventos/mês', 'Suporte básico (48h)', '1 GB de armazenamento']
    },
    { 
      value: PlanType.PROFISSIONAL, 
      label: 'Profissional', 
      price: 'R$ 299/mês',
      features: ['Até 20 usuários', 'Até 500 eventos/mês', 'Suporte prioritário (24h)', '5 GB de armazenamento', 'Relatórios avançados', 'API básica']
    },
    { 
      value: PlanType.PREMIUM, 
      label: 'Premium', 
      price: 'R$ 599/mês',
      features: ['Usuários ilimitados', 'Eventos ilimitados', 'Suporte 24/7', '20 GB de armazenamento', 'API completa', 'White label', 'Dashboard personalizado']
    },
    { 
      value: PlanType.ENTERPRISE, 
      label: 'Enterprise', 
      price: 'Sob consulta',
      features: ['Tudo do Premium', 'Suporte dedicado', 'SLA personalizado', 'Treinamento exclusivo', 'Infraestrutura dedicada', 'Integrações customizadas']
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    // Limpar erro do campo específico
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar erros anteriores
    setError(null);
    setFieldErrors({});
    
    // Validações
    if (!formData.name.trim()) {
      setError('Nome da organização é obrigatório');
      return;
    }

    if (!formData.adminName.trim()) {
      setError('Nome do administrador é obrigatório');
      return;
    }

    if (!formData.adminEmail.trim()) {
      setError('E-mail do administrador é obrigatório');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.adminEmail)) {
      setError('E-mail inválido');
      return;
    }

    if (!formData.adminCpf.trim()) {
      setError('CPF do administrador é obrigatório');
      return;
    }

    const cpfClean = formData.adminCpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      setError('CPF inválido. Deve conter 11 dígitos');
      return;
    }

    if (!formData.adminPassword || formData.adminPassword.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const organizationData: CreateOrganizationDTO = {
        name: formData.name,
        cnpj: formData.cnpj ? formData.cnpj.replace(/\D/g, '') : undefined,
        planType: formData.planType,
        status: formData.status,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminCpf: formData.adminCpf.replace(/\D/g, ''),
        adminPassword: formData.adminPassword
      };

      console.log('📤 Enviando dados:', organizationData);
      
      const response = await organizationService.createOrganization(organizationData);
      
      console.log('✅ Organização criada:', response);
      
      setCreatedOrg({
        name: response.name,
        adminEmail: formData.adminEmail
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
    } catch (err: any) {
      console.error('❌ Erro ao criar organização:', err);
      
      // Tratamento específico para CPF duplicado
      const errorMessage = err.response?.data?.message || err.message || '';
      
      // Verificar se é erro de CPF duplicado
      if (errorMessage.includes('CPF') && 
          (errorMessage.includes('já cadastrado') || 
           errorMessage.includes('Duplicate entry') ||
           errorMessage.includes('UK_7kqluf7wl0oxs7n90fpya03ss'))) {
        
        // Marcar erro específico no campo CPF
        setFieldErrors({
          adminCpf: 'Este CPF já está cadastrado em outra organização. Por favor, utilize outro CPF.'
        });
        
        setError('CPF já cadastrado! Este CPF pertence a outra organização.');
        
        // Rolar para o campo CPF
        const cpfInput = document.getElementById('adminCpf');
        if (cpfInput) {
          cpfInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cpfInput.focus();
        }
        
      } 
      // Verificar se é erro de CNPJ duplicado
      else if (errorMessage.includes('CNPJ') && errorMessage.includes('já cadastrado')) {
        setFieldErrors({
          cnpj: 'Este CNPJ já está cadastrado em outra organização.'
        });
        setError('CNPJ já cadastrado!');
        
        const cnpjInput = document.getElementById('cnpj');
        if (cnpjInput) {
          cnpjInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cnpjInput.focus();
        }
      }
      // Verificar se é erro de e-mail duplicado
      else if (errorMessage.includes('email') && errorMessage.includes('já cadastrado')) {
        setFieldErrors({
          adminEmail: 'Este e-mail já está cadastrado em outra organização.'
        });
        setError('E-mail já cadastrado!');
        
        const emailInput = document.getElementById('adminEmail');
        if (emailInput) {
          emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          emailInput.focus();
        }
      }
      // Tratar outros erros de validação do backend
      else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const fieldErrorMap: { [key: string]: string } = {};
        
        Object.keys(errors).forEach(key => {
          // Mapear nomes dos campos do backend para o frontend
          let frontendField = key;
          if (key === 'adminCpf') frontendField = 'adminCpf';
          if (key === 'adminEmail') frontendField = 'adminEmail';
          if (key === 'adminName') frontendField = 'adminName';
          if (key === 'name') frontendField = 'name';
          if (key === 'cnpj') frontendField = 'cnpj';
          
          fieldErrorMap[frontendField] = Array.isArray(errors[key]) 
            ? errors[key].join(', ') 
            : errors[key];
        });
        
        setFieldErrors(fieldErrorMap);
        
        const errorMessages = Object.values(fieldErrorMap).join(', ');
        setError(errorMessages);
        
      } else {
        setError('Erro ao criar organização. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return cleaned.replace(/^(\d{2})(\d)/, '$1.$2');
    if (cleaned.length <= 8) return cleaned.replace(/^(\d{2})(\d{3})(\d)/, '$1.$2.$3');
    if (cleaned.length <= 12) return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d)/, '$1.$2.$3/$4');
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return cleaned.replace(/^(\d{3})(\d)/, '$1.$2');
    if (cleaned.length <= 9) return cleaned.replace(/^(\d{3})(\d{3})(\d)/, '$1.$2.$3');
    return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setFormData(prev => ({ ...prev, cnpj: formatted }));
    if (fieldErrors.cnpj) {
      setFieldErrors(prev => ({ ...prev, cnpj: '' }));
    }
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({ ...prev, adminCpf: formatted }));
    if (fieldErrors.adminCpf) {
      setFieldErrors(prev => ({ ...prev, adminCpf: '' }));
    }
  };

  const getSelectedPlan = () => {
    return planOptions.find(p => p.value === formData.planType);
  };

  if (success) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.successContainer}>
          <MdCheckCircle size={64} className={styles.successIcon} />
          <h2>Organização criada com sucesso!</h2>
          <p>
            A organização <strong>{createdOrg?.name}</strong> foi criada.<br />
            O administrador <strong>{createdOrg?.adminEmail}</strong> já pode acessar o sistema.
          </p>
          <div className={styles.successInfo}>
            <MdInfo size={20} />
            <span>Um e-mail de confirmação será enviado em breve.</span>
          </div>
          <button onClick={onSuccess} className={styles.successButton}>
            Continuar
          </button>
        </div>
      </div>
    );
  }

  const selectedPlan = getSelectedPlan();

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>
            <MdBusiness />
            Nova Organização
          </h2>
          <button onClick={onCancel} className={styles.closeButton}>
            <MdClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorAlert}>
              <MdError size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.section}>
            <h3>Dados da Organização</h3>
            
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
                onChange={handleChange}
                placeholder="Ex: Eventos Faceis Ltda"
                required
                disabled={loading}
                className={fieldErrors.name ? styles.errorInput : ''}
              />
              {fieldErrors.name && (
                <span className={styles.fieldError}>{fieldErrors.name}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cnpj">
                <MdBadge />
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
                disabled={loading}
                className={fieldErrors.cnpj ? styles.errorInput : ''}
              />
              {fieldErrors.cnpj && (
                <span className={styles.fieldError}>{fieldErrors.cnpj}</span>
              )}
              <small>Opcional. Pode ser informado depois.</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="planType">
                <MdAttachMoney />
                Plano *
              </label>
              <select
                id="planType"
                name="planType"
                value={formData.planType}
                onChange={handleChange}
                required
                disabled={loading}
              >
                {planOptions.map(plan => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label} - {plan.price}
                  </option>
                ))}
              </select>
            </div>

            {selectedPlan && (
              <div className={styles.planFeatures}>
                <strong>Recursos inclusos:</strong>
                <ul>
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h3>Administrador Principal</h3>
            <p className={styles.sectionDescription}>
              Este usuário terá acesso total à organização e poderá gerenciar outros usuários.
            </p>

            <div className={styles.formGroup}>
              <label htmlFor="adminName">
                <MdPerson />
                Nome Completo *
              </label>
              <input
                type="text"
                id="adminName"
                name="adminName"
                value={formData.adminName}
                onChange={handleChange}
                placeholder="Nome do administrador"
                required
                disabled={loading}
                className={fieldErrors.adminName ? styles.errorInput : ''}
              />
              {fieldErrors.adminName && (
                <span className={styles.fieldError}>{fieldErrors.adminName}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="adminEmail">
                <MdEmail />
                E-mail *
              </label>
              <input
                type="email"
                id="adminEmail"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleChange}
                placeholder="admin@empresa.com"
                required
                disabled={loading}
                className={fieldErrors.adminEmail ? styles.errorInput : ''}
              />
              {fieldErrors.adminEmail && (
                <span className={styles.fieldError}>{fieldErrors.adminEmail}</span>
              )}
              <small>Será usado para login e comunicação.</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="adminCpf">
                <MdBadge />
                CPF *
              </label>
              <input
                type="text"
                id="adminCpf"
                name="adminCpf"
                value={formData.adminCpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                maxLength={14}
                required
                disabled={loading}
                className={fieldErrors.adminCpf ? styles.errorInput : ''}
              />
              {fieldErrors.adminCpf && (
                <span className={styles.fieldError}>{fieldErrors.adminCpf}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="adminPassword">
                <MdLock />
                Senha *
              </label>
              <input
                type="password"
                id="adminPassword"
                name="adminPassword"
                value={formData.adminPassword}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={loading}
                className={fieldErrors.adminPassword ? styles.errorInput : ''}
              />
              {fieldErrors.adminPassword && (
                <span className={styles.fieldError}>{fieldErrors.adminPassword}</span>
              )}
              <small>Mínimo 6 caracteres. Recomendado usar letras, números e símbolos.</small>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button 
              type="button" 
              onClick={onCancel} 
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className={styles.saveButton}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Criando...
                </>
              ) : (
                'Criar Organização'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};