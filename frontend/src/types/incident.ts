export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface IncidentReport {
  id: string;
  roomId: string;
  roomCode: string;
  deviceName: string;
  reporterName: string;
  reporterCode: string;
  description: string;
  imageUrl?: string;
  status: TicketStatus;
  createdAt: string;
}
