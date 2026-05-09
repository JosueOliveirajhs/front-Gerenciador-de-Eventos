// src/pages/Profile/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  FiUser, FiMail, FiPhone, FiLock, FiSave, FiCamera,
  FiCalendar, FiMapPin, FiBriefcase, FiX
} from 'react-icons/fi';
import { MdVerified, MdWarning } from 'react-icons/md';
import { ConfirmationModal } from '../../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../../common/Alerts/ErrorModal';
import { userService } from '../../../services/users';
import { authService } from '../../../services/auth';
import styles from './ProfilePage.module.css';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  role: 'OWNER' | 'ADMIN' | 'CLIENT' | 'MANAGER' | 'DIRECTOR' | 'ANALYST';
  department?: string;
  position?: string;
  startDate: string;
  avatar?: string;
  twoFactorEnabled: boolean;
  lastLogin: string;
  loginHistory: { date: string; ip: string; device: string; }[];
}

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const getUserId = (): number | null => {
    if (user?.id) return user.id;
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        return parsed.id || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const userId = getUserId();
    if (userId) {
      loadProfile(userId);
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async (userId: number) => {
    try {
      setLoading(true);
      const profileData = await userService.getProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setErrorMessage('Erro ao carregar dados do perfil.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updatedProfile = await userService.updateProfile(profile.id, {
        name: profile.name, email: profile.email, phone: profile.phone,
        birthDate: profile.birthDate, address: profile.address,
        city: profile.city, state: profile.state, zipCode: profile.zipCode,
        position: profile.position, department: profile.department
      });
      setProfile(updatedProfile);
      setHasChanges(false);
      // ✅ Mesclar, não sobrescrever - preserva id, userType, role
      if (updateUser) updateUser({ name: updatedProfile.name, email: updatedProfile.email });
      setSuccessMessage('Perfil atualizado com sucesso!');
      setShowSuccessModal(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao atualizar perfil.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('As senhas nao conferem'); setShowErrorModal(true); return;
    }
    if (passwordData.newPassword.length < 6) {
      setErrorMessage('Minimo 6 caracteres'); setShowErrorModal(true); return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('Senha alterada!'); setShowSuccessModal(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao alterar senha.'); setShowErrorModal(true);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    if (!profile) return;
    setShowTwoFactorModal(false);
    try {
      const updated = await userService.toggleTwoFactor(profile.id, !profile.twoFactorEnabled);
      setProfile(prev => prev ? { ...prev, twoFactorEnabled: updated.twoFactorEnabled } : null);
      setSuccessMessage(profile.twoFactorEnabled ? '2FA desativado' : '2FA ativado');
      setShowSuccessModal(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao alterar 2FA.'); setShowErrorModal(true);
    }
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const getRoleLabel = (r: string) => ({ OWNER: 'Proprietario', ADMIN: 'Administrador', MANAGER: 'Gerente', DIRECTOR: 'Diretor', ANALYST: 'Analista', CLIENT: 'Cliente' }[r] || r);

  if (loading) return <div className={styles.loadingContainer}><div className={styles.spinner}></div><p>Carregando perfil...</p></div>;

  if (!profile) return (
    <div className={styles.errorContainer}>
      <MdWarning size={48} /><h3>Erro ao carregar perfil</h3>
      <p>{errorMessage || 'Nao foi possivel carregar os dados.'}</p>
      <button onClick={() => { const uid = getUserId(); if (uid) loadProfile(uid); }} className={styles.retryButton}>Tentar novamente</button>
    </div>
  );

  return (
    <div className={styles.profilePage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}><FiUser size={28} />Meu Perfil</h1>
        <div className={styles.headerActions}>
          {hasChanges && <span className={styles.unsavedBadge}><MdWarning size={14} />Alteracoes nao salvas</span>}
          <button className={styles.primaryButton} onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? <><span className={styles.buttonSpinner}></span>Salvando...</> : <><FiSave size={18} />Salvar Alteracoes</>}
          </button>
        </div>
      </div>

      <div className={styles.profileContainer}>
        <div className={styles.profileLeftColumn}>
          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                <div className={styles.avatar}>{profile.avatar ? <img src={profile.avatar} alt={profile.name} /> : <span>{profile.name.split(' ').map(n => n[0]).join('')}</span>}</div>
                <button className={styles.changeAvatarBtn}><FiCamera size={16} /></button>
              </div>
              <h2 className={styles.profileName}>{profile.name}</h2>
              <p className={styles.profileRole}>{getRoleLabel(profile.role)}</p>
              <span className={styles.profileStatus}><MdVerified size={14} color="#10b981" />Conta verificada</span>
            </div>
            <div className={styles.infoSection}>
              <div className={styles.infoItem}><FiMail size={16} /><div><small>E-mail</small><p>{profile.email}</p></div></div>
              <div className={styles.infoItem}><FiPhone size={16} /><div><small>Telefone</small><p>{profile.phone || 'Nao informado'}</p></div></div>
              {profile.birthDate && <div className={styles.infoItem}><FiCalendar size={16} /><div><small>Nascimento</small><p>{new Date(profile.birthDate).toLocaleDateString('pt-BR')}</p></div></div>}
              {profile.address && <div className={styles.infoItem}><FiMapPin size={16} /><div><small>Endereco</small><p>{profile.address}, {profile.city} - {profile.state}</p></div></div>}
              {profile.position && <div className={styles.infoItem}><FiBriefcase size={16} /><div><small>Cargo</small><p>{profile.position}{profile.department ? ` - ${profile.department}` : ''}</p></div></div>}
            </div>
          </div>
          <div className={styles.securityCard}>
            <h3>Seguranca</h3>
            <button className={styles.securityButton} onClick={() => setShowPasswordModal(true)}><FiLock size={16} /><span>Alterar Senha</span></button>
            <div className={styles.twoFactorSection}>
              <div className={styles.twoFactorInfo}><span>Autenticacao 2FA</span><small>Camada extra de seguranca</small></div>
              <label className={styles.switchLabel}><input type="checkbox" checked={profile.twoFactorEnabled} onChange={() => setShowTwoFactorModal(true)} /><span className={styles.switchSlider}></span></label>
            </div>
          </div>
        </div>

        <div className={styles.profileRightColumn}>
          <div className={styles.formCard}>
            <h3>Informacoes Pessoais</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}><label className={styles.formLabel}>Nome *</label><input type="text" className={styles.formInput} value={profile.name} onChange={e => { setProfile({...profile, name: e.target.value}); setHasChanges(true); }} /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>E-mail *</label><input type="email" className={styles.formInput} value={profile.email} onChange={e => { setProfile({...profile, email: e.target.value}); setHasChanges(true); }} /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>Telefone</label><input type="text" className={styles.formInput} value={profile.phone || ''} onChange={e => { setProfile({...profile, phone: e.target.value}); setHasChanges(true); }} placeholder="(00) 00000-0000" /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>CPF *</label><input type="text" className={styles.formInput} value={profile.cpf} disabled /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>Nascimento</label><input type="date" className={styles.formInput} value={profile.birthDate || ''} onChange={e => { setProfile({...profile, birthDate: e.target.value}); setHasChanges(true); }} /></div>
            </div>
            <h3 className={styles.formSubtitle}>Endereco</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}><label className={styles.formLabel}>Endereco</label><input type="text" className={styles.formInput} value={profile.address || ''} onChange={e => { setProfile({...profile, address: e.target.value}); setHasChanges(true); }} /></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>Cidade</label><input type="text" className={styles.formInput} value={profile.city || ''} onChange={e => { setProfile({...profile, city: e.target.value}); setHasChanges(true); }} /></div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estado</label>
                <select className={styles.formInput} value={profile.state || ''} onChange={e => { setProfile({...profile, state: e.target.value}); setHasChanges(true); }}>
                  <option value="">Selecione</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapa</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceara</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espirito Santo</option>
                  <option value="GO">Goias</option>
                  <option value="MA">Maranhao</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Para</option>
                  <option value="PB">Paraiba</option>
                  <option value="PR">Parana</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piaui</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondonia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">Sao Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
              <div className={styles.formGroup}><label className={styles.formLabel}>CEP</label><input type="text" className={styles.formInput} value={profile.zipCode || ''} onChange={e => { setProfile({...profile, zipCode: e.target.value}); setHasChanges(true); }} /></div>
            </div>

            {profile.position && (
              <>
                <h3 className={styles.formSubtitle}>Informacoes Profissionais</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}><label className={styles.formLabel}>Cargo</label><input type="text" className={styles.formInput} value={profile.position || ''} onChange={e => { setProfile({...profile, position: e.target.value}); setHasChanges(true); }} /></div>
                  <div className={styles.formGroup}><label className={styles.formLabel}>Departamento</label><input type="text" className={styles.formInput} value={profile.department || ''} onChange={e => { setProfile({...profile, department: e.target.value}); setHasChanges(true); }} /></div>
                </div>
              </>
            )}
          </div>

          {profile.loginHistory && profile.loginHistory.length > 0 && (
            <div className={styles.historyCard}>
              <h3>Ultimos Acessos</h3>
              <div className={styles.loginHistory}>
                {profile.loginHistory.map((login, index) => (
                  <div key={index} className={styles.loginItem}>
                    <div className={styles.loginDate}>{formatDate(login.date)}</div>
                    <div className={styles.loginDetails}><span>IP: {login.ip}</span><span>{login.device}</span></div>
                  </div>
                ))}
              </div>
              <div className={styles.lastLogin}><FiCalendar size={14} />Ultimo acesso: {formatDate(profile.lastLogin)}</div>
            </div>
          )}
        </div>
      </div>

      {showPasswordModal && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <div className={styles.modalHeader}><h3><FiLock size={20} />Alterar Senha</h3><button className={styles.closeButton} onClick={() => setShowPasswordModal(false)}><FiX size={20} /></button></div>
          <div className={styles.modalContent}>
            <div className={styles.formGroup}><label>Senha Atual</label><input type="password" className={styles.formInput} value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} /></div>
            <div className={styles.formGroup}><label>Nova Senha</label><input type="password" className={styles.formInput} value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} /><small>Minimo 6 caracteres</small></div>
            <div className={styles.formGroup}><label>Confirmar</label><input type="password" className={styles.formInput} value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} /></div>
            <div className={styles.modalActions}><button className={styles.secondaryButton} onClick={() => setShowPasswordModal(false)} disabled={changingPassword}>Cancelar</button><button className={styles.primaryButton} onClick={handleChangePassword} disabled={changingPassword}>{changingPassword ? 'Alterando...' : 'Alterar Senha'}</button></div>
          </div>
        </div></div>
      )}

      <ConfirmationModal isOpen={showTwoFactorModal} title="Autenticacao 2FA" message={profile.twoFactorEnabled ? "Desativar 2FA?" : "Ativar 2FA?"} type="warning" onConfirm={handleToggleTwoFactor} onCancel={() => setShowTwoFactorModal(false)} confirmText={profile.twoFactorEnabled ? "Desativar" : "Ativar"} />
      <ConfirmationModal isOpen={showSuccessModal} title="Sucesso!" message={successMessage} type="success" onConfirm={() => setShowSuccessModal(false)} onCancel={() => setShowSuccessModal(false)} confirmText="OK" />
      <ErrorModal isOpen={showErrorModal} message={errorMessage} onClose={() => setShowErrorModal(false)} />
    </div>
  );
};

export default ProfilePage;