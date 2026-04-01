import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RoundInfoArgs {
    closingDate: string;
    roundNumber: number;
}
export interface PaynowConfig {
    returnUrl: string;
    integrationId: string;
    resultUrl: string;
    integrationKey: string;
}
export interface NewOrderData {
    destination: string;
    paymentMethod: PaymentMethod;
    university: string;
    pincode: number;
    itemIds: Uint32Array;
}
export interface OrderDataWithStatus {
    id: bigint;
    status: OrderStatus;
    destination: string;
    paymentMethod: PaymentMethod;
    user: Principal;
    university: string;
    timestamp: bigint;
    pincode: number;
    itemIds: Uint32Array;
}
export interface RoundInfo {
    closingDate: string;
    roundNumber: number;
}
export interface UserProfile {
    name: string;
    email: string;
    phone: string;
}
export interface Product {
    id: number;
    retailPrice: number;
    name: string;
    origin: string;
    category: string;
}
export enum OrderStatus {
    shipped = "shipped",
    paymentConfirmed = "paymentConfirmed",
    pendingPayment = "pendingPayment",
    receivedByUser = "receivedByUser",
    delivered = "delivered"
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
export interface backendInterface {
    addProduct(adminKey: string, name: string, retailPrice: number, origin: string, category: string): Promise<number>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    changeAdminPassword(oldPassword: string, newPassword: string): Promise<boolean>;
    checkAdminPassword(password: string): Promise<boolean>;
    confirmOrderReceived(orderId: bigint): Promise<void>;
    getAllOrders(adminKey: string): Promise<Array<OrderDataWithStatus>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllProductsByName(): Promise<Array<Product>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentRoundInfo(): Promise<RoundInfo>;
    getMyOrders(): Promise<Array<OrderDataWithStatus>>;
    getPaynowConfig(adminKey: string): Promise<PaynowConfig>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(orderData: NewOrderData): Promise<bigint>;
    removeProduct(adminKey: string, productId: number): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setCurrentRoundInfo(adminKey: string, roundInfo: RoundInfoArgs): Promise<void>;
    setPaynowConfig(adminKey: string, config: PaynowConfig): Promise<void>;
    updateOrderStatus(adminKey: string, orderId: bigint, status: OrderStatus): Promise<void>;
}
