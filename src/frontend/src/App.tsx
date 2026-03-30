import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MapPin,
  Minus,
  Package,
  Plus,
  Settings,
  Shield,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PaymentMethod } from "./backend";
import type { Product } from "./backend.d";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useAddProduct,
  useAllOrders,
  useConfirmOrderReceived,
  useGetPaynowConfig,
  useInitializeUser,
  useIsAdmin,
  useMyOrders,
  usePlaceOrder,
  useProducts,
  useRemoveProduct,
  useRoundInfo,
  useSetPaynowConfig,
  useSetRoundInfo,
  useUpdateOrderStatus,
  useUserRole,
} from "./hooks/useQueries";

type CartItem = { product: Product; qty: number };
type View = "store" | "admin" | "about" | "privacy" | "myorders";

function Tag({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`tag ${className}`} style={style}>
      {children}
    </span>
  );
}

function GRLogo() {
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-md"
      style={{ background: "#3b82f6" }}
    >
      GR
    </div>
  );
}

export default function App() {
  const { login, clear, identity, loginStatus, isInitializing, loginError } =
    useInternetIdentity();
  const isLoggedIn = !!identity;

  const [view, setView] = useState<View>("store");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [university, setUniversity] = useState("");
  const [pincode, setPincode] = useState("");
  const [freightOptimizer, setFreightOptimizer] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(() =>
    typeof window !== "undefined"
      ? !!localStorage.getItem("gr_privacy_accepted")
      : true,
  );

  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const pendingAdminLogin = useRef(false);

  const [admName, setAdmName] = useState("");
  const [admRetail, setAdmRetail] = useState("");
  const [admOrigin, setAdmOrigin] = useState("Zimbabwe");
  const [admCat, setAdmCat] = useState("Food");
  const [roundNum, setRoundNum] = useState("");
  const [roundDate, setRoundDate] = useState("");
  const [paynowIntegrationId, setPaynowIntegrationId] = useState("");
  const [paynowIntegrationKey, setPaynowIntegrationKey] = useState("");
  const [paynowReturnUrl, setPaynowReturnUrl] = useState("");
  const [paynowResultUrl, setPaynowResultUrl] = useState("");
  const [showPaynowKey, setShowPaynowKey] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: roundInfo } = useRoundInfo();
  const { data: isAdmin = false } = useIsAdmin();
  const { data: allOrders = [] } = useAllOrders();
  const { data: userRole, isFetched: userRoleFetched } = useUserRole();
  const placeOrder = usePlaceOrder();
  const addProduct = useAddProduct();
  const removeProduct = useRemoveProduct();
  const setRoundInfo = useSetRoundInfo();
  const initializeUser = useInitializeUser();
  const savePaynowConfig = useSetPaynowConfig();
  const { data: paynowConfigData } = useGetPaynowConfig(isAdmin && isLoggedIn);
  const { data: myOrders = [] } = useMyOrders(isLoggedIn);
  const confirmOrderReceived = useConfirmOrderReceived();
  const updateOrderStatus = useUpdateOrderStatus();

  useEffect(() => {
    if (loginError && loginStatus === "loginError") {
      toast.error("Login failed. Please try again.");
    }
  }, [loginError, loginStatus]);

  useEffect(() => {
    if (isLoggedIn && userRoleFetched && pendingAdminLogin.current) {
      pendingAdminLogin.current = false;
      if (userRole === null) {
        initializeUser
          .mutateAsync("cs2026")
          .then(() => {
            toast.success("Welcome, Admin! Access granted.");
            setView("admin");
          })
          .catch(() => toast.error("Failed to initialize admin. Try again."));
      } else if (userRole === "admin") {
        toast.success("Welcome back, Admin!");
        setView("admin");
      } else {
        toast.error("This account does not have admin access.");
      }
    }
  }, [isLoggedIn, userRoleFetched, userRole, initializeUser]);
  useEffect(() => {
    if (paynowConfigData) {
      if (paynowConfigData.integrationId)
        setPaynowIntegrationId(paynowConfigData.integrationId);
      if (paynowConfigData.integrationKey)
        setPaynowIntegrationKey(paynowConfigData.integrationKey);
      if (paynowConfigData.returnUrl)
        setPaynowReturnUrl(paynowConfigData.returnUrl);
      if (paynowConfigData.resultUrl)
        setPaynowResultUrl(paynowConfigData.resultUrl);
    }
  }, [paynowConfigData]);

  const boxTotal = cart.reduce(
    (sum, item) => sum + item.product.retailPrice * 1.3 * item.qty,
    0,
  );
  const minReached = boxTotal >= 50;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...prev, { product, qty: 1 }];
    });
  }

  function removeFromCart(productId: number) {
    setCart((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (!item) return prev;
      if (item.qty <= 1) return prev.filter((i) => i.product.id !== productId);
      return prev.map((i) =>
        i.product.id === productId ? { ...i, qty: i.qty - 1 } : i,
      );
    });
  }

  function deleteFromCart(productId: number) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function cartQty(productId: number) {
    return cart.find((i) => i.product.id === productId)?.qty ?? 0;
  }

  async function handleAdminPasscodeSubmit() {
    if (passcode !== "cs2026") {
      toast.error("Incorrect passcode.");
      return;
    }
    pendingAdminLogin.current = true;
    setShowPasscodeModal(false);
    setPasscode("");
    login();
  }

  async function handlePayment(method: "Paynow" | "Wise") {
    if (!isLoggedIn) {
      toast.error("Please login to place an order.");
      return;
    }
    if (!destination || !university || !pincode) {
      toast.error("Please select your destination, university, and pincode.");
      return;
    }
    const now = new Date();
    const cutoff = roundInfo ? new Date(roundInfo.closingDate) : new Date();
    const itemIds = new Uint32Array(
      cart.flatMap((item) =>
        Array.from({ length: item.qty }, () => item.product.id),
      ),
    );
    try {
      await placeOrder.mutateAsync({
        destination,
        paymentMethod:
          method === "Paynow"
            ? PaymentMethod.cashOnDelivery
            : PaymentMethod.online,
        university,
        pincode: Number.parseInt(pincode, 10),
        itemIds,
      });
      if (now > cutoff) {
        toast.success(
          `Round #01 Closed — shifted to Round #02. Gateway: ${method}`,
          {
            action: {
              label: "View Orders",
              onClick: () => setView("myorders"),
            },
          },
        );
      } else {
        toast.success(
          `Order placed for Round #${roundInfo?.roundNumber ?? "01"}! View in My Orders.`,
          {
            action: {
              label: "View Orders",
              onClick: () => setView("myorders"),
            },
          },
        );
      }
      setCart([]);
      setCartOpen(false);
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  }

  async function handleAdminAddProduct() {
    if (!admName || !admRetail) {
      toast.error("Please fill in product name and price");
      return;
    }
    try {
      await addProduct.mutateAsync({
        name: admName,
        retailPrice: Number.parseFloat(admRetail),
        origin: admOrigin,
        category: admCat,
      });
      toast.success(
        `${admName} added at landed price: $${(Number.parseFloat(admRetail) * 1.3).toFixed(2)}`,
      );
      setAdmName("");
      setAdmRetail("");
    } catch {
      toast.error("Failed to add product.");
    }
  }

  async function handleSetRound() {
    if (!roundNum || !roundDate) {
      toast.error("Please fill in round number and closing date");
      return;
    }
    try {
      await setRoundInfo.mutateAsync({
        roundNumber: Number.parseInt(roundNum, 10),
        closingDate: roundDate,
      });
      toast.success("Round info updated!");
    } catch {
      toast.error("Failed to update round info.");
    }
  }
  async function handleSavePaynow() {
    if (!paynowIntegrationId || !paynowIntegrationKey) {
      toast.error("Integration ID and Key are required");
      return;
    }
    try {
      await savePaynowConfig.mutateAsync({
        integrationId: paynowIntegrationId,
        integrationKey: paynowIntegrationKey,
        returnUrl: paynowReturnUrl,
        resultUrl: paynowResultUrl,
      });
      toast.success("Paynow configuration saved successfully");
    } catch {
      toast.error("Failed to save Paynow configuration");
    }
  }

  const _ordersByDestination = allOrders.reduce(
    (acc: Record<string, number>, order) => {
      acc[order.destination] = (acc[order.destination] ?? 0) + 1;
      return acc;
    },
    {},
  );

  function handleSettingsClick() {
    if (!isLoggedIn) {
      setShowPasscodeModal(true);
      return;
    }
    if (!isAdmin) {
      toast.error("Access Denied — Admin role required");
      return;
    }
    setView(view === "admin" ? "store" : "admin");
  }

  function acceptPrivacy() {
    localStorage.setItem("gr_privacy_accepted", "1");
    setPrivacyAccepted(true);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster />

      {/* PASSCODE MODAL */}
      <AnimatePresence>
        {showPasscodeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-ocid="passcode.modal"
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-white rounded-2xl p-7 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GRLogo />
                  <div>
                    <h2 className="font-black text-gray-900 text-lg leading-tight">
                      Admin Login
                    </h2>
                    <p className="text-gray-400 text-[10px] mt-0.5">
                      Global Rail — Admin Access
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  data-ocid="passcode.close_button"
                  onClick={() => setShowPasscodeModal(false)}
                  className="text-gray-400 hover:text-gray-700 transition p-1"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="passcode-input"
                  className="block text-[10px] font-bold uppercase tracking-widest text-gray-500"
                >
                  Admin Passcode
                </label>
                <Input
                  id="passcode-input"
                  data-ocid="passcode.input"
                  type="password"
                  placeholder="Enter passcode..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAdminPasscodeSubmit()
                  }
                />
              </div>
              <Button
                data-ocid="passcode.submit_button"
                onClick={handleAdminPasscodeSubmit}
                disabled={loginStatus === "logging-in"}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold"
              >
                {loginStatus === "logging-in" ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Login as Admin"
                )}
              </Button>
              <p className="text-[9px] text-gray-400 text-center">
                Enter admin passcode to access the panel.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CART DRAWER */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={() => setCartOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="ml-auto w-full max-w-sm bg-white h-full shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
              data-ocid="checkout.panel"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
                  <ShoppingCart size={18} className="text-blue-500" />
                  Empire Box
                </h2>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="text-gray-400 hover:text-gray-700 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {cart.length === 0 ? (
                  <div
                    data-ocid="checkout.empty_state"
                    className="text-center py-12"
                  >
                    <ShoppingCart
                      size={36}
                      className="mx-auto mb-3 text-gray-300"
                    />
                    <p className="text-gray-400 font-semibold text-sm">
                      Your box is empty
                    </p>
                    <p className="text-gray-300 text-xs mt-1">
                      Add products to get started
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {item.product.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          ${(item.product.retailPrice * 1.3).toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-6 h-6 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-6 text-center font-black text-sm">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(item.product)}
                          className="w-6 h-6 rounded-md bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition"
                        >
                          <Plus size={10} className="text-white" />
                        </button>
                      </div>
                      <p className="font-black text-gray-900 text-sm">
                        $
                        {(item.product.retailPrice * 1.3 * item.qty).toFixed(2)}
                      </p>
                      <button
                        type="button"
                        onClick={() => deleteFromCart(item.product.id)}
                        className="text-gray-300 hover:text-red-400 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Delivery Details
                  </p>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger
                      data-ocid="hub.select"
                      className="text-sm h-9 bg-gray-50"
                    >
                      <SelectValue placeholder="Destination Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">
                        India (KIIT/Delhi Hubs)
                      </SelectItem>
                      <SelectItem value="UK">
                        United Kingdom (London Hub)
                      </SelectItem>
                      <SelectItem value="Poland">
                        Poland (Wroclaw Hub)
                      </SelectItem>
                      <SelectItem value="UAE">UAE (Dubai Hub)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    data-ocid="hub.input"
                    placeholder="University / Hostel Name"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="text-sm h-9 bg-gray-50"
                  />
                  <Input
                    data-ocid="hub.input"
                    placeholder="Pincode / Zip Code"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="text-sm h-9 bg-gray-50"
                  />
                </div>
              )}

              <div className="px-5 py-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-600 text-sm">Total</span>
                  <span
                    data-ocid="checkout.card"
                    className="text-2xl font-black text-blue-500"
                  >
                    ${boxTotal.toFixed(2)}
                  </span>
                </div>
                <AnimatePresence>
                  {!minReached && cart.length > 0 && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      data-ocid="checkout.error_state"
                      className="text-[10px] text-red-500 font-bold bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-center"
                    >
                      Minimum $50.00 required to unlock batch delivery
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="space-y-2">
                  <Button
                    data-ocid="checkout.primary_button"
                    onClick={() => handlePayment("Paynow")}
                    disabled={!minReached || placeOrder.isPending}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold"
                  >
                    {placeOrder.isPending ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      "Paynow (Zim Parent)"
                    )}
                  </Button>
                  <Button
                    data-ocid="checkout.secondary_button"
                    variant="outline"
                    onClick={() => handlePayment("Wise")}
                    disabled={!minReached || placeOrder.isPending}
                    className="w-full font-bold border-gray-200"
                  >
                    {placeOrder.isPending ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      "Wise / GBP (Student)"
                    )}
                  </Button>
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <Checkbox id="privacy-checkout" className="mt-0.5" />
                  <label
                    htmlFor="privacy-checkout"
                    className="text-[10px] text-gray-400 leading-relaxed cursor-pointer"
                  >
                    I have read and agree to the{" "}
                    <button
                      type="button"
                      className="underline text-blue-500 hover:text-blue-700"
                      onClick={() => {
                        setCartOpen(false);
                        setView("privacy");
                      }}
                    >
                      Privacy Policy
                    </button>
                  </label>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header
        className="sticky top-0 z-50 bg-white border-b border-gray-100"
        style={{
          boxShadow: "0 1px 0 rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            data-ocid="nav.link"
            onClick={() => setView("store")}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <GRLogo />
            <span className="font-black text-xl tracking-tight text-gray-900">
              GLOBAL <span className="text-blue-500">RAIL</span>
            </span>
          </button>
          <nav className="hidden md:flex items-center gap-1">
            <button
              type="button"
              data-ocid="nav.tab"
              onClick={() => setView("store")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${view === "store" || view === "admin" ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
            >
              Shop
            </button>
            <button
              type="button"
              data-ocid="nav.tab"
              onClick={() => setView("about")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${view === "about" ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
            >
              About Us
            </button>
            <button
              type="button"
              data-ocid="nav.tab"
              onClick={() => setView("privacy")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${view === "privacy" ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
            >
              Privacy
            </button>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-ocid="nav.tab"
              onClick={() => setView("myorders")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${view === "myorders" ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"} ${!isLoggedIn ? "hidden" : ""}`}
            >
              My Orders
            </button>
            <button
              type="button"
              data-ocid="nav.toggle"
              onClick={() => {
                setView("store");
                setCartOpen(true);
              }}
              className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              type="button"
              data-ocid="nav.toggle"
              onClick={handleSettingsClick}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition"
              title="Admin Panel"
            >
              <Settings size={18} />
            </button>
            {isLoggedIn ? (
              <button
                type="button"
                data-ocid="nav.secondary_button"
                onClick={clear}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 transition"
              >
                Logout
              </button>
            ) : (
              <>
                <Button
                  data-ocid="nav.primary_button"
                  onClick={login}
                  disabled={loginStatus === "logging-in" || isInitializing}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-4"
                >
                  {loginStatus === "logging-in" || isInitializing ? (
                    <>
                      <Loader2 className="animate-spin mr-1.5" size={14} />
                      {isInitializing ? "Loading..." : "Connecting..."}
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
                <Button
                  data-ocid="nav.admin_login_button"
                  onClick={() => setShowPasscodeModal(true)}
                  variant="outline"
                  className="text-sm font-bold px-4 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Shield size={14} className="mr-1.5" />
                  Admin
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ROUND BANNER */}
      <div className="bg-blue-500 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <p className="text-sm font-semibold">
            🚂 Grocery Round #
            {String(roundInfo?.roundNumber ?? 1).padStart(2, "0")} — Closes:{" "}
            <strong>{roundInfo?.closingDate ?? "01 May 2026"}</strong>
          </p>
          <p className="text-xs text-blue-200">
            Minimum order $50 · Late orders shift to next round
          </p>
        </div>
      </div>

      {/* MAIN */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {view === "store" && (
            <motion.div
              key="store"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
                  <div className="max-w-2xl">
                    <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-3">
                      Zimbabwe × World
                    </span>
                    <h1 className="font-display text-3xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
                      Making those away from home{" "}
                      <em className="text-blue-500 not-italic">feel at home</em>{" "}
                      — without paying extra
                    </h1>
                    <p className="text-gray-500 text-lg leading-relaxed mb-6">
                      Batch grocery logistics from Zimbabwe to your campus.
                      Order with friends, split the freight, save on everything.
                    </p>
                    <Button
                      onClick={() =>
                        document
                          .getElementById("products")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 text-base"
                    >
                      Shop Now
                    </Button>
                  </div>
                </div>
              </div>

              <div
                id="products"
                className="max-w-6xl mx-auto px-4 sm:px-6 py-10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-gray-900">
                    Current Batch Products
                  </h2>
                  <span className="text-sm text-gray-400 font-medium">
                    {products.length} item{products.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {productsLoading ? (
                  <div
                    data-ocid="store.loading_state"
                    className="flex items-center justify-center py-24"
                  >
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                  </div>
                ) : products.length === 0 ? (
                  <div
                    data-ocid="store.empty_state"
                    className="bg-white rounded-2xl border border-gray-100 p-16 text-center"
                    style={{
                      boxShadow:
                        "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                    }}
                  >
                    <Package size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-bold text-sm">
                      No products yet.
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      An admin will add products to the batch soon.
                    </p>
                  </div>
                ) : (
                  <div
                    data-ocid="store.list"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                  >
                    {products.map((product, idx) => {
                      const landedPrice = product.retailPrice * 1.3;
                      const qty = cartQty(product.id);
                      return (
                        <motion.div
                          key={product.id}
                          data-ocid={`store.item.${idx + 1}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="bg-white rounded-2xl p-5 flex flex-col transition-shadow hover:shadow-lg"
                          style={{
                            boxShadow:
                              "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                          }}
                        >
                          <div className="flex gap-1.5 mb-3 flex-wrap">
                            <Tag className="bg-gray-100 text-gray-500">
                              {product.origin}
                            </Tag>
                            <Tag
                              className="text-blue-600"
                              style={{ background: "rgba(59,130,246,0.1)" }}
                            >
                              {product.category}
                            </Tag>
                          </div>
                          <h3 className="font-extrabold text-gray-900 text-base leading-tight flex-1 mb-2">
                            {product.name}
                          </h3>
                          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-4">
                            Zim Retail + 30% Cap
                          </p>
                          <div className="flex items-center justify-between mt-auto">
                            <p className="text-2xl font-black text-gray-900">
                              ${landedPrice.toFixed(2)}
                            </p>
                            {qty === 0 ? (
                              <Button
                                data-ocid={`store.secondary_button.${idx + 1}`}
                                onClick={() => addToCart(product)}
                                className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 h-auto"
                              >
                                Add to Box
                              </Button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(product.id)}
                                  className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-8 text-center font-black text-sm">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addToCart(product)}
                                  className="w-7 h-7 rounded-md bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition"
                                >
                                  <Plus size={12} className="text-white" />
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <Settings size={22} className="text-gray-400" />
                <h1 className="text-2xl font-black text-gray-900">
                  Admin Panel
                </h1>
              </div>
              {!isLoggedIn ? (
                <div
                  className="bg-white rounded-2xl border border-gray-100 p-12 text-center"
                  style={{
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                  }}
                >
                  <p className="text-amber-600 font-bold mb-4">
                    Login required to access the admin panel
                  </p>
                  <Button
                    onClick={() => setShowPasscodeModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    Admin Login
                  </Button>
                </div>
              ) : !isAdmin ? (
                <div
                  className="bg-white rounded-2xl border border-red-100 p-12 text-center"
                  style={{
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                  }}
                >
                  <p className="text-red-500 font-bold text-lg">
                    Access Denied
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Admin role required to view this panel.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
                    style={{
                      boxShadow:
                        "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                    }}
                  >
                    <h2 className="text-lg font-extrabold text-gray-900 border-l-4 border-amber-400 pl-3">
                      Product Rail Manager
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        data-ocid="admin.input"
                        type="text"
                        placeholder="Product Name"
                        value={admName}
                        onChange={(e) => setAdmName(e.target.value)}
                        className="col-span-2 md:col-span-1"
                      />
                      <Input
                        data-ocid="admin.input"
                        type="number"
                        placeholder="Zim Retail Price ($)"
                        value={admRetail}
                        onChange={(e) => setAdmRetail(e.target.value)}
                      />
                      <Select value={admOrigin} onValueChange={setAdmOrigin}>
                        <SelectTrigger data-ocid="admin.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Zimbabwe">
                            Origin: Zimbabwe
                          </SelectItem>
                          <SelectItem value="Nigeria">
                            Origin: Nigeria
                          </SelectItem>
                          <SelectItem value="Nepal">Origin: Nepal</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={admCat} onValueChange={setAdmCat}>
                        <SelectTrigger data-ocid="admin.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Food">Category: Food</SelectItem>
                          <SelectItem value="Fashion">
                            Category: Fashion
                          </SelectItem>
                          <SelectItem value="Hygiene">
                            Category: Hygiene
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      data-ocid="admin.submit_button"
                      onClick={handleAdminAddProduct}
                      disabled={addProduct.isPending}
                      className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-black"
                    >
                      {addProduct.isPending ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        "Add to Global Batch"
                      )}
                    </Button>
                  </div>

                  {products.length > 0 && (
                    <div
                      className="bg-white rounded-2xl border border-gray-100 p-6"
                      style={{
                        boxShadow:
                          "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                      }}
                    >
                      <h3 className="font-bold text-sm text-gray-500 uppercase tracking-widest mb-4">
                        Current Products ({products.length})
                      </h3>
                      <div className="space-y-2">
                        {products.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                          >
                            <div>
                              <p className="text-gray-900 text-sm font-bold">
                                {p.name}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {p.origin} · {p.category} · $
                                {(p.retailPrice * 1.3).toFixed(2)} landed
                              </p>
                            </div>
                            <button
                              type="button"
                              data-ocid="admin.delete_button"
                              onClick={() => removeProduct.mutate(p.id)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                    style={{
                      boxShadow:
                        "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-extrabold text-gray-900 border-l-4 border-green-400 pl-3">
                        Institutional Stock Sync
                      </h3>
                      <Tag className="bg-green-100 text-green-700">
                        Hubs Active
                      </Tag>
                    </div>
                    {allOrders.length === 0 ? (
                      <div
                        data-ocid="admin.empty_state"
                        className="text-center py-6"
                      >
                        <p className="text-gray-400 text-sm">No orders yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {allOrders.map((order, idx) => {
                          const statusKey = (order as any).status
                            ? Object.keys((order as any).status as object)[0]
                            : "pendingPayment";
                          return (
                            <div
                              key={Number(order.id)}
                              data-ocid={`admin.orders.item.${idx + 1}`}
                              className="p-3 bg-gray-50 rounded-xl"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div>
                                  <p className="font-bold text-gray-700 text-sm">
                                    Order #{Number(order.id)} —{" "}
                                    {order.destination} Hub
                                  </p>
                                  <p className="text-gray-400 text-xs">
                                    {order.itemIds.length} item
                                    {order.itemIds.length !== 1 ? "s" : ""} ·{" "}
                                    {order.university}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={statusKey}
                                  onValueChange={(val) => {
                                    const statusMap: Record<string, object> = {
                                      pendingPayment: { pendingPayment: null },
                                      paymentConfirmed: {
                                        paymentConfirmed: null,
                                      },
                                      shipped: { shipped: null },
                                      delivered: { delivered: null },
                                      receivedByUser: { receivedByUser: null },
                                    };
                                    updateOrderStatus.mutate({
                                      orderId: order.id,
                                      status: statusMap[val] as any,
                                    });
                                  }}
                                >
                                  <SelectTrigger
                                    data-ocid={`admin.orders.select.${idx + 1}`}
                                    className="h-8 text-xs w-44"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pendingPayment">
                                      Pending Payment
                                    </SelectItem>
                                    <SelectItem value="paymentConfirmed">
                                      Payment Confirmed
                                    </SelectItem>
                                    <SelectItem value="shipped">
                                      Shipped
                                    </SelectItem>
                                    <SelectItem value="delivered">
                                      Delivered
                                    </SelectItem>
                                    <SelectItem value="receivedByUser">
                                      Received by User
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div
                    className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3"
                    style={{
                      boxShadow:
                        "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                    }}
                  >
                    <h3 className="font-extrabold text-gray-900 border-l-4 border-blue-400 pl-3">
                      Round Manager
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        data-ocid="admin.input"
                        type="number"
                        placeholder="Round Number (e.g. 1)"
                        value={roundNum}
                        onChange={(e) => setRoundNum(e.target.value)}
                      />
                      <Input
                        data-ocid="admin.input"
                        type="text"
                        placeholder="Closing Date (e.g. 01 May 2026)"
                        value={roundDate}
                        onChange={(e) => setRoundDate(e.target.value)}
                      />
                    </div>
                    <Button
                      data-ocid="admin.save_button"
                      onClick={handleSetRound}
                      disabled={setRoundInfo.isPending}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold"
                    >
                      {setRoundInfo.isPending ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        "Update Round Info"
                      )}
                    </Button>
                  </div>

                  <div
                    className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-orange-400 p-6 space-y-4"
                    style={{
                      boxShadow:
                        "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div>
                      <h3 className="font-extrabold text-gray-900 border-l-4 border-orange-400 pl-3">
                        Paynow Integration
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 pl-3">
                        Configure your Paynow Zimbabwe merchant credentials.
                        These are stored securely on-chain.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        data-ocid="admin.paynow.input"
                        type="text"
                        placeholder="Integration ID"
                        value={paynowIntegrationId}
                        onChange={(e) => setPaynowIntegrationId(e.target.value)}
                        className="col-span-2 md:col-span-1"
                      />
                      <div className="relative col-span-2 md:col-span-1">
                        <Input
                          data-ocid="admin.paynow.input"
                          type={showPaynowKey ? "text" : "password"}
                          placeholder="Integration Key"
                          value={paynowIntegrationKey}
                          onChange={(e) =>
                            setPaynowIntegrationKey(e.target.value)
                          }
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPaynowKey((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        >
                          {showPaynowKey ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      <Input
                        data-ocid="admin.paynow.input"
                        type="text"
                        placeholder="https://yourdomain.com/return"
                        value={paynowReturnUrl}
                        onChange={(e) => setPaynowReturnUrl(e.target.value)}
                        className="col-span-2 md:col-span-1"
                      />
                      <Input
                        data-ocid="admin.paynow.input"
                        type="text"
                        placeholder="https://yourdomain.com/result"
                        value={paynowResultUrl}
                        onChange={(e) => setPaynowResultUrl(e.target.value)}
                        className="col-span-2 md:col-span-1"
                      />
                    </div>
                    <Button
                      data-ocid="admin.paynow.save_button"
                      onClick={handleSavePaynow}
                      disabled={savePaynowConfig.isPending}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
                    >
                      {savePaynowConfig.isPending ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        "Save Paynow Config"
                      )}
                    </Button>
                  </div>

                  <div
                    className="bg-white rounded-2xl border border-purple-100 p-6"
                    style={{
                      boxShadow:
                        "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                    }}
                  >
                    <h3 className="font-bold text-purple-700 mb-2 border-l-4 border-purple-400 pl-3">
                      Sea-Freight Optimizer (LCL)
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Consolidating non-perishables reduces freight by 65%. 30%
                      Cap maintained with 18.2% profit margin.
                    </p>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        data-ocid="admin.checkbox"
                        id="freight-optimizer"
                        checked={freightOptimizer}
                        onCheckedChange={(v) => setFreightOptimizer(!!v)}
                      />
                      <label
                        htmlFor="freight-optimizer"
                        className="text-xs font-bold uppercase cursor-pointer text-purple-600"
                      >
                        Apply &quot;Institutional Cultural Support&quot; Customs
                        Shield
                      </label>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {view === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
                  <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-3">
                    Our Story
                  </span>
                  <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                    About Global Rail
                  </h1>
                  <p className="text-gray-500 text-lg max-w-xl mx-auto">
                    Born from the lived experience of Zimbabweans studying
                    abroad — bridging the distance between home and heart.
                  </p>
                </div>
              </div>
              <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
                <section className="bg-blue-500 rounded-2xl p-8 sm:p-10 text-white text-center">
                  <h2 className="text-2xl font-black mb-3 font-display">
                    Our Vision &amp; Mission
                  </h2>
                  <p className="text-blue-100 text-sm uppercase tracking-widest font-bold mb-4">
                    Global Rail — Core Purpose
                  </p>
                  <blockquote className="text-xl sm:text-2xl font-bold leading-relaxed">
                    &ldquo;Making those away from home feel at home without
                    paying extra.&rdquo;
                  </blockquote>
                  <p className="text-blue-100 text-sm mt-4 max-w-xl mx-auto">
                    We exist to deliver the taste, comfort, and culture of
                    Zimbabwe to every Zimbabwean student, professional, and
                    family member living abroad — affordably, reliably, and with
                    love.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-black text-gray-900 mb-6">
                    A Word from Our Leadership
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      className="bg-white rounded-2xl border border-gray-100 p-7"
                      style={{
                        boxShadow:
                          "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div className="flex items-start gap-4 mb-5">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center font-black text-white text-lg flex-shrink-0"
                          style={{ background: "#3b82f6" }}
                        >
                          DM
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900 text-base">
                            Desmond Mahachi
                          </h3>
                          <p className="text-blue-500 text-xs font-bold uppercase tracking-wider">
                            Managing Director
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            21 yrs · BTech Mechanical Engineering
                          </p>
                          <p className="text-gray-400 text-xs">
                            KIIT University, India
                          </p>
                        </div>
                      </div>
                      <blockquote className="text-gray-600 text-sm leading-relaxed border-l-2 border-blue-200 pl-4 italic">
                        &ldquo;Being a Zimbabwean student in India, I know
                        exactly what it feels like to miss home. The comfort
                        food, the familiar brands, the sense of belonging that
                        comes from the simplest things. Global Rail was born
                        from that longing. We are not just a logistics company —
                        we are a bridge between who you are and where you are.
                        My vision is simple: no Zimbabwean abroad should ever
                        have to choose between their culture and their budget.
                        Welcome to your home away from home.&rdquo;
                      </blockquote>
                    </div>
                    <div
                      className="bg-white rounded-2xl border border-gray-100 p-7"
                      style={{
                        boxShadow:
                          "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div className="flex items-start gap-4 mb-5">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center font-black text-white text-lg flex-shrink-0"
                          style={{ background: "#8b5cf6" }}
                        >
                          MF
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900 text-base">
                            Moesha Fakazani
                          </h3>
                          <p className="text-purple-500 text-xs font-bold uppercase tracking-wider">
                            Executive Director
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            20 yrs · BSc Actuarial Science
                          </p>
                          <p className="text-gray-400 text-xs">
                            University of Zimbabwe
                          </p>
                        </div>
                      </div>
                      <blockquote className="text-gray-600 text-sm leading-relaxed border-l-2 border-purple-200 pl-4 italic">
                        &ldquo;As someone who understands risk, sustainability,
                        and the financial pressures students face, I joined
                        Global Rail to build something that truly serves our
                        community. Every price we set, every route we plan,
                        every batch we organise — it all comes down to making
                        life a little easier for Zimbabweans around the world.
                        We are young, we are driven, and we are deeply committed
                        to delivering value without compromise. This is our
                        promise to you.&rdquo;
                      </blockquote>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-black text-gray-900 mb-6">
                    Our Companies
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      className="bg-white rounded-2xl border border-gray-100 p-6"
                      style={{
                        boxShadow:
                          "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                        <span className="text-blue-600 font-black text-sm">
                          MD
                        </span>
                      </div>
                      <h3 className="font-black text-gray-900 text-base mb-1">
                        Mahachi Desmond Private Limited Company
                      </h3>
                      <p className="text-gray-400 text-xs mb-3">
                        Operating Company · Zimbabwe
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin
                            size={14}
                            className="text-blue-400 mt-0.5 flex-shrink-0"
                          />
                          <span>F19A Kandodo, Zvishavane, Zimbabwe</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <Mail
                            size={14}
                            className="text-blue-400 mt-0.5 flex-shrink-0"
                          />
                          <a
                            href="mailto:mdprivatelimited2024@gmail.com"
                            className="text-blue-500 hover:underline break-all"
                          >
                            mdprivatelimited2024@gmail.com
                          </a>
                        </div>
                      </div>
                    </div>
                    <div
                      className="bg-white rounded-2xl border border-gray-100 p-6"
                      style={{
                        boxShadow:
                          "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                        <span className="text-purple-600 font-black text-sm">
                          CS
                        </span>
                      </div>
                      <h3 className="font-black text-gray-900 text-base mb-1">
                        Cool Smarts Ltd
                      </h3>
                      <p className="text-gray-400 text-xs mb-3">
                        Parent Company · United Kingdom
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin
                            size={14}
                            className="text-purple-400 mt-0.5 flex-shrink-0"
                          />
                          <span>128 City Road, London, UK</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <Mail
                            size={14}
                            className="text-purple-400 mt-0.5 flex-shrink-0"
                          />
                          <a
                            href="mailto:coolsmartszvishavane@gmail.com"
                            className="text-blue-500 hover:underline break-all"
                          >
                            coolsmartszvishavane@gmail.com
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {view === "privacy" && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
                  <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-3">
                    Legal
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    Privacy Policy
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Cool Smarts Ltd / Global Rail · Last updated:{" "}
                    {new Date().toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
                <div
                  className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8 text-sm text-gray-600 leading-relaxed"
                  style={{
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                  }}
                >
                  {[
                    {
                      title: "1. Introduction",
                      content:
                        'Cool Smarts Ltd ("we", "our", or "us"), operating under the Global Rail brand, is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.',
                    },
                    {
                      title: "2. Information We Collect",
                      content:
                        "We collect information you provide directly, including: your name and contact details when you create an account; order information such as destination country, university or hostel name, and postcode; payment method selection (Paynow or Wise/GBP); Internet Identity principal used for authentication. We also automatically collect usage data such as pages visited and actions taken on the platform.",
                    },
                    {
                      title: "3. How We Use Your Data",
                      content:
                        "Your data is used to: process and fulfil your grocery batch orders; communicate with you about your orders and delivery rounds; administer your account and role (standard user or admin); improve our logistics and freight planning; comply with applicable laws and regulations.",
                    },
                    {
                      title: "4. Order Data & Batch Logistics",
                      content:
                        "Orders are grouped into batch rounds (e.g. Grocery Round #01). Your order data — including destination, items, and quantities — is shared with our logistics partners and hub coordinators to enable consolidated sea-freight delivery. This data is retained for the duration of the batch round and for record-keeping purposes thereafter.",
                    },
                    {
                      title: "5. Cookies & Local Storage",
                      content:
                        "We use browser localStorage to store your privacy consent preference. We do not use tracking cookies for advertising. We may use essential session data to maintain your login state via Internet Identity.",
                    },
                    {
                      title: "6. Third-Party Services",
                      content:
                        "We use the following third-party services: Internet Identity (Dfinity) for authentication — governed by their own privacy policy; Paynow Zimbabwe for payment processing; Wise (TransferWise) for international payment processing. We do not sell your data to third parties.",
                    },
                    {
                      title: "7. Your Rights",
                      content:
                        "You have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your data (subject to legal retention requirements); withdraw consent at any time. To exercise your rights, contact us at coolsmartszvishavane@gmail.com or mdprivatelimited2024@gmail.com.",
                    },
                    {
                      title: "8. Data Security",
                      content:
                        "Your data is stored on-chain using the Internet Computer blockchain, which provides cryptographic security and decentralised redundancy. We implement appropriate technical measures to protect your information from unauthorised access.",
                    },
                    {
                      title: "9. Children's Privacy",
                      content:
                        "Global Rail is intended for users aged 16 and over. We do not knowingly collect data from children under 16. If you believe a child has provided us with personal information, please contact us immediately.",
                    },
                    {
                      title: "10. Changes to This Policy",
                      content:
                        "We may update this Privacy Policy from time to time. We will notify users of significant changes by displaying a notice on the platform. Continued use of Global Rail after changes constitutes acceptance of the updated policy.",
                    },
                    {
                      title: "11. Contact Us",
                      content:
                        "For any privacy-related queries, please contact: Cool Smarts Ltd, 128 City Road, London, UK — coolsmartszvishavane@gmail.com. Mahachi Desmond Private Limited Company, F19A Kandodo, Zvishavane, Zimbabwe — mdprivatelimited2024@gmail.com.",
                    },
                  ].map((section) => (
                    <div key={section.title}>
                      <h2 className="font-bold text-gray-900 text-base mb-2">
                        {section.title}
                      </h2>
                      <p>{section.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === "myorders" && (
            <motion.div
              key="myorders"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
                  <h1 className="text-2xl font-black text-gray-900 mb-1">
                    My Orders
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Track and confirm your batch orders.
                  </p>
                </div>
              </div>
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {!isLoggedIn ? (
                  <div
                    data-ocid="myorders.empty_state"
                    className="text-center py-16 bg-blue-50 rounded-2xl border border-blue-100"
                  >
                    <Package size={40} className="mx-auto text-blue-300 mb-3" />
                    <p className="font-bold text-gray-700 mb-1">
                      You are not logged in
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      Please login to view your orders.
                    </p>
                    <Button
                      onClick={login}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
                    >
                      Login to View Orders
                    </Button>
                  </div>
                ) : myOrders.length === 0 ? (
                  <div
                    data-ocid="myorders.empty_state"
                    className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100"
                  >
                    <Package size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="font-bold text-gray-700 mb-1">
                      No orders yet
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      Your orders will appear here once you place them.
                    </p>
                    <Button
                      onClick={() => setView("store")}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
                    >
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myOrders.map((order, idx) => {
                      const statusKey = (order as any).status
                        ? Object.keys((order as any).status as object)[0]
                        : "pendingPayment";
                      const statusLabels: Record<
                        string,
                        { label: string; cls: string }
                      > = {
                        pendingPayment: {
                          label: "Pending Payment",
                          cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
                        },
                        paymentConfirmed: {
                          label: "Payment Confirmed",
                          cls: "bg-blue-100 text-blue-700 border-blue-200",
                        },
                        shipped: {
                          label: "Shipped",
                          cls: "bg-purple-100 text-purple-700 border-purple-200",
                        },
                        delivered: {
                          label: "Delivered",
                          cls: "bg-green-100 text-green-700 border-green-200",
                        },
                        receivedByUser: {
                          label: "Received ✓",
                          cls: "bg-gray-100 text-gray-600 border-gray-200",
                        },
                      };
                      const statusInfo =
                        statusLabels[statusKey] ?? statusLabels.pendingPayment;
                      const datePlaced = new Date(
                        Number(order.timestamp) / 1_000_000,
                      );
                      return (
                        <div
                          key={Number(order.id)}
                          data-ocid={`myorders.item.${idx + 1}`}
                          className="bg-white rounded-2xl border border-gray-100 p-5"
                          style={{
                            boxShadow:
                              "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                          }}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="font-black text-gray-900 text-base">
                                Order #{Number(order.id)}
                              </p>
                              <p className="text-gray-400 text-xs mt-0.5">
                                Placed{" "}
                                {datePlaced.toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.cls}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-0.5">
                                Items
                              </p>
                              <p className="font-bold text-gray-800">
                                {order.itemIds.length}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-0.5">
                                Destination
                              </p>
                              <p className="font-bold text-gray-800">
                                {order.destination}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-0.5">
                                University
                              </p>
                              <p className="font-bold text-gray-800 truncate">
                                {order.university}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-gray-400 text-xs mb-0.5">
                                Payment
                              </p>
                              <p className="font-bold text-gray-800">
                                {order.paymentMethod === "online"
                                  ? "Wise/GBP"
                                  : "Paynow"}
                              </p>
                            </div>
                          </div>
                          {statusKey === "delivered" && (
                            <Button
                              data-ocid={`myorders.confirm_button.${idx + 1}`}
                              onClick={() =>
                                confirmOrderReceived.mutate(order.id)
                              }
                              disabled={confirmOrderReceived.isPending}
                              className="bg-green-500 hover:bg-green-600 text-white font-bold text-sm"
                            >
                              {confirmOrderReceived.isPending ? (
                                <Loader2
                                  className="animate-spin mr-2"
                                  size={14}
                                />
                              ) : null}
                              Confirm Receipt
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GRLogo />
                <span className="font-black text-gray-900">
                  GLOBAL <span className="text-blue-500">RAIL</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Making those away from home feel at home without paying extra.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-700 text-sm mb-3 uppercase tracking-wider">
                Navigate
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => setView("store")}
                    className="text-gray-400 hover:text-blue-500 text-sm transition"
                  >
                    Shop
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setView("about")}
                    className="text-gray-400 hover:text-blue-500 text-sm transition"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setView("privacy")}
                    className="text-gray-400 hover:text-blue-500 text-sm transition"
                  >
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-700 text-sm mb-3 uppercase tracking-wider">
                Contact
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-1.5">
                  <MapPin
                    size={13}
                    className="text-blue-400 mt-0.5 flex-shrink-0"
                  />
                  <span>F19A Kandodo, Zvishavane, ZW</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <MapPin
                    size={13}
                    className="text-purple-400 mt-0.5 flex-shrink-0"
                  />
                  <span>128 City Road, London, UK</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Mail
                    size={13}
                    className="text-blue-400 mt-0.5 flex-shrink-0"
                  />
                  <a
                    href="mailto:coolsmartszvishavane@gmail.com"
                    className="hover:text-blue-500 transition break-all"
                  >
                    coolsmartszvishavane@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Cool Smarts Ltd / Mahachi Desmond
              Private Limited Company. All rights reserved.
            </p>
            <p className="text-xs text-gray-300">
              Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-500 transition"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* PRIVACY BANNER */}
      <AnimatePresence>
        {!privacyAccepted && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <p className="text-sm text-gray-300 text-center sm:text-left">
              We use cookies and process your data to provide our services. By
              using Global Rail, you agree to our{" "}
              <button
                type="button"
                onClick={() => setView("privacy")}
                className="underline text-blue-400 hover:text-blue-300"
              >
                Privacy Policy
              </button>
              .
            </p>
            <Button
              onClick={acceptPrivacy}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-6 flex-shrink-0"
            >
              Accept
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
