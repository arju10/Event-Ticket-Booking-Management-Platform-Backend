export enum Role {
  ATTENDEE = 'ATTENDEE',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN',
}

export interface IQuery {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export {};
