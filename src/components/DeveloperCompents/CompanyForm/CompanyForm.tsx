// src/components/DeveloperCompents/CompanyForm/CompanyForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  MdSave,
  MdCancel,
  MdBusiness,
  MdDescription,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdCategory,
  MdError,
  MdArrowBack
} from 'react-icons/md';
import { companyService, EmpresaResponse, CreateEmpresaDTO } from '../../../services/company';
import styles from './CompanyForm.module.css';

interface CompanyFormProps {
  companyId?: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ 
  companyId, 
  onSuccess, 
  onCancel 
}) => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  
  // Prioridade: props > params
  const id = companyId ?? (params.id ? Number(params.id) : undefined);
  const isEditing = !!id;

  console.log('🔍 CompanyForm - Props companyId:', companyId);
  console.log('🔍 CompanyForm - Params id:', params.id);
  console.log('🔍 CompanyForm - ID final:', id);
  console.log('🔍 CompanyForm - isEditing:', isEditing);

  const [formData, setFormData] = useState<CreateEmpresaDTO>({
    nome: '',
    descricao: '',
    categoria: 'Outros',
    localizacao: '',
    telefone: '',
    email: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const categorias = companyService.getCategorias();

  useEffect(() => {
    console.log('🔍 CompanyForm useEffect - ID recebido:', id);
    if (isEditing && id) {
      loadCompany();
    }
  }, [id]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      setError(null);
      setNotFound(false);
      
      console.log(`🔍 Carregando empresa ID: ${id}`);
      const numericId = Number(id);
      console.log(`🔍 ID numérico: ${numericId}`);
      
      const data = await companyService.getCompanyById(numericId);
      console.log('✅ Empresa carregada:', data);
      
      setFormData({
        nome: data.nome,
        descricao: data.descricao || '',
        categoria: data.categoria,
        localizacao: data.localizacao || '',
        telefone: data.telefone || '',
        email: data.email || ''
      });
      
    } catch (err: any) {
      console.error('❌ Erro ao carregar empresa:', err);
      
      if (err.response?.status === 404) {
        setNotFound(true);
        setError('Empresa não encontrada.');
      } else if (err.response?.status === 403) {
        setError('Acesso negado. Verifique suas permissões.');
        console.error('🔐 Detalhes do erro 403:', err.response?.data);
      } else {
        setError('Erro ao carregar dados da empresa. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Submetendo formulário:', formData);
      
      // Validações
      if (!formData.nome.trim()) {
        setError('Nome é obrigatório');
        setLoading(false);
        return;
      }

      if (formData.email && !companyService.validateEmail(formData.email)) {
        setError('Email inválido');
        setLoading(false);
        return;
      }

      if (formData.telefone && !companyService.validatePhone(formData.telefone)) {
        setError('Telefone inválido. Use formato (11) 99999-9999');
        setLoading(false);
        return;
      }

      let response;
      if (isEditing) {
        console.log(`🔍 Atualizando empresa ID: ${id}`);
        response = await companyService.updateCompany(Number(id), formData);
      } else {
        console.log('🔍 Criando nova empresa');
        response = await companyService.createCompany(formData);
      }
      
      console.log('✅ Resposta do servidor:', response);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (err: any) {
      console.error('❌ Erro ao salvar empresa:', err);
      
      if (err.response?.status === 403) {
        setError('Acesso negado. Você não tem permissão para esta ação.');
      } else if (err.response?.status === 404) {
        setError('Empresa não encontrada.');
      } else {
        setError('Erro ao salvar empresa. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando empresa...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={styles.errorContainer}>
        <MdError size={48} />
        <h2>Empresa não encontrada</h2>
        <p>A empresa que você está tentando editar não existe ou foi removida.</p>
        <button onClick={onCancel} className={styles.backButton}>
          <MdArrowBack />
          Voltar para lista
        </button>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h1>
          <MdBusiness />
          {isEditing ? 'Editar Empresa' : 'Nova Empresa'}
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
          Empresa {isEditing ? 'atualizada' : 'criada'} com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nome">
            <MdBusiness />
            Nome da Empresa *
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            placeholder="Digite o nome da empresa"
            required
            disabled={loading || success}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="categoria">
            <MdCategory />
            Categoria *
          </label>
          <select
            id="categoria"
            name="categoria"
            value={formData.categoria}
            onChange={handleInputChange}
            required
            disabled={loading || success}
          >
            {categorias.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="descricao">
            <MdDescription />
            Descrição
          </label>
          <textarea
            id="descricao"
            name="descricao"
            value={formData.descricao}
            onChange={handleInputChange}
            placeholder="Descreva os serviços da empresa"
            rows={4}
            disabled={loading || success}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="email">
              <MdEmail />
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="email@empresa.com"
              disabled={loading || success}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="telefone">
              <MdPhone />
              Telefone
            </label>
            <input
              type="text"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleInputChange}
              placeholder="(11) 99999-9999"
              disabled={loading || success}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="localizacao">
            <MdLocationOn />
            Localização
          </label>
          <input
            type="text"
            id="localizacao"
            name="localizacao"
            value={formData.localizacao}
            onChange={handleInputChange}
            placeholder="Cidade, Estado ou endereço completo"
            disabled={loading || success}
          />
        </div>

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