import React, { useState, useEffect } from 'react';
import { User } from '../../types/User';
import { userService } from '../../services/users';
import styles from './ClientManagement.module.css';

export const ClientManagement: React.FC = () => {
    const [clients, setClients] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingClient, setEditingClient] = useState<User | null>(null);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const clientsData = await userService.getAllClients();
            setClients(clientsData);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (clientData: Omit<User, 'id' | 'createdAt'>) => {
        try {
            await userService.createClient(clientData);
            await loadClients();
            setShowForm(false);
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            throw error;
        }
    };

    const handleUpdateClient = async (id: number, clientData: Partial<User>) => {
        try {
            await userService.updateClient(id, clientData);
            await loadClients();
            setEditingClient(null);
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            throw error;
        }
    };

    const handleDeleteClient = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            try {
                await userService.deleteClient(id);
                await loadClients();
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
                alert('Erro ao excluir cliente. Verifique se não há eventos vinculados.');
            }
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Carregando clientes...</p>
            </div>
        );
    }

    return (
        <div className={styles.clientManagement}>
            <div className={styles.pageHeader}>
                <div className={styles.headerContent}>
                    <button 
                        onClick={() => setShowForm(true)}
                        className={styles.primaryButton}
                    >
                        + Novo Cliente
                    </button>
                </div>
            </div>

            {showForm && (
                <ClientForm
                    onSubmit={handleCreateClient}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {editingClient && (
                <ClientForm
                    client={editingClient}
                    onSubmit={(data) => handleUpdateClient(editingClient.id, data)}
                    onCancel={() => setEditingClient(null)}
                />
            )}

            <div className={`${styles.clientsTable} ${styles.card}`}>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>CPF</th>
                                <th>Nome</th>
                                <th>E-mail</th>
                                <th>Telefone</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr key={client.id}>
                                    <td>
                                        <div className={styles.cpfCell}>
                                            {formatCPF(client.cpf)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.nameCell}>
                                            <strong>{client.name}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.emailCell}>
                                            {client.email || '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.phoneCell}>
                                            {client.phone || '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actionsCell}>
                                            <button
                                                onClick={() => setEditingClient(client)}
                                                className={styles.editButton}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClient(client.id)}
                                                className={styles.deleteButton}
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {clients.length === 0 && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👥</div>
                        <h3 className={styles.emptyTitle}>Nenhum cliente cadastrado</h3>
                        <p className={styles.emptyText}>
                            Comece cadastrando seu primeiro cliente para ver a lista aqui.
                        </p>
                        <button 
                            onClick={() => setShowForm(true)}
                            className={styles.primaryButton}
                        >
                            + Cadastrar Primeiro Cliente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente de Formulário
interface ClientFormProps {
    client?: User;
    onSubmit: (clientData: any) => void;
    onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ client, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        cpf: client?.cpf || '',
        name: client?.name || '',
        email: client?.email || '',
        phone: client?.phone || '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
            newErrors.cpf = 'CPF deve ter 11 dígitos';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'E-mail inválido';
        }

        if (!client && !formData.password) {
            newErrors.password = 'Senha é obrigatória';
        }

        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Senhas não conferem';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const submitData = {
                cpf: formData.cpf.replace(/\D/g, ''),
                name: formData.name,
                email: formData.email || null,
                phone: formData.phone || null,
                password: formData.password || undefined
            };
            await onSubmit(submitData);
        } catch (error) {
            // Error handling is done in the parent component
        } finally {
            setLoading(false);
        }
    };

    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return numbers.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedCPF = formatCPF(e.target.value);
        setFormData({ ...formData, cpf: formattedCPF });
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${styles.card}`}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                        {client ? 'Editar Cliente' : 'Novo Cliente'}
                    </h3>
                    <button onClick={onCancel} className={styles.closeButton}>
                        ×
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>CPF *</label>
                            <input
                                type="text"
                                placeholder="000.000.000-00"
                                value={formData.cpf}
                                onChange={handleCPFChange}
                                disabled={!!client}
                                className={styles.formInput}
                            />
                            {errors.cpf && <span className={styles.error}>{errors.cpf}</span>}
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Nome *</label>
                            <input
                                type="text"
                                placeholder="Nome completo do cliente"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className={styles.formInput}
                            />
                            {errors.name && <span className={styles.error}>{errors.name}</span>}
                        </div>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>E-mail</label>
                            <input
                                type="email"
                                placeholder="cliente@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className={styles.formInput}
                            />
                            {errors.email && <span className={styles.error}>{errors.email}</span>}
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Telefone</label>
                            <input
                                type="text"
                                placeholder="(11) 99999-9999"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className={styles.formInput}
                            />
                        </div>
                    </div>

                    {!client && (
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Senha *</label>
                                <input
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className={styles.formInput}
                                />
                                {errors.password && <span className={styles.error}>{errors.password}</span>}
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Confirmar Senha *</label>
                                <input
                                    type="password"
                                    placeholder="Digite novamente a senha"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                    className={styles.formInput}
                                />
                                {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
                            </div>
                        </div>
                    )}

                    <div className={styles.formActions}>
                        <button 
                            type="button" 
                            onClick={onCancel} 
                            className={styles.secondaryButton}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className={styles.primaryButton}
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : (client ? 'Atualizar' : 'Cadastrar')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Função para formatar CPF
const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};