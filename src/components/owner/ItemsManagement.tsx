import React, { useState, useEffect } from "react";
import { 
  FiPackage, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiBox,
  FiLayers,
  FiTag,
  FiSave,
  FiX,
  FiSearch,
  FiInfo
} from 'react-icons/fi';
import { 
  MdCategory,  
  MdWarning,
  MdEvent,
  MdDescription,
  MdAttachMoney,
} from 'react-icons/md';
import { 
  FaCouch, 
  FaUtensils, 
  FaPalette, 
  FaBoxes 
} from 'react-icons/fa';
import { ConfirmationModal } from '../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../common/Alerts/ErrorModal';
import styles from "./ItemsManagement.module.css";
import { itemService, Item, CreateItemDTO } from '../../services/items';
import { eventService, Event } from '../../services/events';

interface ItemReservation {
  itemId: number;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  quantity: number;
  status: 'RESERVED' | 'CONFIRMED' | 'RETURNED';
}

// Função segura para obter quantidade total
const getQTotal = (item: any): number => {
  if (!item) return 0;
  return Number(item.quantityTotal || 0);
};

export const ItemsManagement: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [reservations, setReservations] = useState<ItemReservation[]>([]);
  
  const [selectedItemForReservation, setSelectedItemForReservation] = useState<Item | null>(null);
  const [editingReservation, setEditingReservation] = useState<ItemReservation | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemsData, eventsData] = await Promise.all([
          itemService.getAllItems(),
          eventService.getAllEvents()
        ]);

        console.log('📦 Itens carregados:', itemsData);
        console.log('📅 Eventos carregados:', eventsData);

        setItems(itemsData);
        setEvents(eventsData);
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        setErrorMessage('Erro ao carregar dados. Verifique a conexão com o servidor.');
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const checkAvailability = (itemId: number, date: string, quantity: number): boolean => {
    const itemReservations = reservations.filter(r => 
      r.itemId === itemId && 
      r.eventDate === date && 
      r.status !== 'RETURNED'
    );
    
    const reservedQuantity = itemReservations.reduce((sum, r) => sum + r.quantity, 0);
    const item = items.find(i => i.id === itemId);
    
    const quantityTotal = getQTotal(item);
    return item ? (quantityTotal - reservedQuantity) >= quantity : false;
  };

  const getItemReservations = (itemId: number): ItemReservation[] => {
    return reservations.filter(r => r.itemId === itemId && r.status !== 'RETURNED');
  };

  const getAvailabilityAlert = (item: Item) => {
    const reserved = reservations
      .filter(r => r.itemId === item.id && r.status !== 'RETURNED')
      .reduce((sum, r) => sum + r.quantity, 0);
    
    const quantityTotal = getQTotal(item);
    const available = quantityTotal - reserved;
    
    if (available <= 0) {
      return { 
        type: 'error', 
        message: 'Indisponível', 
        color: '#ef4444',
        icon: <FiXCircle size={14} />
      };
    } else if (item.minStock && available <= item.minStock) {
      return { 
        type: 'warning', 
        message: `Estoque crítico (${available} un.)`, 
        color: '#f59e0b',
        icon: <MdWarning size={14} />
      };
    } else if (available < quantityTotal * 0.2) {
      return { 
        type: 'warning', 
        message: `Baixo estoque (${available} un.)`, 
        color: '#f59e0b',
        icon: <FiAlertCircle size={14} />
      };
    }
    return { 
      type: 'success', 
      message: `${available} disponíveis`, 
      color: '#10b981',
      icon: <FiCheckCircle size={14} />
    };
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'DECORATION': return <FaPalette size={16} />;
      case 'FURNITURE': return <FaCouch size={16} />;
      case 'UTENSIL': return <FaUtensils size={16} />;
      default: return <FaBoxes size={16} />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: { [key: string]: string } = {
      DECORATION: "Decoração",
      FURNITURE: "Mobiliário",
      UTENSIL: "Utensílios",
      OTHER: "Outros",
    };
    return labels[cat] || cat;
  };

  const handleCreateItem = async (itemData: Omit<Item, "id">, reservationData?: { eventId: number, quantity: number }) => {
    try {
      // Garantir que todos os campos obrigatórios estão presentes e com tipos corretos
      const dataToSend: CreateItemDTO = {
        name: itemData.name,
        category: itemData.category,
        quantityTotal: Number(itemData.quantityTotal) || 1,
        minStock: Number(itemData.minStock) || 0,
        unitPrice: Number(itemData.unitPrice) || 0,
        description: itemData.description
      };

      console.log('📝 Enviando dados para criar item:', dataToSend);
      
      const newItem = await itemService.createItem(dataToSend);
      console.log('✅ Item criado com sucesso:', newItem);
      
      setItems(prev => [...prev, newItem]);
      setShowForm(false);
      
      let msg = 'Item cadastrado com sucesso!';

      if (reservationData && reservationData.eventId && reservationData.quantity > 0) {
        const event = events.find(e => e.id === reservationData.eventId);
        if (event) {
          const newReservation: ItemReservation = {
            itemId: newItem.id,
            eventId: event.id,
            eventTitle: event.title,
            eventDate: event.eventDate,
            quantity: reservationData.quantity,
            status: 'RESERVED'
          };
          setReservations(prev => [...prev, newReservation]);
          msg = 'Item cadastrado E reservado com sucesso!';
        }
      }

      setSuccessMessage(msg);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('❌ Erro detalhado:', error);
      
      let errorMsg = 'Erro ao tentar cadastrar o item.';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
      throw error;
    }
  };

  const handleUpdateItem = async (id: number, itemData: Partial<Item>) => {
    try {
      const dataToSend: Partial<CreateItemDTO> = {
        name: itemData.name,
        category: itemData.category,
        quantityTotal: itemData.quantityTotal !== undefined ? Number(itemData.quantityTotal) : undefined,
        minStock: itemData.minStock !== undefined ? Number(itemData.minStock) : undefined,
        unitPrice: itemData.unitPrice !== undefined ? Number(itemData.unitPrice) : undefined,
        description: itemData.description
      };

      const updatedItem = await itemService.updateItem(id, dataToSend);
      setItems(items.map(item => item.id === id ? updatedItem : item));
      setEditingItem(null);
      setSuccessMessage('Item atualizado com sucesso!');
      setShowSuccessModal(true);
    } catch (error: any) {
      let errorMsg = 'Erro ao tentar atualizar o item.';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
      throw error;
    }
  };

  const handleDeleteItem = (id: number) => {
    setItemToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await itemService.deleteItem(itemToDelete);
      setItems(items.filter(item => item.id !== itemToDelete));
      setReservations(reservations.filter(r => r.itemId !== itemToDelete));
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setSuccessMessage('Item excluído com sucesso!');
      setShowSuccessModal(true);
    } catch (error: any) {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      let errorMsg = 'Erro ao excluir item. Ele pode ter dependências.';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  };

  const handleReserveItem = (itemId: number, eventId: number, quantity: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    if (!checkAvailability(itemId, event.eventDate, quantity)) {
      setErrorMessage('Quantidade indisponível para a data deste evento!');
      setShowErrorModal(true);
      return;
    }

    const newReservation: ItemReservation = {
      itemId,
      eventId,
      eventTitle: event.title,
      eventDate: event.eventDate,
      quantity,
      status: 'RESERVED'
    };

    setReservations([...reservations, newReservation]);
    setSelectedItemForReservation(null);
    setSuccessMessage('Reserva confirmada!');
    setShowSuccessModal(true);
  };

  const handleUpdateReservationQuantity = (itemId: number, eventId: number, newQuantity: number) => {
    setReservations(reservations.map(r => 
      (r.itemId === itemId && r.eventId === eventId) 
        ? { ...r, quantity: newQuantity } 
        : r
    ));
    setEditingReservation(null);
    setSuccessMessage('Quantidade da reserva atualizada!');
    setShowSuccessModal(true);
  };

  const filteredItems = items
    .filter(item => {
      if (searchTerm) {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    })
    .filter(i => filterCategory === "ALL" || i.category === filterCategory)
    .filter(i => !filterLowStock || (() => {
      const reserved = reservations
        .filter(r => r.itemId === i.id && r.status !== 'RETURNED')
        .reduce((sum, r) => sum + r.quantity, 0);
      const quantityTotal = getQTotal(i);
      const available = quantityTotal - reserved;
      return i.minStock ? available <= i.minStock : available < quantityTotal * 0.2;
    })());

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando estoque e eventos...</p>
      </div>
    );
  }

  const activeEvents = events.filter(event => 
    event.status !== 'CANCELLED' && event.status !== 'COMPLETED'
  );

  return (
    <div className={styles.clientManagement}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div>
            <h2 className={styles.pageTitle}>
              <FiPackage size={28} />
              Gestão de Itens e Estoque
            </h2>
            <p className={styles.subtitle}>
              <FiBox size={14} />
              {items.length} itens cadastrados | {activeEvents.length} eventos ativos
            </p>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <select
              className={styles.filterSelect}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="ALL">Todas Categorias</option>
              <option value="FURNITURE">Mobiliário</option>
              <option value="DECORATION">Decoração</option>
              <option value="UTENSIL">Utensílios</option>
              <option value="OTHER">Outros</option>
            </select>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e) => setFilterLowStock(e.target.checked)}
              />
              <FiAlertCircle size={14} />
              Estoque Baixo
            </label>

            <button
              onClick={() => setShowForm(true)}
              className={styles.primaryButton}
            >
              <FiPlus size={18} />
              Novo Item
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <ItemForm
          events={activeEvents}
          onSubmit={handleCreateItem}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingItem && (
        <ItemForm
          item={editingItem}
          events={activeEvents}
          onSubmit={(data) => handleUpdateItem(editingItem.id, data)}
          onCancel={() => setEditingItem(null)}
        />
      )}

      {selectedItemForReservation && (
        <ReservationModal
          item={selectedItemForReservation}
          events={activeEvents}
          onConfirm={handleReserveItem}
          onCancel={() => setSelectedItemForReservation(null)}
          checkAvailability={checkAvailability}
        />
      )}

      {editingReservation && (
        <EditReservationModal
          reservation={editingReservation}
          item={items.find(i => i.id === editingReservation.itemId)!}
          itemReservations={reservations.filter(r => r.itemId === editingReservation.itemId && r.status !== 'RETURNED')}
          onConfirm={handleUpdateReservationQuantity}
          onCancel={() => setEditingReservation(null)}
        />
      )}

      <div className={`${styles.clientsTable} ${styles.card}`}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Categoria</th>
                <th>Inventário Total</th>
                <th>Disponível</th>
                <th>Status</th>
                <th>Reservas Ativas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const alert = getAvailabilityAlert(item);
                const itemReservations = getItemReservations(item.id);
                const quantityTotal = getQTotal(item);
                const available = quantityTotal - itemReservations.reduce((sum, r) => sum + r.quantity, 0);
                
                return (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <strong>{item.name}</strong>
                        <div className={styles.itemDetails}>
                          {item.description && (
                            <small>
                              <MdDescription size={12} />
                              {item.description}
                            </small>
                          )}
                          {item.minStock !== undefined && (
                            <small>
                              <FiAlertCircle size={12} />
                              Alerta mín: {item.minStock} un.
                            </small>
                          )}
                          {item.unitPrice && item.unitPrice > 0 ? (
                            <small>
                              <MdAttachMoney size={12} />
                              {item.unitPrice.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                              })}
                            </small>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>
                        {getCategoryIcon(item.category)}
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.quantityCell}>
                        <FiLayers size={14} />
                        {quantityTotal} un.
                      </div>
                    </td>
                    <td>
                      <div className={styles.availableCell}>
                        <FiCheckCircle size={14} color={available > 0 ? "#10b981" : "#ef4444"} />
                        {available} un.
                      </div>
                    </td>
                    <td>
                      <span 
                        className={styles.availabilityBadge}
                        style={{ 
                          backgroundColor: alert.type === 'error' ? '#fef2f2' : 
                                         alert.type === 'warning' ? '#fffbeb' : '#f0fdf4',
                          color: alert.color,
                          borderColor: alert.color
                        }}
                      >
                        {alert.icon}
                        {alert.message}
                      </span>
                    </td>
                    <td>
                      {itemReservations.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
                          {itemReservations.map((r, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ flex: 1 }}>
                                <strong style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>{r.eventTitle}</strong>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#64748b' }}>
                                  <span><FiCalendar size={10} /> {new Date(r.eventDate).toLocaleDateString('pt-BR')}</span>
                                  <span style={{ fontWeight: 'bold', color: '#0f172a' }}><FiLayers size={10} /> Qtd reservada: {r.quantity}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => setEditingReservation(r)} 
                                className={styles.editButton} 
                                style={{ padding: '6px', background: '#e0f2fe', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#0284c7', marginLeft: '8px' }}
                                title="Editar quantidade"
                              >
                                <FiEdit2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className={styles.noReservations}>
                          <FiCalendar size={14} /> Nenhuma reserva
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => setSelectedItemForReservation(item)}
                          className={styles.reserveButton}
                          title="Fazer nova reserva"
                          disabled={available <= 0}
                          style={{ opacity: available <= 0 ? 0.5 : 1, cursor: available <= 0 ? 'not-allowed' : 'pointer' }}
                        >
                          <FiCalendar size={16} />
                        </button>
                        <button
                          onClick={() => setEditingItem(item)}
                          className={styles.editButton}
                          title="Editar cadastro do item"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className={styles.deleteButton}
                          title="Excluir item"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiPackage size={48} />
            </div>
            <h3 className={styles.emptyTitle}>Nenhum item encontrado</h3>
            <p className={styles.emptyText}>
              Você não possui itens cadastrados ou nenhum item atende aos filtros atuais.
            </p>
            {!searchTerm && filterCategory === 'ALL' && !filterLowStock && (
              <button
                onClick={() => setShowForm(true)}
                className={styles.primaryButton}
              >
                <FiPlus size={18} />
                Cadastrar Meu Primeiro Item
              </button>
            )}
          </div>
        )}
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: '#e0f2fe' }}>
            <FiPackage color="#0284c7" size={24} />
          </div>
          <div className={styles.summaryInfo}>
            <strong>{items.length}</strong>
            <span>Total de Itens</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: '#dcfce7' }}>
            <FiCheckCircle color="#10b981" size={24} />
          </div>
          <div className={styles.summaryInfo}>
            <strong>{items.reduce((sum, item) => {
              const reserved = reservations
                .filter(r => r.itemId === item.id && r.status !== 'RETURNED')
                .reduce((s, r) => s + r.quantity, 0);
              const qTotal = getQTotal(item);
              return sum + (qTotal - reserved);
            }, 0)}</strong>
            <span>Unidades Disponíveis</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: '#fef3c7' }}>
            <MdWarning color="#f59e0b" size={24} />
          </div>
          <div className={styles.summaryInfo}>
            <strong>{items.filter(item => {
              const reserved = reservations
                .filter(r => r.itemId === item.id && r.status !== 'RETURNED')
                .reduce((s, r) => s + r.quantity, 0);
              const qTotal = getQTotal(item);
              const available = qTotal - reserved;
              return item.minStock ? available <= item.minStock : available < qTotal * 0.2;
            }).length}</strong>
            <span>Estoque Baixo</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: '#fee2e2' }}>
            <FiXCircle color="#ef4444" size={24} />
          </div>
          <div className={styles.summaryInfo}>
            <strong>{items.filter(item => {
              const reserved = reservations
                .filter(r => r.itemId === item.id && r.status !== 'RETURNED')
                .reduce((s, r) => s + r.quantity, 0);
              const qTotal = getQTotal(item);
              return (qTotal - reserved) <= 0;
            }).length}</strong>
            <span>Indisponíveis</span>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showSuccessModal}
        title="Sucesso!"
        message={successMessage}
        type="success"
        onConfirm={() => setShowSuccessModal(false)}
        onCancel={() => setShowSuccessModal(false)}
        confirmText="OK"
      />

      <ErrorModal
        isOpen={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este item permanentemente?"
        type="warning"
        onConfirm={confirmDeleteItem}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        confirmText="Excluir"
      />
    </div>
  );
};

interface ItemFormProps {
  item?: Item;
  events: Event[];
  onSubmit: (data: any, reservationData?: {eventId: number, quantity: number}) => Promise<void>;
  onCancel: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, events, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    category: item?.category || "DECORATION",
    quantityTotal: item?.quantityTotal || 1,
    description: item?.description || "",
    minStock: item?.minStock || 5,
    unitPrice: item?.unitPrice || 0,
  });

  // Estados para controle dos inputs
  const [quantityTotalInput, setQuantityTotalInput] = useState<string>(item?.quantityTotal?.toString() || "1");
  const [minStockInput, setMinStockInput] = useState<string>(item?.minStock?.toString() || "5");
  const [unitPriceInput, setUnitPriceInput] = useState<string>(
    item?.unitPrice ? item.unitPrice.toFixed(2).replace('.', ',') : "0,00"
  );

  const [assignToEvent, setAssignToEvent] = useState(false);
  const [reservationData, setReservationData] = useState({
    eventId: '',
    quantity: 1
  });
  const [reservationQuantityInput, setReservationQuantityInput] = useState<string>("1");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Handlers específicos para cada input
  const handleQuantityTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuantityTotalInput(value);
    
    if (value === '' || value === '-') {
      setFormData(prev => ({ ...prev, quantityTotal: 0 }));
    } else {
      const num = parseInt(value);
      if (!isNaN(num)) {
        setFormData(prev => ({ ...prev, quantityTotal: num }));
      }
    }
  };

  const handleQuantityTotalBlur = () => {
    if (quantityTotalInput === '' || quantityTotalInput === '-' || parseInt(quantityTotalInput) < 1) {
      setQuantityTotalInput("1");
      setFormData(prev => ({ ...prev, quantityTotal: 1 }));
    }
  };

  const handleMinStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMinStockInput(value);
    
    if (value === '' || value === '-') {
      setFormData(prev => ({ ...prev, minStock: 0 }));
    } else {
      const num = parseInt(value);
      if (!isNaN(num)) {
        setFormData(prev => ({ ...prev, minStock: num }));
      }
    }
  };

  const handleMinStockBlur = () => {
    if (minStockInput === '' || minStockInput === '-') {
      setMinStockInput("0");
      setFormData(prev => ({ ...prev, minStock: 0 }));
    }
  };

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Permite apenas números, vírgula e ponto
    value = value.replace(/[^\d,.]/g, '');
    
    setUnitPriceInput(value);
    
    if (value === '' || value === ',') {
      setFormData(prev => ({ ...prev, unitPrice: 0 }));
      return;
    }
    
    // Converte para número (formato brasileiro: vírgula como decimal)
    const normalizedValue = value.replace(',', '.');
    const num = parseFloat(normalizedValue);
    
    if (!isNaN(num)) {
      setFormData(prev => ({ ...prev, unitPrice: num }));
    }
  };

  const handleUnitPriceBlur = () => {
    if (unitPriceInput === '' || unitPriceInput === ',') {
      setUnitPriceInput("0,00");
      setFormData(prev => ({ ...prev, unitPrice: 0 }));
    } else {
      // Formata para 2 casas decimais
      const num = formData.unitPrice;
      setUnitPriceInput(num.toFixed(2).replace('.', ','));
    }
  };

  const handleReservationQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReservationQuantityInput(value);
    
    if (value === '' || value === '-') {
      setReservationData(prev => ({ ...prev, quantity: 0 }));
    } else {
      const num = parseInt(value);
      if (!isNaN(num)) {
        setReservationData(prev => ({ ...prev, quantity: num }));
      }
    }
  };

  const handleReservationQuantityBlur = () => {
    if (reservationQuantityInput === '' || reservationQuantityInput === '-' || parseInt(reservationQuantityInput) < 1) {
      setReservationQuantityInput("1");
      setReservationData(prev => ({ ...prev, quantity: 1 }));
    } else {
      // Garante que não ultrapasse o máximo
      const max = formData.quantityTotal;
      if (reservationData.quantity > max) {
        setReservationQuantityInput(max.toString());
        setReservationData(prev => ({ ...prev, quantity: max }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) newErrors.name = "O nome é obrigatório";
    if (formData.quantityTotal < 1)
      newErrors.quantityTotal = "Você precisa de no mínimo 1 unidade.";
    if (formData.minStock < 0)
      newErrors.minStock = "Não pode ser negativo.";
    if (formData.unitPrice <= 0)
      newErrors.unitPrice = "Preço deve ser maior que zero.";
      
    if (assignToEvent && !reservationData.eventId) {
      newErrors.eventId = "Selecione um evento válido.";
    }
    if (assignToEvent && reservationData.quantity > formData.quantityTotal) {
      newErrors.reservationQty = "Você não pode reservar mais do que possui.";
    }
    if (assignToEvent && reservationData.quantity < 1) {
      newErrors.reservationQty = "A quantidade deve ser no mínimo 1.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Garantir que os valores são números válidos antes de enviar
    const dataToSubmit = {
      name: formData.name.trim(),
      category: formData.category,
      quantityTotal: Number(formData.quantityTotal) || 1,
      description: formData.description.trim() || undefined,
      minStock: Number(formData.minStock) || 0,
      unitPrice: Number(formData.unitPrice) || 0
    };

    console.log('📝 Dados a serem enviados:', dataToSubmit);

    // Validar novamente antes de enviar
    if (dataToSubmit.quantityTotal < 1) {
      setErrors({ ...errors, quantityTotal: "Quantidade total deve ser no mínimo 1" });
      return;
    }

    if (dataToSubmit.unitPrice <= 0) {
      setErrors({ ...errors, unitPrice: "Preço deve ser maior que zero" });
      return;
    }

    setLoading(true);
    try {
      const resData = assignToEvent && reservationData.eventId
        ? { 
            eventId: Number(reservationData.eventId), 
            quantity: Number(reservationData.quantity) || 1 
          }
        : undefined;
        
      await onSubmit(dataToSubmit, resData);
    } catch (error) {
      console.error('❌ Erro no submit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} style={{ overflowY: 'auto', padding: '20px' }}>
      <div className={`${styles.modal} ${styles.card}`} style={{ margin: 'auto', maxWidth: '600px' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <FiPackage size={20} />
            {item ? "Editar Item" : "Novo Item no Estoque"}
          </h3>
          <button onClick={onCancel} className={styles.closeButton}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FiTag size={14} />
                Nome do Item *
              </label>
              <input
                type="text"
                placeholder="Ex: Cadeira de Plástico Branca"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`${styles.formInput} ${errors.name ? styles.error : ''}`}
              />
              {errors.name && (
                <span className={styles.errorText}>{errors.name}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <MdCategory size={14} />
                Categoria *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as any })
                }
                className={styles.formInput}
              >
                <option value="DECORATION">Decoração</option>
                <option value="FURNITURE">Mobiliário</option>
                <option value="UTENSIL">Utensílios</option>
                <option value="OTHER">Outros</option>
              </select>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FiLayers size={14} />
                Estoque Físico Total *
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantityTotalInput}
                onChange={handleQuantityTotalChange}
                onBlur={handleQuantityTotalBlur}
                className={`${styles.formInput} ${errors.quantityTotal ? styles.error : ''}`}
                placeholder="1"
              />
              <small className={styles.helpText}>
                <FiInfo size={12}/> Quantas unidades totais você possui no galpão/estoque.
              </small>
              {errors.quantityTotal && (
                <span className={styles.errorText}>{errors.quantityTotal}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FiAlertCircle size={14} />
                Alerta de Estoque Mínimo
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={minStockInput}
                onChange={handleMinStockChange}
                onBlur={handleMinStockBlur}
                className={`${styles.formInput} ${errors.minStock ? styles.error : ''}`}
                placeholder="0"
              />
              <small className={styles.helpText}>
                <FiInfo size={12}/> O sistema avisa se a quantidade disponível cair abaixo disso.
              </small>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <MdAttachMoney size={14} />
                Preço Unitário (R$) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={unitPriceInput}
                onChange={handleUnitPriceChange}
                onBlur={handleUnitPriceBlur}
                className={`${styles.formInput} ${errors.unitPrice ? styles.error : ''}`}
                placeholder="0,00"
              />
              {errors.unitPrice && (
                <span className={styles.errorText}>{errors.unitPrice}</span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <MdDescription size={14} />
              Descrição Extra (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Cadeira arranhada, necessita capa..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={styles.formTextarea}
            />
          </div>

          {!item && (
            <div style={{ marginTop: '20px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#0f172a' }}>
                <input 
                  type="checkbox" 
                  checked={assignToEvent}
                  onChange={(e) => setAssignToEvent(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                Deseja já reservar este item para um evento?
              </label>
              
              {assignToEvent && (
                <div className={styles.formGrid} style={{ marginTop: '16px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px' }}>Vincular a qual Evento? *</label>
                    <select
                      value={reservationData.eventId}
                      onChange={(e) => setReservationData({ ...reservationData, eventId: e.target.value })}
                      className={`${styles.formInput} ${errors.eventId ? styles.error : ''}`}
                    >
                      <option value="">-- Selecione na lista --</option>
                      {events.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.title} - {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                        </option>
                      ))}
                    </select>
                    {errors.eventId && <span className={styles.errorText}>{errors.eventId}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '12px' }}>Quantidade a Reservar *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={reservationQuantityInput}
                      onChange={handleReservationQuantityChange}
                      onBlur={handleReservationQuantityBlur}
                      className={`${styles.formInput} ${errors.reservationQty ? styles.error : ''}`}
                      placeholder="1"
                    />
                    {errors.reservationQty && <span className={styles.errorText}>{errors.reservationQty}</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.formActions} style={{ marginTop: '24px' }}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.secondaryButton}
              disabled={loading}
            >
              <FiX size={16} />
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.buttonSpinner}></span>
                  Salvando no Banco...
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  {item ? "Atualizar Estoque" : "Cadastrar e Salvar"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ReservationModalProps {
  item: Item;
  events: Event[];
  onConfirm: (itemId: number, eventId: number, quantity: number) => void;
  onCancel: () => void;
  checkAvailability: (itemId: number, date: string, quantity: number) => boolean;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ item, events, onConfirm, onCancel, checkAvailability }) => {
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [quantityInput, setQuantityInput] = useState<string>("1");
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const qTotal = getQTotal(item);
  
  const maxAvailable = qTotal;

  const handleEventChange = (eventId: number) => {
    setSelectedEventId(eventId);
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedDate(event.eventDate);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuantityInput(value);
    
    if (value === '' || value === '-') {
      setQuantity(0);
    } else {
      const num = parseInt(value);
      if (!isNaN(num)) {
        setQuantity(num);
      }
    }
  };

  const handleQuantityBlur = () => {
    if (quantityInput === '' || quantityInput === '-' || quantity < 1) {
      setQuantityInput("1");
      setQuantity(1);
    } else if (quantity > maxAvailable) {
      setQuantityInput(maxAvailable.toString());
      setQuantity(maxAvailable);
    }
  };

  const isAvailable = selectedEventId && selectedDate
    ? checkAvailability(item.id, selectedDate, quantity)
    : true;

  const handleConfirm = () => {
    if (selectedEventId && isAvailable && quantity > 0) {
      onConfirm(item.id, selectedEventId, quantity);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.card}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <FiCalendar size={20} />
            Nova Reserva de Item
          </h3>
          <button onClick={onCancel} className={styles.closeButton}>
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.itemInfoCard}>
            <div className={styles.itemIcon}>
              <FiPackage size={24} />
            </div>
            <div className={styles.itemDetails}>
              <strong>{item.name}</strong>
              <span>
                <FiLayers size={12} />
                Inventário Total: {qTotal} unidades
              </span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <MdEvent size={14} />
              Vincular a qual Evento? *
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(Number(e.target.value))}
              className={styles.formInput}
            >
              <option value="">-- Selecione o Evento na lista --</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title} - {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <FiLayers size={14} />
              Quantidade a Reservar *
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantityInput}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              className={styles.formInput}
              placeholder="1"
            />
          </div>

          {selectedEventId && selectedDate && (
            <div className={styles.availabilityInfo}>
              {isAvailable ? (
                <div className={styles.availableMessage}>
                  <FiCheckCircle size={18} color="#10b981" />
                  Quantidade disponível para a data!
                </div>
              ) : (
                <div className={styles.unavailableMessage}>
                  <FiXCircle size={18} color="#ef4444" />
                  Você não tem essa quantidade disponível nesta data.
                </div>
              )}
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" onClick={onCancel} className={styles.secondaryButton}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={styles.primaryButton}
              disabled={!selectedEventId || !quantity || !isAvailable}
            >
              Confirmar Reserva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EditReservationModalProps {
  reservation: ItemReservation;
  item: Item;
  itemReservations: ItemReservation[];
  onConfirm: (itemId: number, eventId: number, newQty: number) => void;
  onCancel: () => void;
}

const EditReservationModal: React.FC<EditReservationModalProps> = ({ reservation, item, itemReservations, onConfirm, onCancel }) => {
  const [newQuantityInput, setNewQuantityInput] = useState<string>(reservation.quantity.toString());
  const [newQuantity, setNewQuantity] = useState<number>(reservation.quantity);

  const otherReservationsSum = itemReservations
    .filter(r => r.eventId !== reservation.eventId)
    .reduce((sum, r) => sum + r.quantity, 0);

  const qTotal = getQTotal(item);
  const maxAvailableNow = qTotal - otherReservationsSum;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewQuantityInput(value);
    
    if (value === '' || value === '-') {
      setNewQuantity(0);
    } else {
      const num = parseInt(value);
      if (!isNaN(num)) {
        setNewQuantity(num);
      }
    }
  };

  const handleQuantityBlur = () => {
    if (newQuantityInput === '' || newQuantityInput === '-' || newQuantity < 1) {
      setNewQuantityInput("1");
      setNewQuantity(1);
    } else if (newQuantity > maxAvailableNow) {
      setNewQuantityInput(maxAvailableNow.toString());
      setNewQuantity(maxAvailableNow);
    }
  };

  const isAvailable = newQuantity > 0 && newQuantity <= maxAvailableNow;

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.card}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <FiEdit2 size={20} />
            Alterar Quantidade da Reserva
          </h3>
          <button onClick={onCancel} className={styles.closeButton}>
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.itemInfoCard}>
            <div className={styles.itemDetails}>
              <strong>{item.name}</strong>
              <span>Evento: {reservation.eventTitle}</span>
              <span>Data de Uso: {new Date(reservation.eventDate).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <FiLayers size={14} />
              Nova Quantidade a Reservar
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={newQuantityInput}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              className={styles.formInput}
            />
            <small className={styles.helpText}>
              Máximo disponível (considerando outras reservas): {maxAvailableNow} un.
            </small>
          </div>

          <div className={styles.availabilityInfo}>
            {isAvailable ? (
              <div className={styles.availableMessage}>
                <FiCheckCircle size={18} color="#10b981" />
                Alteração válida.
              </div>
            ) : (
              <div className={styles.unavailableMessage}>
                <FiXCircle size={18} color="#ef4444" />
                Excede o limite físico.
              </div>
            )}
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onCancel} className={styles.secondaryButton}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(reservation.itemId, reservation.eventId, newQuantity)}
              className={styles.primaryButton}
              disabled={!isAvailable}
            >
              Salvar Alteração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemsManagement;