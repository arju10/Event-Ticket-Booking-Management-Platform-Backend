export interface CreateBookingInput {
  ticketTierId: string;
  quantity: number;
  specialRequests?: string;
  dietaryNeeds?: string;
  couponCode?: string;
}
