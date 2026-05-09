import api from './api';

export interface ChecklistItem {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
  category: 'PRE_EVENT' | 'EVENT_DAY' | 'POST_EVENT';
  order: number;
}

export interface EventProgress {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  address: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  checklist: ChecklistItem[];
  completedSteps: number;
  nextDeadline?: {
    title: string;
    date: string;
  };
}

export const eventProgressService = {
  async getEventProgress(eventId: number): Promise<EventProgress> {
    const response = await api.get(`/events/${eventId}/progress`);
    return response.data;
  },

  async updateChecklistItem(eventId: number, itemId: number, completed: boolean): Promise<void> {
    await api.put(`/events/${eventId}/checklist/${itemId}`, { completed });
  }
};