// src/components/admin/items/ItemsManagement.tsx

import React, { useState, useEffect } from "react";
import { 
  FiPackage, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiCalendar,
  FiFilter,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiBox,
  FiLayers,
  FiTag,
  FiSave,
  FiX
} from 'react-icons/fi';
import { 
  MdCategory, 
  MdInventory, 
  MdWarning,
  MdEvent,
  MdDescription,
  MdAttachMoney,
  MdCheck,
  MdClose
} from 'react-icons/md';
import { 
  FaCouch, 
  FaUtensils, 
  FaPalette, 
  FaBoxes 
} from 'react-icons/fa';
import { itemService } from '../../services/items';
import { eventService } from '../../services/events';
import styles from "./ItemsManagement.module.css";

export interface Item {
  id: number;
  name: string;
  category: "DECORATION" | "FURNITURE" | "UTENSIL" | "OTHER";
  quantityTotal: number;
  quantityAvailable: number;
  description?: string;
  minStock?: number;
  unitPrice?: number;
}

interface ItemReservation {
  itemId: number;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  quantity: number;
  status: 'RESERVED' | 'CONFIRMED' | 'RETURNED';
}

export const ItemsManagement: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [reservations, setReservations] = useState<ItemReservation[]>([]);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedItemForReservation, setSelectedItemForReservation] = useState<Item | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, eventsData] = await Promise.all([
        itemService.getAllItems(),
        eventService.getAllEvents()
      ]);
      setItems(itemsData);
      setEvents(eventsData);
      
      // Carregar reservas do localStorage
      const savedReservations = localStorage.getItem('itemReservations');
      if (savedReservations) {
        setReservations(JSON.parse(savedReservations));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveReservations = (updatedReservations: ItemReservation[]) => {
    setReservations(updatedReservations);
    localStorage.setItem('itemReservations', JSON.stringify(updatedReservations));
  };

  const checkAvailability = (itemId: number, date: string, quantity: number): boolean => {
    const itemReservations = reservations.filter(r => 
      r.itemId === itemId && 
      r.eventDate === date && 
      r.status !== 'RETURNED'
    );
    
    const reservedQuantity = itemReservations.reduce((sum, r) => sum + r.quantity, 0);
    const item = items.find(i => i.id === itemId);
    
    return item ? (item.quantityTotal - reservedQuantity) >= quantity : false;
  };

  const getItemReservations = (itemId: number): ItemReservation[] => {
    return reservations.filter(r => r.itemId === itemId && r.status !== 'RETURNED');
  };

  const getAvailabilityAlert = (item: Item) => {
    const reserved = reservations
      .filter(r => r.itemId === item.id && r.status !== 'RETURNED')
      .reduce((sum, r) => sum + r.quantity, 0);
    
    const available = item.quantityTotal - reserved;
    
    if (available === 0) {
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
    } else if (available < item.quantityTotal * 0.2) {
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

  const handleCreateItem = async (itemData: Omit<Item, "id">) => {
    try {
      await itemService.createItem(itemData);
      await loadData();
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao criar item:", error);
    }
  };

  const handleUpdateItem = async (id: number, itemData: Partial<Item>) => {
    try {
      await itemService.updateItem(id, itemData);
      await loadData();
      setEditingItem(null);
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este item?")) {
      try {
        await itemService.deleteItem(id);
        await loadData();
      } catch (error) {
        console.error("Erro ao excluir item:", error);
      }
    }
  };

  const handleReserveItem = (itemId: number, eventId: number, quantity: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    if (!checkAvailability(itemId, event.eventDate, quantity)) {
      alert('Quantidade indisponível para esta data!');
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

    const updatedReservations = [...reservations, newReservation];
    saveReservations(updatedReservations);
    setSelectedItemForReservation(null);
    alert('Item reservado com sucesso!');
  };

  const filteredItems = items
    .filter(i => filterCategory === "ALL" || i.category === filterCategory)
    .filter(i => !filterLowStock || (() => {
      const reserved = reservations
        .filter(r => r.itemId === i.id && r.status !== 'RETURNED')
        .reduce((sum, r) => sum + r.quantity, 0);
      const available = i.quantityTotal - reserved;
      return i.minStock ? available <= i.minStock : available < i.quantityTotal * 0.2;
    })());

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando estoque...</p>
      </div>
    );
  }

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
              {items.length} itens cadastrados
            </p>
          </div>

          <div className={styles.headerActions}>
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
              Mostrar apenas itens com estoque baixo
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
          onSubmit={handleCreateItem}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingItem && (
        <ItemForm
          item={editingItem}
          onSubmit={(data) => handleUpdateItem(editingItem.id, data)}
          onCancel={() => setEditingItem(null)}
        />
      )}

      {selectedItemForReservation && (
        <ReservationModal
          item={selectedItemForReservation}
          events={events.filter(e => e.status === 'CONFIRMED' || e.status === 'QUOTE')}
          onConfirm={handleReserveItem}
          onCancel={() => setSelectedItemForReservation(null)}
          checkAvailability={checkAvailability}
        />
      )}

      <div className={`${styles.clientsTable} ${styles.card}`}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Categoria</th>
                <th>Total</th>
                <th>Disponível</th>
                <th>Status</th>
                <th>Reservas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const alert = getAvailabilityAlert(item);
                const itemReservations = getItemReservations(item.id);
                
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
                          {item.minStock && (
                            <small>
                              <FiLayers size={12} />
                              Estoque mínimo: {item.minStock} un.
                            </small>
                          )}
                          {item.unitPrice && item.unitPrice > 0 && (
                            <small>
                              <MdAttachMoney size={12} />
                              {item.unitPrice.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                              })}
                            </small>
                          )}
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
                        {item.quantityTotal} un.
                      </div>
                    </td>
                    <td>
                      <div className={styles.availableCell}>
                        <FiCheckCircle size={14} />
                        {item.quantityTotal - itemReservations.reduce((sum, r) => sum + r.quantity, 0)} un.
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
                        <div className={styles.reservationsCell}>
                          <span className={styles.reservationCount}>
                            <MdEvent size={14} />
                            {itemReservations.length} reserva(s)
                          </span>
                          <div className={styles.reservationTooltip}>
                            {itemReservations.map((r, i) => (
                              <div key={i} className={styles.reservationItem}>
                                <strong>{r.eventTitle}</strong>
                                <span>
                                  <FiCalendar size={12} />
                                  Data: {new Date(r.eventDate).toLocaleDateString('pt-BR')}
                                </span>
                                <span>
                                  <FiLayers size={12} />
                                  Qtd: {r.quantity} un.
                                </span>
                                <span className={styles[r.status.toLowerCase()]}>
                                  {r.status === 'RESERVED' && '🔵 Reservado'}
                                  {r.status === 'CONFIRMED' && '✅ Confirmado'}
                                  {r.status === 'RETURNED' && '🔄 Devolvido'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className={styles.noReservations}>
                          <FiCalendar size={14} />
                          Sem reservas
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => setSelectedItemForReservation(item)}
                          className={styles.reserveButton}
                          title="Reservar item"
                        >
                          <FiCalendar size={16} />
                        </button>
                        <button
                          onClick={() => setEditingItem(item)}
                          className={styles.editButton}
                          title="Editar item"
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
              {filterLowStock 
                ? 'Não há itens com estoque baixo no momento.'
                : 'Cadastre itens no seu estoque para gerenciá-los aqui.'}
            </p>
            {!filterLowStock && (
              <button
                onClick={() => setShowForm(true)}
                className={styles.primaryButton}
              >
                <FiPlus size={18} />
                Cadastrar Primeiro Item
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ItemFormProps {
  item?: Item;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    category: item?.category || "DECORATION",
    quantityTotal: item?.quantityTotal || 1,
    description: item?.description || "",
    minStock: item?.minStock || 5,
    unitPrice: item?.unitPrice || 0,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    if (formData.quantityTotal < 1)
      newErrors.quantityTotal = "Quantidade deve ser maior que 0";
    if (formData.minStock < 0)
      newErrors.minStock = "Estoque mínimo não pode ser negativo";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        quantityAvailable: item ? item.quantityAvailable : formData.quantityTotal,
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'DECORATION': return <FaPalette size={16} />;
      case 'FURNITURE': return <FaCouch size={16} />;
      case 'UTENSIL': return <FaUtensils size={16} />;
      default: return <FaBoxes size={16} />;
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.card}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <FiPackage size={20} />
            {item ? "Editar Item" : "Novo Item"}
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
                placeholder="Ex: Cadeira de Ferro"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={styles.formInput}
              />
              {errors.name && (
                <span className={styles.error}>{errors.name}</span>
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
                Quantidade Total *
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantityTotal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantityTotal: parseInt(e.target.value),
                  })
                }
                className={styles.formInput}
              />
              {errors.quantityTotal && (
                <span className={styles.error}>{errors.quantityTotal}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <FiAlertCircle size={14} />
                Estoque Mínimo
              </label>
              <input
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minStock: parseInt(e.target.value),
                  })
                }
                className={styles.formInput}
              />
              {errors.minStock && (
                <span className={styles.error}>{errors.minStock}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <MdAttachMoney size={14} />
                Preço Unitário
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unitPrice: parseFloat(e.target.value),
                  })
                }
                className={styles.formInput}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <MdDescription size={14} />
              Descrição (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Detalhes sobre o item (cor, material, dimensões)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={styles.formTextarea}
            />
          </div>

          <div className={styles.formActions}>
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
                  Salvando...
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  {item ? "Atualizar" : "Cadastrar"}
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

const ReservationModal: React.FC<ReservationModalProps> = ({
  item,
  events,
  onConfirm,
  onCancel,
  checkAvailability
}) => {
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const handleEventChange = (eventId: number) => {
    setSelectedEventId(eventId);
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedDate(event.eventDate);
    }
  };

  const isAvailable = selectedEventId && selectedDate
    ? checkAvailability(item.id, selectedDate, quantity)
    : true;

  const handleConfirm = () => {
    if (selectedEventId && isAvailable) {
      onConfirm(item.id, selectedEventId, quantity);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.card}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <FiCalendar size={20} />
            Reservar Item
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
                Total disponível: {item.quantityTotal} un.
              </span>
              {item.unitPrice && item.unitPrice > 0 && (
                <span>
                  <MdAttachMoney size={12} />
                  {item.unitPrice.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <MdEvent size={14} />
              Selecione o Evento *
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(Number(e.target.value))}
              className={styles.formInput}
            >
              <option value="">Selecione um evento</option>
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
              Quantidade *
            </label>
            <input
              type="number"
              min="1"
              max={item.quantityTotal}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className={styles.formInput}
            />
          </div>

          {selectedEventId && selectedDate && (
            <div className={styles.availabilityInfo}>
              {isAvailable ? (
                <div className={styles.availableMessage}>
                  <FiCheckCircle size={18} />
                  Disponível para esta data
                </div>
              ) : (
                <div className={styles.unavailableMessage}>
                  <FiXCircle size={18} />
                  Quantidade indisponível para esta data
                </div>
              )}
            </div>
          )}

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.secondaryButton}
            >
              <FiX size={16} />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={styles.primaryButton}
              disabled={!selectedEventId || !quantity || !isAvailable}
            >
              <FiCheckCircle size={16} />
              Confirmar Reserva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};