import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Minus,
  Package,
  Plus,
  Settings,
  Shield,
  ShoppingCart,
  Train,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PaymentMethod, type Product } from "./backend.d";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  OrderStatus,
  useAddProduct,
  useChangeAdminPassword,
  useCheckAdminPassword,
  useConfirmOrderReceived,
  useGetAllOrders,
  useGetAllProducts,
  useGetCurrentRoundInfo,
  useGetMyOrders,
  useGetPaynowConfig,
  usePlaceOrder,
  useRemoveProduct,
  useSetCurrentRoundInfo,
  useSetPaynowConfig,
  useUpdateOrderStatus,
} from "./hooks/useQueries";

type View = "store" | "admin" | "about" | "privacy" | "myorders";

interface CartItem {
  product: Product;
  qty: number;
}

const DESTINATIONS = ["India", "United Kingdom", "Poland", "UAE"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.pendingPayment]: "Pending Payment",
  [OrderStatus.paymentConfirmed]: "Payment Confirmed",
  [OrderStatus.shipped]: "Shipped",
  [OrderStatus.delivered]: "Delivered",
  [OrderStatus.receivedByUser]: "Received ✓",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.pendingPayment]: "bg-yellow-100 text-yellow-800",
  [OrderStatus.paymentConfirmed]: "bg-blue-100 text-blue-800",
  [OrderStatus.shipped]: "bg-purple-100 text-purple-800",
  [OrderStatus.delivered]: "bg-green-100 text-green-800",
  [OrderStatus.receivedByUser]: "bg-gray-100 text-gray-700",
};

function formatPrice(n: number) {
  return `$${(n * 1.3).toFixed(2)}`;
}

export default function App() {
  const { login, clear, identity, loginStatus, isInitializing } =
    useInternetIdentity();
  const isLoggedIn = !!identity;

  const [view, setView] = useState<View>("store");
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("gr_empire_box");
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState("");
  const [destination, setDestination] = useState("");
  const [university, setUniversity] = useState("");
  const [pincode, setPincode] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(false);
  const [freightOptimizer, setFreightOptimizer] = useState(false);

  // Admin forms
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductOrigin, setNewProductOrigin] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");

  const [roundNumber, setRoundNumber] = useState("");
  const [roundDate, setRoundDate] = useState("");

  const [paynowIntId, setPaynowIntId] = useState("");
  const [paynowKey, setPaynowKey] = useState("");
  const [paynowReturn, setPaynowReturn] = useState("");
  const [paynowResult, setPaynowResult] = useState("");
  const [showPaynowKey, setShowPaynowKey] = useState(false);

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Queries
  const { data: products, isLoading: loadingProducts } = useGetAllProducts();
  const { data: roundInfo } = useGetCurrentRoundInfo();
  const { data: myOrders, isLoading: loadingMyOrders } =
    useGetMyOrders(isLoggedIn);
  const { data: allOrders } = useGetAllOrders(adminKey);
  const { data: paynowConfig } = useGetPaynowConfig(adminKey);

  // Mutations
  const checkPass = useCheckAdminPassword();
  const changePass = useChangeAdminPassword();
  const addProduct = useAddProduct();
  const removeProduct = useRemoveProduct();
  const updateStatus = useUpdateOrderStatus();
  const confirmReceived = useConfirmOrderReceived();
  const placeOrder = usePlaceOrder();
  const setPaynow = useSetPaynowConfig();
  const setRound = useSetCurrentRoundInfo();

  useEffect(() => {
    const accepted = localStorage.getItem("gr_privacy_accepted");
    if (!accepted) setShowPrivacyBanner(true);
  }, []);

  // Persist Empire Box (cart) to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("gr_empire_box", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Pre-fill paynow fields when config loads
  useEffect(() => {
    if (paynowConfig) {
      setPaynowIntId(paynowConfig.integrationId);
      setPaynowKey(paynowConfig.integrationKey);
      setPaynowReturn(paynowConfig.returnUrl);
      setPaynowResult(paynowConfig.resultUrl);
    }
  }, [paynowConfig]);

  // Pre-fill round fields
  useEffect(() => {
    if (roundInfo) {
      setRoundNumber(String(roundInfo.roundNumber));
      setRoundDate(roundInfo.closingDate);
    }
  }, [roundInfo]);

  const cartTotal = cart.reduce(
    (s, i) => s + i.product.retailPrice * 1.3 * i.qty,
    0,
  );

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...prev, { product, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, qty: i.qty + delta } : i,
        )
        .filter((i) => i.qty > 0),
    );
  }, []);

  const handleAdminLogin = async () => {
    if (!adminPassInput.trim()) return;
    try {
      const ok = await checkPass.mutateAsync(adminPassInput.trim());
      if (ok) {
        setAdminKey(adminPassInput.trim());
        setAdminModalOpen(false);
        setAdminPassInput("");
        setView("admin");
        toast.success("Admin access granted");
      } else {
        toast.error("Incorrect password");
      }
    } catch {
      toast.error("Failed to verify password — please try again");
    }
  };

  const handleLogoutAdmin = () => {
    setAdminKey("");
    setView("store");
    toast.success("Logged out of admin");
  };

  const handleCheckout = async (method: PaymentMethod) => {
    if (!isLoggedIn) {
      toast.error("Please log in to place an order");
      return;
    }
    if (!destination) {
      toast.error("Select a destination");
      return;
    }
    if (!university) {
      toast.error("Enter university/hostel name");
      return;
    }
    if (!pincode) {
      toast.error("Enter pincode");
      return;
    }
    if (!privacyAccepted) {
      toast.error("Please accept the privacy policy");
      return;
    }
    if (cartTotal < 50) {
      toast.error("Minimum order is $50");
      return;
    }

    const itemIds = new Uint32Array(
      cart.flatMap((i) => Array(i.qty).fill(i.product.id)),
    );
    try {
      await placeOrder.mutateAsync({
        destination,
        paymentMethod: method,
        university,
        pincode: Number(pincode),
        itemIds,
      });
      setCart([]);
      localStorage.removeItem("gr_empire_box");
      setCartOpen(false);
      toast.success("Order placed!", {
        action: { label: "View Orders", onClick: () => setView("myorders") },
      });
    } catch {
      toast.error("Failed to place order");
    }
  };

  const handleChangePassword = async () => {
    if (newPass !== confirmPass) {
      toast.error("Passwords don't match");
      return;
    }
    if (!newPass) {
      toast.error("Enter a new password");
      return;
    }
    try {
      const ok = await changePass.mutateAsync({
        oldPassword: oldPass,
        newPassword: newPass,
      });
      if (ok) {
        setAdminKey(newPass);
        setOldPass("");
        setNewPass("");
        setConfirmPass("");
        toast.success("Password changed");
      } else {
        toast.error("Old password incorrect");
      }
    } catch {
      toast.error("Failed to change password");
    }
  };

  const handleSavePaynow = async () => {
    try {
      await setPaynow.mutateAsync({
        adminKey,
        config: {
          integrationId: paynowIntId,
          integrationKey: paynowKey,
          returnUrl: paynowReturn,
          resultUrl: paynowResult,
        },
      });
      toast.success("Paynow config saved");
    } catch {
      toast.error("Failed to save config");
    }
  };

  const handleSaveRound = async () => {
    try {
      await setRound.mutateAsync({
        adminKey,
        roundInfo: { roundNumber: Number(roundNumber), closingDate: roundDate },
      });
      toast.success("Round info updated");
    } catch {
      toast.error("Failed to update round");
    }
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster richColors />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <button
            type="button"
            onClick={() => setView("store")}
            className="flex items-center gap-2 font-display font-bold text-xl text-primary"
            data-ocid="nav.link"
          >
            <Train className="w-6 h-6" />
            Global Rail
          </button>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {(["store", "about", "privacy"] as const).map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setView(v)}
                data-ocid={`nav.${v}.link`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {v === "store"
                  ? "Shop"
                  : v === "about"
                    ? "About Us"
                    : "Privacy"}
              </button>
            ))}
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => setView("myorders")}
                data-ocid="nav.myorders.link"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === "myorders"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                My Orders
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {/* Admin button */}
            {adminKey ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setView(view === "admin" ? "store" : "admin")}
                  data-ocid="nav.admin.button"
                  className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  {view === "admin" ? "Shop" : "Admin"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogoutAdmin}
                  data-ocid="nav.admin.logout.button"
                >
                  <Lock className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setAdminModalOpen(true)}
                data-ocid="nav.admin.button"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Shield className="w-4 h-4 mr-1" />
                Admin
              </Button>
            )}

            {/* Login/Logout */}
            {isInitializing ? null : isLoggedIn ? (
              <Button
                size="sm"
                variant="outline"
                onClick={clear}
                data-ocid="nav.logout.button"
              >
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={login}
                disabled={loginStatus === "logging-in"}
                data-ocid="nav.login.button"
              >
                <LogIn className="w-4 h-4 mr-1" />
                {loginStatus === "logging-in" ? "Signing in..." : "Login"}
              </Button>
            )}

            {/* Cart */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCartOpen(true)}
              className="relative"
              data-ocid="nav.cart.button"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* ROUND BANNER */}
      {roundInfo && (
        <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
          <Clock className="w-4 h-4 inline mr-1" />
          Grocery Round #{roundInfo.roundNumber} — Closes{" "}
          {roundInfo.closingDate} &nbsp;·&nbsp; Minimum order $50 · Late orders
          shift to next round
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <AnimatePresence mode="wait">
          {view === "store" && (
            <motion.div
              key="store"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              {/* Hero */}
              <div className="text-center mb-12 py-8">
                <motion.h1
                  className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Making those away from home
                  <br />
                  <span className="text-primary">feel at home</span>
                </motion.h1>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                  Without paying extra. International grocery and goods delivery
                  — batch logistics for students and families.
                </p>
              </div>

              {/* Products */}
              {loadingProducts ? (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  data-ocid="products.loading_state"
                >
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-56 rounded-xl" />
                  ))}
                </div>
              ) : !products?.length ? (
                <div
                  className="text-center py-20 text-muted-foreground"
                  data-ocid="products.empty_state"
                >
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-lg">Products loading — check back soon</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, idx) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      cartQty={
                        cart.find((i) => i.product.id === product.id)?.qty ?? 0
                      }
                      onAdd={() => addToCart(product)}
                      onUpdateQty={(d) => updateQty(product.id, d)}
                      index={idx + 1}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === "admin" && adminKey && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <AdminPanel
                adminKey={adminKey}
                allOrders={allOrders ?? []}
                updateStatus={updateStatus}
                addProduct={addProduct}
                removeProduct={removeProduct}
                products={products ?? []}
                roundNumber={roundNumber}
                setRoundNumber={setRoundNumber}
                roundDate={roundDate}
                setRoundDate={setRoundDate}
                onSaveRound={handleSaveRound}
                paynowIntId={paynowIntId}
                setPaynowIntId={setPaynowIntId}
                paynowKey={paynowKey}
                setPaynowKey={setPaynowKey}
                paynowReturn={paynowReturn}
                setPaynowReturn={setPaynowReturn}
                paynowResult={paynowResult}
                setPaynowResult={setPaynowResult}
                showPaynowKey={showPaynowKey}
                setShowPaynowKey={setShowPaynowKey}
                onSavePaynow={handleSavePaynow}
                newProductName={newProductName}
                setNewProductName={setNewProductName}
                newProductPrice={newProductPrice}
                setNewProductPrice={setNewProductPrice}
                newProductOrigin={newProductOrigin}
                setNewProductOrigin={setNewProductOrigin}
                newProductCategory={newProductCategory}
                setNewProductCategory={setNewProductCategory}
                oldPass={oldPass}
                setOldPass={setOldPass}
                newPass={newPass}
                setNewPass={setNewPass}
                confirmPass={confirmPass}
                setConfirmPass={setConfirmPass}
                onChangePassword={handleChangePassword}
                freightOptimizer={freightOptimizer}
                setFreightOptimizer={setFreightOptimizer}
                isSavingRound={setRound.isPending}
                isSavingPaynow={setPaynow.isPending}
                isChangingPass={changePass.isPending}
              />
            </motion.div>
          )}

          {view === "myorders" && (
            <motion.div
              key="myorders"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <MyOrdersView
                isLoggedIn={isLoggedIn}
                onLogin={login}
                myOrders={myOrders ?? []}
                isLoading={loadingMyOrders}
                onConfirmReceived={(id) => confirmReceived.mutate(id)}
                confirming={confirmReceived.isPending}
              />
            </motion.div>
          )}

          {view === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <AboutView />
            </motion.div>
          )}

          {view === "privacy" && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <PrivacyView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Cool Smarts LTD · Global Rail. Built with
          ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* ADMIN MODAL */}
      <Dialog open={adminModalOpen} onOpenChange={setAdminModalOpen}>
        <DialogContent data-ocid="admin.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              Admin Access
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-pass">Enter admin password</Label>
              <Input
                id="admin-pass"
                type="password"
                placeholder="Password"
                value={adminPassInput}
                onChange={(e) => setAdminPassInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                data-ocid="admin.input"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleAdminLogin}
              disabled={checkPass.isPending || !adminPassInput.trim()}
              data-ocid="admin.submit_button"
            >
              {checkPass.isPending ? "Verifying..." : "Unlock Admin Panel"}
            </Button>
            {checkPass.isError && (
              <p
                className="text-destructive text-sm text-center"
                data-ocid="admin.error_state"
              >
                Failed to verify — please try again
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CART DRAWER */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          className="w-full sm:max-w-lg flex flex-col"
          data-ocid="cart.sheet"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> Empire Box
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto mt-4 space-y-3">
            {cart.length === 0 ? (
              <div
                className="text-center py-12 text-muted-foreground"
                data-ocid="cart.empty_state"
              >
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border"
                  data-ocid={`cart.item.${idx + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.product.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatPrice(item.product.retailPrice)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateQty(item.product.id, -1)}
                      className="p-1 rounded hover:bg-muted"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.product.id, 1)}
                      className="p-1 rounded hover:bg-muted"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm font-medium w-16 text-right">
                    ${(item.product.retailPrice * 1.3 * item.qty).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={() => updateQty(item.product.id, -item.qty)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Destination</Label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger data-ocid="cart.destination.select">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {DESTINATIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>University / Hostel</Label>
                  <Input
                    placeholder="e.g. KIIT University"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    data-ocid="cart.university.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Pincode</Label>
                  <Input
                    placeholder="Postal code"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    data-ocid="cart.pincode.input"
                  />
                </div>
                <label
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  data-ocid="cart.privacy.checkbox"
                >
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>
                    I accept the{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setCartOpen(false);
                        setView("privacy");
                      }}
                      className="underline text-primary"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className={cartTotal < 50 ? "text-destructive" : ""}>
                  ${cartTotal.toFixed(2)}
                  {cartTotal < 50 && (
                    <span className="text-xs font-normal ml-1">(min $50)</span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleCheckout(PaymentMethod.online)}
                  disabled={
                    cartTotal < 50 || placeOrder.isPending || !privacyAccepted
                  }
                  data-ocid="cart.paynow.primary_button"
                  className="bg-primary text-primary-foreground"
                >
                  Paynow (Zim)
                </Button>
                <Button
                  onClick={() => handleCheckout(PaymentMethod.cashOnDelivery)}
                  disabled={
                    cartTotal < 50 || placeOrder.isPending || !privacyAccepted
                  }
                  data-ocid="cart.wise.secondary_button"
                  variant="outline"
                >
                  Wise/GBP
                </Button>
              </div>
              {!isLoggedIn && (
                <p className="text-xs text-muted-foreground text-center">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs"
                    onClick={login}
                  >
                    Log in
                  </Button>{" "}
                  to place an order
                </p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* PRIVACY CONSENT BANNER */}
      {showPrivacyBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4 shadow-lg"
          data-ocid="privacy.toast"
        >
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            <p className="text-sm text-muted-foreground flex-1">
              We use cookies to improve your experience. Read our{" "}
              <button
                type="button"
                onClick={() => setView("privacy")}
                className="underline text-primary"
              >
                Privacy Policy
              </button>
              .
            </p>
            <Button
              size="sm"
              onClick={() => {
                localStorage.setItem("gr_privacy_accepted", "1");
                setShowPrivacyBanner(false);
              }}
              data-ocid="privacy.accept.primary_button"
            >
              Accept
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({
  product,
  cartQty,
  onAdd,
  onUpdateQty,
  index,
}: {
  product: Product;
  cartQty: number;
  onAdd: () => void;
  onUpdateQty: (delta: number) => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`products.item.${index}`}
    >
      <Card className="h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-display font-semibold text-lg leading-snug">
              {product.name}
            </h3>
            <span className="font-bold text-primary ml-2 shrink-0">
              {formatPrice(product.retailPrice)}
            </span>
          </div>
          <div className="flex gap-1.5 mb-4 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {product.origin}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          </div>
          <div className="mt-auto">
            {cartQty === 0 ? (
              <Button
                className="w-full"
                onClick={onAdd}
                data-ocid={`products.add_button.${index}`}
              >
                <Plus className="w-4 h-4 mr-1" /> Add to Box
              </Button>
            ) : (
              <div className="flex items-center justify-between bg-muted rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => onUpdateQty(-1)}
                  className="p-2 rounded hover:bg-background transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-semibold">{cartQty}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQty(1)}
                  className="p-2 rounded hover:bg-background transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── AdminPanel ───────────────────────────────────────────────────────────────
function AdminPanel(props: {
  adminKey: string;
  allOrders: ReturnType<typeof useGetAllOrders>["data"] & object[];
  updateStatus: ReturnType<typeof useUpdateOrderStatus>;
  addProduct: ReturnType<typeof useAddProduct>;
  removeProduct: ReturnType<typeof useRemoveProduct>;
  products: Product[];
  roundNumber: string;
  setRoundNumber: (v: string) => void;
  roundDate: string;
  setRoundDate: (v: string) => void;
  onSaveRound: () => void;
  paynowIntId: string;
  setPaynowIntId: (v: string) => void;
  paynowKey: string;
  setPaynowKey: (v: string) => void;
  paynowReturn: string;
  setPaynowReturn: (v: string) => void;
  paynowResult: string;
  setPaynowResult: (v: string) => void;
  showPaynowKey: boolean;
  setShowPaynowKey: (v: boolean) => void;
  onSavePaynow: () => void;
  newProductName: string;
  setNewProductName: (v: string) => void;
  newProductPrice: string;
  setNewProductPrice: (v: string) => void;
  newProductOrigin: string;
  setNewProductOrigin: (v: string) => void;
  newProductCategory: string;
  setNewProductCategory: (v: string) => void;
  oldPass: string;
  setOldPass: (v: string) => void;
  newPass: string;
  setNewPass: (v: string) => void;
  confirmPass: string;
  setConfirmPass: (v: string) => void;
  onChangePassword: () => void;
  freightOptimizer: boolean;
  setFreightOptimizer: (v: boolean) => void;
  isSavingRound: boolean;
  isSavingPaynow: boolean;
  isChangingPass: boolean;
}) {
  const {
    adminKey,
    allOrders,
    updateStatus,
    addProduct,
    removeProduct,
    products,
  } = props;

  const handleAddProduct = async () => {
    if (!props.newProductName || !props.newProductPrice) return;
    try {
      await addProduct.mutateAsync({
        adminKey,
        name: props.newProductName,
        retailPrice: Number(props.newProductPrice),
        origin: props.newProductOrigin,
        category: props.newProductCategory,
      });
      props.setNewProductName("");
      props.setNewProductPrice("");
      props.setNewProductOrigin("");
      props.setNewProductCategory("");
      toast.success("Product added");
    } catch {
      toast.error("Failed to add product");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="w-7 h-7 text-accent" />
        <h2 className="font-display text-2xl font-bold">Admin Dashboard</h2>
      </div>

      {/* Add Product */}
      <Card data-ocid="admin.product.panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5" /> Product Rail Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input
                value={props.newProductName}
                onChange={(e) => props.setNewProductName(e.target.value)}
                placeholder="Mazoe Orange Crush"
                data-ocid="admin.product.name.input"
              />
            </div>
            <div>
              <Label>Retail Price (USD)</Label>
              <Input
                type="number"
                value={props.newProductPrice}
                onChange={(e) => props.setNewProductPrice(e.target.value)}
                placeholder="4.50"
                data-ocid="admin.product.price.input"
              />
            </div>
            <div>
              <Label>Origin</Label>
              <Input
                value={props.newProductOrigin}
                onChange={(e) => props.setNewProductOrigin(e.target.value)}
                placeholder="Zimbabwe"
                data-ocid="admin.product.origin.input"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={props.newProductCategory}
                onChange={(e) => props.setNewProductCategory(e.target.value)}
                placeholder="Beverages"
                data-ocid="admin.product.category.input"
              />
            </div>
          </div>
          <Button
            onClick={handleAddProduct}
            disabled={addProduct.isPending}
            data-ocid="admin.product.add.primary_button"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Product
          </Button>
        </CardContent>
      </Card>

      {/* Products list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Current Products ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p
              className="text-muted-foreground text-sm"
              data-ocid="admin.products.empty_state"
            >
              No products yet.
            </p>
          ) : (
            <div className="space-y-2">
              {products.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded border border-border"
                  data-ocid={`admin.products.item.${idx + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{p.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {p.origin} · {p.category}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {formatPrice(p.retailPrice)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      removeProduct.mutate({ adminKey, productId: p.id })
                    }
                    data-ocid={`admin.products.delete_button.${idx + 1}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders */}
      <Card data-ocid="admin.orders.panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="w-5 h-5" /> Institutional Stock Sync / Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!allOrders || allOrders.length === 0 ? (
            <p
              className="text-muted-foreground text-sm"
              data-ocid="admin.orders.empty_state"
            >
              No orders yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="admin.orders.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allOrders.map((order, idx) => (
                    <TableRow
                      key={String(order.id)}
                      data-ocid={`admin.orders.row.${idx + 1}`}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        #{String(order.id)}
                      </TableCell>
                      <TableCell>{order.destination}</TableCell>
                      <TableCell>{order.university}</TableCell>
                      <TableCell>{order.itemIds.length}</TableCell>
                      <TableCell className="capitalize">
                        {order.paymentMethod}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(v) =>
                            updateStatus.mutate({
                              adminKey,
                              orderId: order.id,
                              status: v as OrderStatus,
                            })
                          }
                        >
                          <SelectTrigger
                            className="h-8 text-xs w-40"
                            data-ocid={`admin.orders.status.select.${idx + 1}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(OrderStatus).map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Round Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" /> Round Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Round Number</Label>
              <Input
                type="number"
                value={props.roundNumber}
                onChange={(e) => props.setRoundNumber(e.target.value)}
                data-ocid="admin.round.number.input"
              />
            </div>
            <div>
              <Label>Closing Date</Label>
              <Input
                type="date"
                value={props.roundDate}
                onChange={(e) => props.setRoundDate(e.target.value)}
                data-ocid="admin.round.date.input"
              />
            </div>
          </div>
          <Button
            onClick={props.onSaveRound}
            disabled={props.isSavingRound}
            data-ocid="admin.round.save.primary_button"
          >
            {props.isSavingRound ? "Saving..." : "Save Round Info"}
          </Button>
        </CardContent>
      </Card>

      {/* Paynow Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5" /> Paynow Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Integration ID</Label>
              <Input
                value={props.paynowIntId}
                onChange={(e) => props.setPaynowIntId(e.target.value)}
                data-ocid="admin.paynow.id.input"
              />
            </div>
            <div>
              <Label>Integration Key</Label>
              <div className="relative">
                <Input
                  type={props.showPaynowKey ? "text" : "password"}
                  value={props.paynowKey}
                  onChange={(e) => props.setPaynowKey(e.target.value)}
                  data-ocid="admin.paynow.key.input"
                />
                <button
                  type="button"
                  onClick={() => props.setShowPaynowKey(!props.showPaynowKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {props.showPaynowKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label>Return URL</Label>
              <Input
                value={props.paynowReturn}
                onChange={(e) => props.setPaynowReturn(e.target.value)}
                placeholder="https://..."
                data-ocid="admin.paynow.return.input"
              />
            </div>
            <div>
              <Label>Result URL</Label>
              <Input
                value={props.paynowResult}
                onChange={(e) => props.setPaynowResult(e.target.value)}
                placeholder="https://..."
                data-ocid="admin.paynow.result.input"
              />
            </div>
          </div>
          <Button
            onClick={props.onSavePaynow}
            disabled={props.isSavingPaynow}
            data-ocid="admin.paynow.save.primary_button"
          >
            {props.isSavingPaynow ? "Saving..." : "Save Paynow Config"}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5" /> Change Admin Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Current Password</Label>
            <Input
              type="password"
              value={props.oldPass}
              onChange={(e) => props.setOldPass(e.target.value)}
              data-ocid="admin.changepass.old.input"
            />
          </div>
          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              value={props.newPass}
              onChange={(e) => props.setNewPass(e.target.value)}
              data-ocid="admin.changepass.new.input"
            />
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={props.confirmPass}
              onChange={(e) => props.setConfirmPass(e.target.value)}
              data-ocid="admin.changepass.confirm.input"
            />
          </div>
          <Button
            onClick={props.onChangePassword}
            disabled={props.isChangingPass}
            data-ocid="admin.changepass.save.primary_button"
          >
            {props.isChangingPass ? "Saving..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Sea-Freight Optimizer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5" /> Sea-Freight Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              checked={props.freightOptimizer}
              onCheckedChange={props.setFreightOptimizer}
              data-ocid="admin.freight.toggle"
            />
            <span className="text-sm">
              {props.freightOptimizer
                ? "Customs shield ACTIVE — optimizing routes"
                : "Customs shield inactive"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── MyOrdersView ─────────────────────────────────────────────────────────────
function MyOrdersView({
  isLoggedIn,
  onLogin,
  myOrders,
  isLoading,
  onConfirmReceived,
  confirming,
}: {
  isLoggedIn: boolean;
  onLogin: () => void;
  myOrders: ReturnType<typeof useGetMyOrders>["data"] & object[];
  isLoading: boolean;
  onConfirmReceived: (id: bigint) => void;
  confirming: boolean;
}) {
  if (!isLoggedIn) {
    return (
      <div className="text-center py-20">
        <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
        <h2 className="font-display text-2xl font-bold mb-2">My Orders</h2>
        <p className="text-muted-foreground mb-6">Log in to view your orders</p>
        <Button onClick={onLogin} data-ocid="myorders.login.primary_button">
          <LogIn className="w-4 h-4 mr-2" /> Log In
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4" data-ocid="myorders.loading_state">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!myOrders?.length) {
    return (
      <div
        className="text-center py-20 text-muted-foreground"
        data-ocid="myorders.empty_state"
      >
        <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-lg">No orders yet — go shop!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">My Orders</h2>
      {myOrders.map((order, idx) => (
        <Card
          key={String(order.id)}
          data-ocid={`myorders.item.${idx + 1}`}
          className="shadow-sm"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold">Order #{String(order.id)}</p>
                <p className="text-sm text-muted-foreground">
                  {order.destination} · {order.university}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.itemIds.length} item(s) · {order.paymentMethod}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
                {order.status === OrderStatus.delivered && (
                  <Button
                    size="sm"
                    onClick={() => onConfirmReceived(order.id)}
                    disabled={confirming}
                    data-ocid={`myorders.confirm.primary_button.${idx + 1}`}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" /> Confirm Receipt
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── AboutView ────────────────────────────────────────────────────────────────
function AboutView() {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div>
        <h2 className="font-display text-3xl font-bold mb-3">
          About Global Rail
        </h2>
        <p className="text-lg text-muted-foreground">
          <em>
            "Making those away from home feel at home without paying extra."
          </em>
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-2xl">👨‍💼</span>
            </div>
            <h3 className="font-display font-bold text-lg">Desmond Mahachi</h3>
            <p className="text-sm text-accent font-medium mb-2">
              Managing Director
            </p>
            <p className="text-sm text-muted-foreground">
              Age 21 · BTech Mechanical Engineering
              <br />
              KIIT University, India
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <span className="text-2xl">👩‍💼</span>
            </div>
            <h3 className="font-display font-bold text-lg">Moesha Fakazani</h3>
            <p className="text-sm text-accent font-medium mb-2">
              Executive Director
            </p>
            <p className="text-sm text-muted-foreground">
              Age 20 · BSc Actuarial Science
              <br />
              University of Zimbabwe
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-display font-bold text-xl">Contact Us</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">Cool Smarts Ltd</p>
              <p className="text-muted-foreground">128 City Road, London, UK</p>
              <a
                href="mailto:coolsmartszvishavane@gmail.com"
                className="text-primary hover:underline"
              >
                coolsmartszvishavane@gmail.com
              </a>
            </div>
            <div>
              <p className="font-semibold">Mahachi Desmond Pvt Ltd</p>
              <p className="text-muted-foreground">
                F19A Kandodo, Zvishavane, Zimbabwe
              </p>
              <a
                href="mailto:mdprivatelimited2024@gmail.com"
                className="text-primary hover:underline"
              >
                mdprivatelimited2024@gmail.com
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── PrivacyView ──────────────────────────────────────────────────────────────
function PrivacyView() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="font-display text-3xl font-bold">Privacy Policy</h2>
      <p className="text-sm text-muted-foreground">Last updated: March 2026</p>

      {[
        {
          title: "Information We Collect",
          body: "We collect your Internet Identity principal, delivery destination, university or hostel name, and pincode when you place an order. We do not collect payment card details directly.",
        },
        {
          title: "How We Use Your Information",
          body: "Your information is used solely to fulfil your order — including coordinating batch logistics, calculating freight, and communicating delivery status. We do not sell or share your data with third parties.",
        },
        {
          title: "International Transfers",
          body: "Orders are processed internationally across Zimbabwe, India, UK, Poland, and UAE. Data may be processed in any of these regions as part of the logistics workflow.",
        },
        {
          title: "Data Retention",
          body: "Order and profile data is stored on-chain and retained indefinitely as part of the immutable ledger. You may request account deletion by contacting us.",
        },
        {
          title: "Your Rights",
          body: "Under applicable data protection laws, you have rights to access, correct, or delete your personal data. Contact coolsmartszvishavane@gmail.com to exercise these rights.",
        },
        {
          title: "Cookies",
          body: "We use only a single local-storage flag (gr_privacy_accepted) to remember your consent. No tracking or advertising cookies are used.",
        },
        {
          title: "Contact",
          body: "For privacy enquiries: coolsmartszvishavane@gmail.com | Cool Smarts Ltd, 128 City Road, London, UK.",
        },
      ].map((section) => (
        <Card key={section.title} className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">{section.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {section.body}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
