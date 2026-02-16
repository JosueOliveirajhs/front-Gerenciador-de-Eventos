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
  FiX,
  FiSearch
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
import { ConfirmationModal } from '../common/Alerts/ConfirmationModal';
import { ErrorModal } from '../common/Alerts/ErrorModal';
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

// Dados mocados
const MOCK_ITEMS: Item[] = [
  {
    id: 1,
    name: "Cadeira Tiffany Branca",
    category: "FURNITURE",
    quantityTotal: 100,
    quantityAvailable: 85,
    description: "Cadeira clássica para casamentos e eventos formais",
    minStock: 20,
    unitPrice: 15.00
  },
  {
    id: 2,
    name: "Mesa Redonda 1.80m",
    category: "FURNITURE",
    quantityTotal: 50,
    quantityAvailable: 42,
    description: "Mesa redonda para 10 pessoas",
    minStock: 10,
    unitPrice: 45.00
  },
  {
    id: 3,
    name: "Jogo de Talheres Inox",
    category: "UTENSIL",
    quantityTotal: 500,
    quantityAvailable: 480,
    description: "Jogo completo com garfo, faca e colher",
    minStock: 100,
    unitPrice: 2.50
  },
  {
    id: 4,
    name: "Arranjo de Flores Artificial",
    category: "DECORATION",
    quantityTotal: 30,
    quantityAvailable: 12,
    description: "Arranjo decorativo para centro de mesa",
    minStock: 5,
    unitPrice: 25.00
  },
  {
    id: 5,
    name: "Tapete Vermelho 10m",
    category: "DECORATION",
    quantityTotal: 5,
    quantityAvailable: 2,
    description: "Tapete para cerimônias e eventos especiais",
    minStock: 2,
    unitPrice: 80.00
  },
  {
    id: 6,
    name: "Sofá 3 Lugares",
    category: "FURNITURE",
    quantityTotal: 8,
    quantityAvailable: 3,
    description: "Sofá para lounge e áreas de espera",
    minStock: 2,
    unitPrice: 120.00
  },
  {
    id: 7,
    name: "Jogo de Pratos",
    category: "UTENSIL",
    quantityTotal: 400,
    quantityAvailable: 350,
    description: "Prato branco de porcelana 25cm",
    minStock: 80,
    unitPrice: 3.00
  },
  {
    id: 8,
    name: "Luminária Pendente",
    category: "DECORATION",
    quantityTotal: 12,
    quantityAvailable: 4,
    description: "Iluminação decorativa para ambientes",
    minStock: 3,
    unitPrice: 45.00
  },
  {
    id: 9,
    name: "Painel de Flores",
    category: "DECORATION",
    quantityTotal: 3,
    quantityAvailable: 1,
    description: "Painel decorativo 2x3m",
    minStock: 1,
    unitPrice: 250.00
  },
  {
    id: 10,
    name: "Banqueta Alta",
    category: "FURNITURE",
    quantityTotal: 40,
    quantityAvailable: 25,
    description: "Banqueta para bar e mesas altas",
    minStock: 8,
    unitPrice: 35.00
  }
];

const MOCK_EVENTS = [
  { id: 1, title: "Casamento João & Maria", eventDate: "2026-03-15", status: "CONFIRMED" },
  { id: 2, title: "Aniversário de 15 anos - Sofia", eventDate: "2026-03-20", status: "CONFIRMED" },
  { id: 3, title: "Formatura Direito", eventDate: "2026-04-05", status: "QUOTE" },
  { id: 4, title: "Evento Corporativo - Empresa X", eventDate: "2026-03-25", status: "CONFIRMED" },
  { id: 5, title: "Casamento Pedro & Ana", eventDate: "2026-04-10", status: "CONFIRMED" }
];

const MOCK_RESERVATIONS: ItemReservation[] = [
  {
    itemId: 1,
    eventId: 1,
    eventTitle: "Casamento João & Maria",
    eventDate: "2026-03-15",
    quantity: 50,
    status: "CONFIRMED"
  },
  {
    itemId: 1,
    eventId: 4,
    eventTitle: "Evento Corporativo - Empresa X",
    eventDate: "2026-03-25",
    quantity: 30,
    status: "RESERVED"
  },
  {
    itemId: 3,
    eventId: 1,
    eventTitle: "Casamento João & Maria",
    eventDate: "2026-03-15",
    quantity: 200,
    status: "CONFIRMED"
  },
  {
    itemId: 4,
    eventId: 2,
    eventTitle: "Aniversário de 15 anos - Sofia",
    eventDate: "2026-03-20",
    quantity: 15,
    status: "RESERVED"
  },
  {
    itemId: 5,
    eventId: 1,
    eventTitle: "Casamento João & Maria",
    eventDate: "2026-03-15",
    quantity: 1,
    status: "CONFIRMED"
  },
  {
    itemId: 6,
    eventId: 4,
    eventTitle: "Evento Corporativo - Empresa X",
    eventDate: "2026-03-25",
    quantity: 4,
    status: "RESERVED"
  },
  {
    itemId: 8,
    eventId: 1,
    eventTitle: "Casamento João & Maria",
    eventDate: "2026-03-15",
    quantity: 8,
    status: "CONFIRMED"
  },
  {
    itemId: 9,
    eventId: 1,
    eventTitle: "Casamento João & Maria",
    eventDate: "2026-03-15",
    quantity: 1,
    status: "CONFIRMED"
  }
];

export const ItemsManagement: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [events] = useState(MOCK_EVENTS);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reservations, setReservations] = useState<ItemReservation[]>([]);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedItemForReservation, setSelectedItemForReservation] = useState<Item | null>(null);

  // Estados para modais
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setItems(MOCK_ITEMS);
      setReservations(MOCK_RESERVATIONS);
      setLoading(false);
    }, 800);
  }, []);

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

  const handleCreateItem = (itemData: Omit<Item, "id">) => {
    const newItem = {
      ...itemData,
      id: Math.max(...items.map(i => i.id), 0) + 1,
      quantityAvailable: itemData.quantityTotal
    };
    setItems([...items, newItem as Item]);
    setShowForm(false);
    setSuccessMessage('Item criado com sucesso!');
    setShowSuccessModal(true);
  };

  const handleUpdateItem = (id: number, itemData: Partial<Item>) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, ...itemData } : item
    ));
    setEditingItem(null);
    setSuccessMessage('Item atualizado com sucesso!');
    setShowSuccessModal(true);
  };

  const handleDeleteItem = (id: number) => {
    setItemToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteItem = () => {
    if (!itemToDelete) return;
    
    setItems(items.filter(item => item.id !== itemToDelete));
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setSuccessMessage('Item excluído com sucesso!');
    setShowSuccessModal(true);
  };

  const handleReserveItem = (itemId: number, eventId: number, quantity: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    if (!checkAvailability(itemId, event.eventDate, quantity)) {
      setErrorMessage('Quantidade indisponível para esta data!');
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
    setSuccessMessage('Item reservado com sucesso!');
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
              {items.length} itens cadastrados | {reservations.length} reservas ativas
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
              Apenas estoque baixo
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
                const available = item.quantityTotal - itemReservations.reduce((sum, r) => sum + r.quantity, 0);
                
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
                              Mín: {item.minStock} un.
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
                          disabled={available === 0}
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
              {searchTerm || filterCategory !== 'ALL' || filterLowStock
                ? 'Tente ajustar os filtros para encontrar itens.'
                : 'Cadastre itens no seu estoque para gerenciá-los aqui.'}
            </p>
            {!searchTerm && filterCategory === 'ALL' && !filterLowStock && (
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

      {/* Cards de resumo */}
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
              return sum + (item.quantityTotal - reserved);
            }, 0)}</strong>
            <span>Disponíveis</span>
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
              const available = item.quantityTotal - reserved;
              return item.minStock ? available <= item.minStock : available < item.quantityTotal * 0.2;
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
              return (item.quantityTotal - reserved) === 0;
            }).length}</strong>
            <span>Indisponíveis</span>
          </div>
        </div>
      </div>

      {/* Modais de Feedback */}
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
        message="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
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
    setTimeout(() => {
      onSubmit(formData);
      setLoading(false);
    }, 500);
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
                className={`${styles.formInput} ${errors.quantityTotal ? styles.error : ''}`}
              />
              {errors.quantityTotal && (
                <span className={styles.errorText}>{errors.quantityTotal}</span>
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
                className={`${styles.formInput} ${errors.minStock ? styles.error : ''}`}
              />
              {errors.minStock && (
                <span className={styles.errorText}>{errors.minStock}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <MdAttachMoney size={14} />
                Preço Unitário (R$)
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
  events: any[];
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

  const reserved = events
    .filter(e => e.id === selectedEventId)
    .map(e => {
      const itemReservations: any[] = [];
      return itemReservations.reduce((sum, r) => sum + r.quantity, 0);
    })[0] || 0;

  const maxAvailable = item.quantityTotal - reserved;

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
                Total: {item.quantityTotal} un.
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
              max={maxAvailable}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className={styles.formInput}
            />
            <small className={styles.helpText}>
              Disponível: {maxAvailable} unidades
            </small>
          </div>

          {selectedEventId && selectedDate && (
            <div className={styles.availabilityInfo}>
              {isAvailable ? (
                <div className={styles.availableMessage}>
                  <FiCheckCircle size={18} color="#10b981" />
                  Disponível para esta data
                </div>
              ) : (
                <div className={styles.unavailableMessage}>
                  <FiXCircle size={18} color="#ef4444" />
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

export default ItemsManagement;