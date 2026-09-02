import { Response } from 'express';

interface IApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export const sendResponse = <T>(res: Response, data: IApiResponse<T>) => {
  const response: any = {
    success: data.success,
    message: data.message,
    timestamp: new Date().toISOString(),
  };

  if (data.data) response.data = data.data;
  if (data.meta) response.meta = data.meta;

  res.status(data.statusCode).json(response);
};
