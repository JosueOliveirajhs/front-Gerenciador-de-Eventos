import React, { useState, useEffect } from "react";
// import { itemService } from '../../services/items'; // Descomente quando criar o service
import styles from "./ItemsManagement.module.css"
// --- Definição dos Tipos (Pode mover para /types/Item.ts) ---
export interface Item {
  id: number;
  name: string;
  category: "DECORATION" | "FURNITURE" | "UTENSIL" | "OTHER";
  quantityTotal: number;
  quantityAvailable: number; // Calculado no backend: Total - Reservados
  description?: string;
}

// --- Mock do Service (Apenas para funcionar o exemplo) ---
const mockItemService = {
  getAllItems: async (): Promise<Item[]> => {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve([
            {
              id: 1,
              name: "Cadeira Tiffany Dourada",
              category: "FURNITURE",
              quantityTotal: 100,
              quantityAvailable: 85,
              description: "Cadeira de ferro",
            },
            {
              id: 2,
              name: "Toalha de Mesa Branca",
              category: "DECORATION",
              quantityTotal: 50,
              quantityAvailable: 0,
              description: "Tecido Oxford",
            },
            {
              id: 3,
              name: "Prato Raso Porcelana",
              category: "UTENSIL",
              quantityTotal: 200,
              quantityAvailable: 200,
              description: "",
            },
          ]),
        800,
      ),
    );
  },
  createItem: async (data: any) => console.log("Criar", data),
  updateItem: async (id: number, data: any) =>
    console.log("Atualizar", id, data),
  deleteItem: async (id: number) => console.log("Deletar", id),
};

export const ItemsManagement: React.FC =     () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Filtros simples para gestão
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      // const data = await itemService.getAllItems(); // Use seu service real aqui
      const data = await mockItemService.getAllItems();
      setItems(data);
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (itemData: Omit<Item, "id">) => {
    try {
      // await itemService.createItem(itemData);
      await mockItemService.createItem(itemData);
      await loadItems();
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao criar item:", error);
    }
  };

  const handleUpdateItem = async (id: number, itemData: Partial<Item>) => {
    try {
      // await itemService.updateItem(id, itemData);
      await mockItemService.updateItem(id, itemData);
      await loadItems();
      setEditingItem(null);
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este item?")) {
      try {
        // await itemService.deleteItem(id);
        await mockItemService.deleteItem(id);
        await loadItems();
      } catch (error) {
        console.error("Erro ao excluir item:", error);
      }
    }
  };

  // Lógica para cor do badge de categoria
  const getCategoryLabel = (cat: string) => {
    const labels: { [key: string]: string } = {
      DECORATION: "Decoração",
      FURNITURE: "Mobiliário",
      UTENSIL: "Utensílios",
      OTHER: "Outros",
    };
    return labels[cat] || cat;
  };

  // Lógica para alerta de indisponibilidade
  const getStockStatus = (available: number, total: number) => {
    if (available === 0)
      return (
        <span style={{ color: "#ef4444", fontWeight: "bold" }}>Esgotado</span>
      );
    if (available < total * 0.2)
      return (
        <span style={{ color: "#f59e0b", fontWeight: "bold" }}>
          Baixo Estoque
        </span>
      );
    return (
      <span style={{ color: "#10b981", fontWeight: "bold" }}>Disponível</span>
    );
  };

  const filteredItems =
    filterCategory === "ALL"
      ? items
      : items.filter((i) => i.category === filterCategory);

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
      {" "}
      {/* Usando a mesma classe base */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div>
            <h2 className={styles.pageTitle}>Gestão de Itens e Estoque</h2>
            <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
              {items.length} itens cadastrados
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            {/* Filtro Rápido */}
            <select
              className={styles.formInput}
              style={{ width: "auto" }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="ALL">Todas Categorias</option>
              <option value="FURNITURE">Mobiliário</option>
              <option value="DECORATION">Decoração</option>
              <option value="UTENSIL">Utensílios</option>
            </select>

            <button
              onClick={() => setShowForm(true)}
              className={styles.primaryButton}
            >
              + Novo Item
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
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {item.description}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        background: "#f1f5f9",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    >
                      {getCategoryLabel(item.category)}
                    </span>
                  </td>
                  <td>{item.quantityTotal} un.</td>
                  <td>
                    <div className={styles.cpfCell}>
                      {item.quantityAvailable} un.
                    </div>
                  </td>
                  <td>
                    {getStockStatus(item.quantityAvailable, item.quantityTotal)}
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button
                        onClick={() => setEditingItem(item)}
                        className={styles.editButton}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
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

        {filteredItems.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <h3 className={styles.emptyTitle}>Nenhum item encontrado</h3>
            <p className={styles.emptyText}>
              Cadastre itens no seu estoque para gerenciá-los aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Componente de Formulário (Modal) ---
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
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    if (formData.quantityTotal < 1)
      newErrors.quantityTotal = "Quantidade deve ser maior que 0";

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
        // Ao criar, disponível = total (lógica inicial)
        quantityAvailable: item
          ? item.quantityAvailable
          : formData.quantityTotal,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.card}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {item ? "Editar Item" : "Novo Item"}
          </h3>
          <button onClick={onCancel} className={styles.closeButton}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nome do Item *</label>
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
              <label className={styles.formLabel}>Categoria *</label>
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
              <label className={styles.formLabel}>Quantidade Total *</label>
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
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Descrição (Opcional)</label>
            <textarea
              rows={3}
              placeholder="Detalhes sobre o item (cor, material, dimensões)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={styles.formInput}
              style={{ resize: "vertical" }}
            />
          </div>

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
              {loading ? "Salvando..." : item ? "Atualizar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
