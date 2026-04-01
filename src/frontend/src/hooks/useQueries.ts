import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type NewOrderData,
  OrderStatus,
  type PaynowConfig,
  type RoundInfoArgs,
} from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllProducts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCurrentRoundInfo() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["roundInfo"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCurrentRoundInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyOrders(enabled: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["myOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyOrders();
    },
    enabled: enabled && !!actor && !isFetching,
  });
}

export function useGetAllOrders(adminKey: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allOrders", adminKey],
    queryFn: async () => {
      if (!actor || !adminKey) return [];
      return actor.getAllOrders(adminKey);
    },
    enabled: !!actor && !isFetching && !!adminKey,
  });
}

export function useGetPaynowConfig(adminKey: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["paynowConfig", adminKey],
    queryFn: async () => {
      if (!actor || !adminKey) return null;
      return actor.getPaynowConfig(adminKey);
    },
    enabled: !!actor && !isFetching && !!adminKey,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderData: NewOrderData) => {
      if (!actor) throw new Error("Not connected");
      return actor.placeOrder(orderData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myOrders"] });
    },
  });
}

export function useCheckAdminPassword() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (password: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.checkAdminPassword(password);
    },
  });
}

export function useChangeAdminPassword() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      oldPassword,
      newPassword,
    }: { oldPassword: string; newPassword: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.changeAdminPassword(oldPassword, newPassword);
    },
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      adminKey,
      name,
      retailPrice,
      origin,
      category,
    }: {
      adminKey: string;
      name: string;
      retailPrice: number;
      origin: string;
      category: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addProduct(adminKey, name, retailPrice, origin, category);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useRemoveProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      adminKey,
      productId,
    }: { adminKey: string; productId: number }) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeProduct(adminKey, productId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      adminKey,
      orderId,
      status,
    }: {
      adminKey: string;
      orderId: bigint;
      status: OrderStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateOrderStatus(adminKey, orderId, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allOrders"] });
    },
  });
}

export function useConfirmOrderReceived() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.confirmOrderReceived(orderId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myOrders"] });
    },
  });
}

export function useSetPaynowConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      adminKey,
      config,
    }: { adminKey: string; config: PaynowConfig }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setPaynowConfig(adminKey, config);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paynowConfig"] });
    },
  });
}

export function useSetCurrentRoundInfo() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      adminKey,
      roundInfo,
    }: { adminKey: string; roundInfo: RoundInfoArgs }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setCurrentRoundInfo(adminKey, roundInfo);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roundInfo"] });
    },
  });
}

export { OrderStatus };
