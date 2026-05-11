// src/components/admin/clients/ClientForm.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiSave, 
  FiUser, 
  FiMail, 
  FiPhone,
  FiLock,
  FiCheck,
  FiEdit2,
  FiUserPlus,
  FiEye,
  FiEyeOff
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
    const [submitted, setSubmitted] = useState(false);
    
    // Estados para controle de visibilidade da senha
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // RESETAR TUDO quando o modal abrir/fechar ou quando o cliente mudar
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
        setSubmitted(false);
        setShowPassword(false);
        setShowConfirmPassword(false);
    }, [client, isOpen]);

    // VALIDAÇÃO EM TEMPO REAL
    const validateField = (field: string, value: string) => {
        const newErrors = { ...errors };
        const cpfNumbers = formData.cpf.replace(/\D/g, '');

        switch (field) {
            case 'cpf':
                if (!cpfNumbers) {
                    newErrors.cpf = 'CPF é obrigatório';
                } else if (cpfNumbers.length !== 11) {
                    newErrors.cpf = 'CPF deve ter 11 dígitos';
                } else if (!validateCPF(cpfNumbers)) {
                    newErrors.cpf = 'CPF inválido';
                } else {
                    delete newErrors.cpf;
                }
                break;

            case 'name':
                if (!value.trim()) {
                    newErrors.name = 'Nome é obrigatório';
                } else if (value.trim().length < 3) {
                    newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
                } else {
                    delete newErrors.name;
                }
                break;

            case 'email':
                if (value && !/\S+@\S+\.\S+/.test(value)) {
                    newErrors.email = 'E-mail inválido';
                } else {
                    delete newErrors.email;
                }
                break;

            case 'phone':
                if (value) {
                    const phoneNumbers = value.replace(/\D/g, '');
                    if (phoneNumbers.length > 0 && (phoneNumbers.length < 10 || phoneNumbers.length > 11)) {
                        newErrors.phone = 'Telefone deve ter 10 ou 11 dígitos';
                    } else {
                        delete newErrors.phone;
                    }
                } else {
                    delete newErrors.phone;
                }
                break;

            case 'password':
                if (!client) {
                    if (!value) {
                        newErrors.password = 'Senha é obrigatória';
                    } else if (value.length < 6) {
                        newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
                    } else {
                        delete newErrors.password;
                    }
                }
                // Validar confirmação de senha também
                if (formData.confirmPassword) {
                    if (value !== formData.confirmPassword) {
                        newErrors.confirmPassword = 'Senhas não conferem';
                    } else {
                        delete newErrors.confirmPassword;
                    }
                }
                break;

            case 'confirmPassword':
                if (!client) {
                    if (!value) {
                        newErrors.confirmPassword = 'Confirmar senha é obrigatório';
                    } else if (value !== formData.password) {
                        newErrors.confirmPassword = 'Senhas não conferem';
                    } else {
                        delete newErrors.confirmPassword;
                    }
                }
                break;
        }

        setErrors(newErrors);
        return newErrors;
    };

    // Validação completa do formulário
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        const cpfNumbers = formData.cpf.replace(/\D/g, '');
        if (!cpfNumbers) {
            newErrors.cpf = 'CPF é obrigatório';
        } else if (cpfNumbers.length !== 11) {
            newErrors.cpf = 'CPF deve ter 11 dígitos';
        } else if (!validateCPF(cpfNumbers)) {
            newErrors.cpf = 'CPF inválido';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'E-mail inválido';
        }

        if (formData.phone) {
            const phoneNumbers = formData.phone.replace(/\D/g, '');
            if (phoneNumbers.length > 0 && (phoneNumbers.length < 10 || phoneNumbers.length > 11)) {
                newErrors.phone = 'Telefone deve ter 10 ou 11 dígitos';
            }
        }

        if (!client) {
            if (!formData.password) {
                newErrors.password = 'Senha é obrigatória';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
            }

            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'Confirmar senha é obrigatório';
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Senhas não conferem';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateCPF = (cpf: string) => {
        if (cpf.length !== 11) return false;
        if (/^(\d)\1+$/.test(cpf)) return false;
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let rev = 11 - (sum % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(9))) return false;
        
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
        
        setSubmitted(true);
        
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
                phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
                ...(formData.password && { password: formData.password })
            };
            await onSubmit(submitData);
            // O componente pai (ClientManagement) cuida da mensagem de sucesso/erro
        } catch (error: any) {
            // Apenas logar, o erro é tratado pelo ClientManagement
            console.error('Erro ao salvar cliente:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field, formData[field as keyof typeof formData]);
    };

    // Handler genérico para mudança de campo com validação em tempo real
    const handleFieldChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        if (touched[field] || submitted) {
            setTimeout(() => {
                validateField(field, value);
            }, 0);
        }
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
        setFormData(prev => ({ ...prev, cpf: formattedCPF }));
        if (touched.cpf || submitted) {
            setTimeout(() => {
                validateField('cpf', formattedCPF);
            }, 0);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedPhone = formatPhone(e.target.value);
        setFormData(prev => ({ ...prev, phone: formattedPhone }));
        if (touched.phone || submitted) {
            setTimeout(() => {
                validateField('phone', formattedPhone);
            }, 0);
        }
    };

    // Determinar se deve mostrar erro
    const shouldShowError = (field: string) => {
        return (touched[field] || submitted) && errors[field];
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
                    <button onClick={onCancel} className={styles.closeButton}>
                        <FiX size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        {/* CPF */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                <MdCreditCard size={16} /> CPF <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="text"
                                    placeholder="000.000.000-00"
                                    value={formData.cpf}
                                    onChange={handleCPFChange}
                                    onBlur={() => handleBlur('cpf')}
                                    disabled={!!client}
                                    className={`${styles.input} ${shouldShowError('cpf') ? styles.inputError : ''} ${client ? styles.inputDisabled : ''}`}
                                />
                            </div>
                            {shouldShowError('cpf') && (
                                <span className={styles.errorMessage}>
                                    <MdWarning size={14} /> {errors.cpf}
                                </span>
                            )}
                        </div>

                        {/* Nome */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                <MdPerson size={16} /> Nome <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="text"
                                    placeholder="Nome completo"
                                    value={formData.name}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    onBlur={() => handleBlur('name')}
                                    className={`${styles.input} ${shouldShowError('name') ? styles.inputError : ''}`}
                                />
                            </div>
                            {shouldShowError('name') && (
                                <span className={styles.errorMessage}>
                                    <MdWarning size={14} /> {errors.name}
                                </span>
                            )}
                        </div>

                        {/* E-mail */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                <FiMail size={16} /> E-mail
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="email"
                                    placeholder="cliente@email.com"
                                    value={formData.email}
                                    onChange={(e) => handleFieldChange('email', e.target.value)}
                                    onBlur={() => handleBlur('email')}
                                    className={`${styles.input} ${shouldShowError('email') ? styles.inputError : ''}`}
                                />
                            </div>
                            {shouldShowError('email') && (
                                <span className={styles.errorMessage}>
                                    <MdWarning size={14} /> {errors.email}
                                </span>
                            )}
                        </div>

                        {/* Telefone */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                <FiPhone size={16} /> Telefone
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="text"
                                    placeholder="(11) 99999-9999"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    onBlur={() => handleBlur('phone')}
                                    className={`${styles.input} ${shouldShowError('phone') ? styles.inputError : ''}`}
                                />
                            </div>
                            {shouldShowError('phone') && (
                                <span className={styles.errorMessage}>
                                    <MdWarning size={14} /> {errors.phone}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Seção de Senha - apenas para novo cliente */}
                    {!client && (
                        <div className={styles.passwordSection}>
                            <div className={styles.passwordHeader}>
                                <FiLock className={styles.passwordIcon} />
                                <h4 className={styles.passwordTitle}>Credenciais de Acesso</h4>
                            </div>
                            
                            <div className={styles.formGrid}>
                                {/* Senha */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <FiLock size={16} /> Senha <span className={styles.required}>*</span>
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Mínimo 6 caracteres"
                                            value={formData.password}
                                            onChange={(e) => handleFieldChange('password', e.target.value)}
                                            onBlur={() => handleBlur('password')}
                                            className={`${styles.input} ${styles.passwordInput} ${shouldShowError('password') ? styles.inputError : ''}`}
                                        />
                                        <button
                                            type="button"
                                            className={styles.passwordToggle}
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                    {shouldShowError('password') && (
                                        <span className={styles.errorMessage}>
                                            <MdWarning size={14} /> {errors.password}
                                        </span>
                                    )}
                                </div>

                                {/* Confirmar Senha */}
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <FiCheck size={16} /> Confirmar Senha <span className={styles.required}>*</span>
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Digite novamente"
                                            value={formData.confirmPassword}
                                            onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                                            onBlur={() => handleBlur('confirmPassword')}
                                            className={`${styles.input} ${styles.passwordInput} ${shouldShowError('confirmPassword') ? styles.inputError : ''}`}
                                        />
                                        <button
                                            type="button"
                                            className={styles.passwordToggle}
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                    {shouldShowError('confirmPassword') && (
                                        <span className={styles.errorMessage}>
                                            <MdWarning size={14} /> {errors.confirmPassword}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className={styles.passwordHint}>
                                <span className={styles.hintIcon}>ℹ️</span> A senha deve ter no mínimo 6 caracteres
                            </div>
                        </div>
                    )}

                    {/* Botões de ação */}
                    <div className={styles.formActions}>
                        <button type="button" onClick={onCancel} className={styles.cancelButton} disabled={loading}>
                            <FiX size={18} /> Cancelar
                        </button>
                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {loading ? (
                                <>
                                    <span className={styles.buttonSpinner}></span> Salvando...
                                </>
                            ) : (
                                <>
                                    <FiSave size={18} /> {client ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};