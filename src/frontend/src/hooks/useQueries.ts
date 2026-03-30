import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewOrderData, RoundInfoArgs } from "../backend.d";
import { useActor } from "./useActor";

export type OrderStatus =
  | { pendingPayment: null }
  | { paymentConfirmed: null }
  | { shipped: null }
  | { delivered: null }
  | { receivedByUser: null };

export function useProducts() {
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

export function useRoundInfo() {
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

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getCallerUserRole();
      } catch {
        // User not yet registered — trap from backend
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useInitializeUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (passcode: string) => {
      if (!actor) throw new Error("Not connected");
      return actor._initializeAccessControlWithSecret(passcode);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userRole"] });
      qc.invalidateQueries({ queryKey: ["isAdmin"] });
    },
  });
}

export function useAllOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyOrders(enabled: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["myOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyOrders();
    },
    enabled: !!actor && !isFetching && enabled,
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
      qc.invalidateQueries({ queryKey: ["allOrders"] });
      qc.invalidateQueries({ queryKey: ["myOrders"] });
    },
  });
}

export function useConfirmOrderReceived() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).confirmOrderReceived(orderId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myOrders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: bigint;
      status: OrderStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allOrders"] });
    },
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      retailPrice,
      origin,
      category,
    }: {
      name: string;
      retailPrice: number;
      origin: string;
      category: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addProduct(name, retailPrice, origin, category);
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
    mutationFn: async (productId: number) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeProduct(productId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useSetRoundInfo() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roundInfo: RoundInfoArgs) => {
      if (!actor) throw new Error("Not connected");
      return actor.setCurrentRoundInfo(roundInfo);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roundInfo"] });
    },
  });
}

export function useGetPaynowConfig(enabled: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["paynowConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as any).getPaynowConfig();
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useSetPaynowConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: {
      integrationId: string;
      integrationKey: string;
      returnUrl: string;
      resultUrl: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).setPaynowConfig(config);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paynowConfig"] });
    },
  });
}
