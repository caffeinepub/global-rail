import type { Principal } from "@icp-sdk/core/principal";
import type { IDL } from "@icp-sdk/core/candid";

export interface PaynowConfig {
  integrationId: string;
  integrationKey: string;
  returnUrl: string;
  resultUrl: string;
}
export interface RoundInfoArgs {
  closingDate: string;
  roundNumber: number;
}
export interface NewOrderData {
  destination: string;
  paymentMethod: PaymentMethod;
  university: string;
  pincode: number;
  itemIds: Uint32Array;
}
export interface RoundInfo {
  closingDate: string;
  roundNumber: number;
}
export interface Product {
  id: number;
  retailPrice: number;
  name: string;
  origin: string;
  category: string;
}
export type OrderStatus =
  | { pendingPayment: null }
  | { paymentConfirmed: null }
  | { shipped: null }
  | { delivered: null }
  | { receivedByUser: null };
export interface OrderData {
  id: bigint;
  destination: string;
  paymentMethod: PaymentMethod;
  user: Principal;
  university: string;
  timestamp: bigint;
  pincode: number;
  itemIds: Uint32Array;
  status: OrderStatus;
}
export enum PaymentMethod {
  cashOnDelivery = "cashOnDelivery",
  online = "online"
}
export enum UserRole {
  admin = "admin",
  user = "user",
  guest = "guest"
}
export interface _SERVICE {
  _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
  addProduct(name: string, retailPrice: number, origin: string, category: string): Promise<number>;
  assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
  getAllOrders(): Promise<Array<OrderData>>;
  getAllProducts(): Promise<Array<Product>>;
  getAllProductsByName(): Promise<Array<Product>>;
  getCallerUserRole(): Promise<UserRole>;
  getCurrentRoundInfo(): Promise<RoundInfo>;
  getMyOrders(): Promise<Array<OrderData>>;
  isCallerAdmin(): Promise<boolean>;
  placeOrder(orderData: NewOrderData): Promise<bigint>;
  removeProduct(productId: number): Promise<void>;
  setCurrentRoundInfo(roundInfo: RoundInfoArgs): Promise<void>;
  updateOrderStatus(orderId: bigint, status: OrderStatus): Promise<void>;
  confirmOrderReceived(orderId: bigint): Promise<void>;
  setPaynowConfig(config: PaynowConfig): Promise<void>;
  getPaynowConfig(): Promise<PaynowConfig>;
}
