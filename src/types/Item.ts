export interface Item {
  id: number;
  name: string;
  category: "DECORATION" | "FURNITURE" | "UTENSIL" | "OTHER";
  quantityTotal: number;
  quantityAvailable: number;
  description?: string;
  minStock?: number;
  unitPrice?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemReservation {
  id: number;
  itemId: number;
  eventId: number;
  eventTitle?: string;
  eventDate: string;
  quantity: number;
  status: 'RESERVED' | 'CONFIRMED' | 'RETURNED';
  createdAt: string;
  updatedAt?: string;
}

export interface ItemCategory {
  value: "DECORATION" | "FURNITURE" | "UTENSIL" | "OTHER";
  label: string;
}

export const ITEM_CATEGORIES: ItemCategory[] = [
  { value: "DECORATION", label: "Decoração" },
  { value: "FURNITURE", label: "Mobiliário" },
  { value: "UTENSIL", label: "Utensílios" },
  { value: "OTHER", label: "Outros" }
];