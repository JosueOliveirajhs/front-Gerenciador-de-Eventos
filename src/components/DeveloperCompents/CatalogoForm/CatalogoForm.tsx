// src/components/DeveloperCompents/Catalogo/CatalogoForm.tsx
import React, { useState, useEffect } from 'react';
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
import { catalogoService } from '../../../services/catalogo';
import { EmpresaResponse, CreateEmpresaDTO, CategoriaEmpresa } from '../../../types/developer';
import styles from './CatalogoForm.module.css';

interface CatalogoFormProps {
  empresaId?: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CatalogoForm: React.FC<CatalogoFormProps> = ({ 
  empresaId, 
  onSuccess, 
  onCancel 
}) => {
  const isEditing = !!empresaId;

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

  const categorias = catalogoService.getCategorias();

  useEffect(() => {
    if (isEditing) {
      loadEmpresa();
    }
  }, [empresaId]);

  const loadEmpresa = async () => {
    try {
      setLoading(true);
      const data = await catalogoService.getEmpresaById(empresaId!);
      setFormData({
        nome: data.nome,
        descricao: data.descricao || '',
        categoria: data.categoria,
        localizacao: data.localizacao || '',
        telefone: data.telefone || '',
        email: data.email || ''
      });
    } catch (error) {
      console.error('❌ Erro ao carregar empresa:', error);
      setError('Erro ao carregar dados da empresa');
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
      
      // Validações
      if (!formData.nome.trim()) {
        setError('Nome é obrigatório');
        setLoading(false);
        return;
      }

      if (formData.email && !catalogoService.validateEmail(formData.email)) {
        setError('Email inválido');
        setLoading(false);
        return;
      }

      if (formData.telefone && !catalogoService.validatePhone(formData.telefone)) {
        setError('Telefone inválido. Use formato (11) 99999-9999');
        setLoading(false);
        return;
      }

      if (isEditing) {
        await catalogoService.updateEmpresa(empresaId!, formData);
      } else {
        await catalogoService.createEmpresa(formData);
      }
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (err: any) {
      console.error('❌ Erro ao salvar empresa:', err);
      if (err.response?.status === 403) {
        setError('Acesso negado. Você não tem permissão para esta ação.');
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

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h1>
          <MdBusiness />
          {isEditing ? 'Editar Empresa' : 'Nova Empresa no Catálogo'}
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
          Empresa {isEditing ? 'atualizada' : 'cadastrada'} com sucesso!
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
            {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </div>
  );
};