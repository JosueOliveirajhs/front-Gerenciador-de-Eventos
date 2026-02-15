// src/components/admin/clients/components/ClientForm.tsx

import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiSave, 
  FiUser, 
  FiMail, 
  FiPhone,
  FiLock,
  FiCheck
} from 'react-icons/fi';
import { 
  MdPerson, 
  MdCreditCard,
  MdWarning 
} from 'react-icons/md';
import { User } from '../types';
import styles from './ClientForm.module.css';

interface ClientFormProps {
    client?: User;
    onSubmit: (clientData: any) => Promise<void>;
    onCancel: () => void;
    isOpen: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({
    client,
    onSubmit,
    onCancel,
    isOpen
}) => {
    const [formData, setFormData] = useState({
        cpf: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        if (client) {
            setFormData({
                cpf: formatCPF(client.cpf),
                name: client.name,
                email: client.email || '',
                phone: client.phone || '',
                password: '',
                confirmPassword: ''
            });
        } else {
            setFormData({
                cpf: '',
                name: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: ''
            });
        }
        setErrors({});
        setTouched({});
    }, [client, isOpen]);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        // Validação de CPF
        const cpfNumbers = formData.cpf.replace(/\D/g, '');
        if (!cpfNumbers) {
            newErrors.cpf = 'CPF é obrigatório';
        } else if (cpfNumbers.length !== 11) {
            newErrors.cpf = 'CPF deve ter 11 dígitos';
        } else if (!validateCPF(cpfNumbers)) {
            newErrors.cpf = 'CPF inválido';
        }

        // Validação de Nome
        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
        }

        // Validação de E-mail
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'E-mail inválido';
        }

        // Validação de Telefone
        if (formData.phone) {
            const phoneNumbers = formData.phone.replace(/\D/g, '');
            if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
                newErrors.phone = 'Telefone deve ter 10 ou 11 dígitos';
            }
        }

        // Validação de Senha (apenas para criação)
        if (!client) {
            if (!formData.password) {
                newErrors.password = 'Senha é obrigatória';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Senhas não conferem';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateCPF = (cpf: string) => {
        if (cpf.length !== 11) return false;
        
        // Elimina CPFs conhecidos inválidos
        if (/^(\d)\1+$/.test(cpf)) return false;
        
        // Validação do primeiro dígito
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let rev = 11 - (sum % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(9))) return false;
        
        // Validação do segundo dígito
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        rev = 11 - (sum % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Marcar todos os campos como tocados
        const allTouched = Object.keys(formData).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {} as { [key: string]: boolean });
        setTouched(allTouched);

        if (!validateForm()) return;

        setLoading(true);
        try {
            const submitData = {
                cpf: formData.cpf.replace(/\D/g, ''),
                name: formData.name.trim(),
                email: formData.email.trim() || null,
                phone: formData.phone.trim() || null,
                ...(formData.password && { password: formData.password })
            };
            await onSubmit(submitData);
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return numbers.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            if (numbers.length <= 10) {
                return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            }
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return numbers.slice(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    };

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedCPF = formatCPF(e.target.value);
        setFormData({ ...formData, cpf: formattedCPF });
        if (touched.cpf) validateForm();
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedPhone = formatPhone(e.target.value);
        setFormData({ ...formData, phone: formattedPhone });
        if (touched.phone) validateForm();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h3 className={styles.title}>
                            {client ? (
                                <>
                                    <FiEdit2 className={styles.titleIcon} />
                                    Editar Cliente
                                </>
                            ) : (
                                <>
                                    <FiUserPlus className={styles.titleIcon} />
                                    Novo Cliente
                                </>
                            )}
                        </h3>
                        <p className={styles.subtitle}>
                            {client 
                                ? 'Atualize as informações do cliente abaixo'
                                : 'Preencha os dados para cadastrar um novo cliente'}
                        </p>
                    </div>
                    <button 
                        onClick={onCancel} 
                        className={styles.closeButton}
                        aria-label="Fechar"
                    >
                        <FiX size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                <MdCreditCard size={16} />
                                CPF <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="text"
                                    placeholder="000.000.000-00"
                                    value={formData.cpf}
                                    onChange={handleCPFChange}
                                    onBlur={() => handleBlur('cpf')}
                                    disabled={!!client}
                                    className={`${styles.input} ${touched.cpf && errors.cpf ? styles.inputError : ''} ${client ? styles.inputDisabled : ''}`}
                                />
                            </div>
                            {touched.cpf && errors.cpf && (
                                <span className={styles.errorMessage}>
                                    <MdWarning size={14} />
                                    {errors.cpf}
                                </span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                <MdPerson size={16} />
                                Nome <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="text"
                                    placeholder="Nome completo"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({...formData, name: e.target.value});
                                        if (touched.name) validateForm();
                                    }}
                                    onBlur={() => handleBlur('name')}
                                    className={`${styles.input} ${touched.name && errors.name ? styles.inputError : ''}`}
                                />
                            </div>
                            {touched.name && errors.name && (
                                <span className={styles.errorMessage}>
                                    <MdWarning size={14} />
                                    {errors.name}
                                </span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                <FiMail size={16} />
                                E-mail
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="email"
                                    placeholder="cliente@email.com"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({...formData, email: e.target.value});
                                        if (touched.email) validateForm();
                                    }}
                                    onBlur={() => handleBlur('email')}
                                    className={`${styles.input} ${touched.email && errors.email ? styles.inputError : ''}`}
                                />
                            </div>
                            {touched.email && errors.email && (
                                <span className={styles.errorMessage}>
                                    <MdWarning size={14} />
                                    {errors.email}
                                </span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                <FiPhone size={16} />
                                Telefone
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="text"
                                    placeholder="(11) 99999-9999"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    onBlur={() => handleBlur('phone')}
                                    className={`${styles.input} ${touched.phone && errors.phone ? styles.inputError : ''}`}
                                />
                            </div>
                            {touched.phone && errors.phone && (
                                <span className={styles.errorMessage}>
                                    <MdWarning size={14} />
                                    {errors.phone}
                                </span>
                            )}
                        </div>
                    </div>

                    {!client && (
                        <div className={styles.passwordSection}>
                            <div className={styles.passwordHeader}>
                                <FiLock className={styles.passwordIcon} />
                                <h4 className={styles.passwordTitle}>Credenciais de Acesso</h4>
                            </div>
                            
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <FiLock size={16} />
                                        Senha <span className={styles.required}>*</span>
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="password"
                                            placeholder="Mínimo 6 caracteres"
                                            value={formData.password}
                                            onChange={(e) => {
                                                setFormData({...formData, password: e.target.value});
                                                if (touched.password) validateForm();
                                            }}
                                            onBlur={() => handleBlur('password')}
                                            className={`${styles.input} ${touched.password && errors.password ? styles.inputError : ''}`}
                                        />
                                    </div>
                                    {touched.password && errors.password && (
                                        <span className={styles.errorMessage}>
                                            <MdWarning size={14} />
                                            {errors.password}
                                        </span>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <FiCheck size={16} />
                                        Confirmar Senha <span className={styles.required}>*</span>
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="password"
                                            placeholder="Digite novamente"
                                            value={formData.confirmPassword}
                                            onChange={(e) => {
                                                setFormData({...formData, confirmPassword: e.target.value});
                                                if (touched.confirmPassword) validateForm();
                                            }}
                                            onBlur={() => handleBlur('confirmPassword')}
                                            className={`${styles.input} ${touched.confirmPassword && errors.confirmPassword ? styles.inputError : ''}`}
                                        />
                                    </div>
                                    {touched.confirmPassword && errors.confirmPassword && (
                                        <span className={styles.errorMessage}>
                                            <MdWarning size={14} />
                                            {errors.confirmPassword}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className={styles.passwordHint}>
                                <span className={styles.hintIcon}>ℹ️</span>
                                A senha deve ter no mínimo 6 caracteres
                            </div>
                        </div>
                    )}

                    <div className={styles.formActions}>
                        <button 
                            type="button" 
                            onClick={onCancel} 
                            className={styles.cancelButton}
                            disabled={loading}
                        >
                            <FiX size={18} />
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className={styles.submitButton}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className={styles.buttonSpinner}></span>
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <FiSave size={18} />
                                    {client ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};