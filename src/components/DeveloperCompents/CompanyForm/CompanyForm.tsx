// src/components/developer/CompanyForm.tsx

import React, { useState, useEffect } from 'react';
import {
  MdClose,
  MdSave,
  MdBusiness,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdAttachMoney,
  MdCalendarToday,
  MdCloudUpload,
  MdWarning
} from 'react-icons/md';
import { FaRegIdCard, FaRegBuilding } from 'react-icons/fa';
import styles from './CompanyForm.module.css';

interface CompanyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    plano: 'BASIC' as 'BASIC' | 'PRO' | 'ENTERPRISE',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    dataVencimento: '',
    logo: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        cnpj: initialData.cnpj || '',
        email: initialData.email || '',
        telefone: initialData.telefone || '',
        endereco: initialData.endereco || '',
        cidade: initialData.cidade || '',
        estado: initialData.estado || '',
        cep: initialData.cep || '',
        plano: initialData.plano || 'BASIC',
        status: initialData.status || 'ACTIVE',
        dataVencimento: initialData.dataVencimento || '',
        logo: initialData.logo || ''
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome) newErrors.nome = 'Nome é obrigatório';
    if (!formData.cnpj) newErrors.cnpj = 'CNPJ é obrigatório';
    else if (!/^\d{14}$/.test(formData.cnpj.replace(/\D/g, ''))) {
      newErrors.cnpj = 'CNPJ inválido';
    }

    if (!formData.email) newErrors.email = 'Email é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.telefone) newErrors.telefone = 'Telefone é obrigatório';
    if (!formData.endereco) newErrors.endereco = 'Endereço é obrigatório';
    if (!formData.cidade) newErrors.cidade = 'Cidade é obrigatória';
    if (!formData.estado) newErrors.estado = 'Estado é obrigatório';
    if (!formData.cep) newErrors.cep = 'CEP é obrigatório';
    if (!formData.dataVencimento) newErrors.dataVencimento = 'Data de vencimento é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpar erro do campo quando começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 14) {
      // Formatar CNPJ: 00.000.000/0000-00
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
      setFormData(prev => ({ ...prev, cnpj: value }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      // Formatar telefone: (00) 00000-0000
      value = value.replace(/^(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
      setFormData(prev => ({ ...prev, telefone: value }));
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 8) {
      // Formatar CEP: 00000-000
      value = value.replace(/^(\d{5})(\d)/, '$1-$2');
      setFormData(prev => ({ ...prev, cep: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Limpar formatação antes de enviar
      const dataToSubmit = {
        ...formData,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
        cep: formData.cep.replace(/\D/g, '')
      };
      await onSave(dataToSubmit);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>
            <MdBusiness />
            {initialData ? 'Editar Empresa' : 'Nova Empresa'}
          </h3>
          <button onClick={onClose} className={styles.closeButton}>
            <MdClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            {/* Nome */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Nome da Empresa *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Razão Social"
                className={errors.nome ? styles.error : ''}
              />
              {errors.nome && <span className={styles.errorMessage}>{errors.nome}</span>}
            </div>

            {/* CNPJ e Email */}
            <div className={styles.formGroup}>
              <label>CNPJ *</label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleCnpjChange}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className={errors.cnpj ? styles.error : ''}
              />
              {errors.cnpj && <span className={styles.errorMessage}>{errors.cnpj}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contato@empresa.com"
                className={errors.email ? styles.error : ''}
              />
              {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
            </div>

            {/* Telefone e Plano */}
            <div className={styles.formGroup}>
              <label>Telefone *</label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className={errors.telefone ? styles.error : ''}
              />
              {errors.telefone && <span className={styles.errorMessage}>{errors.telefone}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Plano *</label>
              <select name="plano" value={formData.plano} onChange={handleInputChange}>
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>

            {/* Endereço */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Endereço *</label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
                placeholder="Rua, número, complemento"
                className={errors.endereco ? styles.error : ''}
              />
              {errors.endereco && <span className={styles.errorMessage}>{errors.endereco}</span>}
            </div>

            {/* Cidade, Estado, CEP */}
            <div className={styles.formGroup}>
              <label>Cidade *</label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleInputChange}
                placeholder="São Paulo"
                className={errors.cidade ? styles.error : ''}
              />
              {errors.cidade && <span className={styles.errorMessage}>{errors.cidade}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Estado *</label>
              <input
                type="text"
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                placeholder="SP"
                maxLength={2}
                className={errors.estado ? styles.error : ''}
              />
              {errors.estado && <span className={styles.errorMessage}>{errors.estado}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>CEP *</label>
              <input
                type="text"
                name="cep"
                value={formData.cep}
                onChange={handleCepChange}
                placeholder="00000-000"
                maxLength={9}
                className={errors.cep ? styles.error : ''}
              />
              {errors.cep && <span className={styles.errorMessage}>{errors.cep}</span>}
            </div>

            {/* Status e Data de Vencimento */}
            <div className={styles.formGroup}>
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
                <option value="SUSPENDED">Suspenso</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Data de Vencimento *</label>
              <input
                type="date"
                name="dataVencimento"
                value={formData.dataVencimento}
                onChange={handleInputChange}
                className={errors.dataVencimento ? styles.error : ''}
              />
              {errors.dataVencimento && <span className={styles.errorMessage}>{errors.dataVencimento}</span>}
            </div>

            {/* Logo (opcional) */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Logo URL (opcional)</label>
              <input
                type="url"
                name="logo"
                value={formData.logo}
                onChange={handleInputChange}
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className={styles.warningBox}>
              <MdWarning />
              <span>Preencha todos os campos obrigatórios corretamente.</span>
            </div>
          )}

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Salvando...</>
              ) : (
                <>
                  <MdSave />
                  {initialData ? 'Atualizar' : 'Salvar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};