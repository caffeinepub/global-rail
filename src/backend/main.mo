import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Nat32 "mo:core/Nat32";
import Nat64 "mo:core/Nat64";
import Int "mo:core/Int";
import Order "mo:core/Order";


import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

// Apply migration on upgrade, switch from persistent actor to normal actor

actor {
  type Product = {
    id : Nat32;
    name : Text;
    retailPrice : Nat32;
    origin : Text;
    category : Text;
  };

  module Product {
    public func compare(product1 : Product, product2 : Product) : Order.Order {
      Nat32.compare(product1.id, product2.id);
    };

    public func compareByName(product1 : Product, product2 : Product) : Order.Order {
      Text.compare(product1.name, product2.name);
    };
  };

  type PaymentMethod = {
    #cashOnDelivery;
    #online;
  };

  type OrderStatus = {
    #pendingPayment;
    #paymentConfirmed;
    #shipped;
    #delivered;
    #receivedByUser;
  };

  type OrderData = {
    id : Nat64;
    user : Principal;
    itemIds : [Nat32];
    destination : Text;
    university : Text;
    pincode : Nat32;
    paymentMethod : PaymentMethod;
    timestamp : Int;
  };

  type OrderDataWithStatus = {
    id : Nat64;
    user : Principal;
    itemIds : [Nat32];
    destination : Text;
    university : Text;
    pincode : Nat32;
    paymentMethod : PaymentMethod;
    timestamp : Int;
    status : OrderStatus;
  };

  module OrderData {
    public func compareByTimestampDesc(order1 : OrderData, order2 : OrderData) : Order.Order {
      Int.compare(order2.timestamp, order1.timestamp);
    };
  };

  type RoundInfo = {
    closingDate : Text;
    roundNumber : Nat32;
  };

  type NewOrderData = {
    itemIds : [Nat32];
    destination : Text;
    university : Text;
    pincode : Nat32;
    paymentMethod : PaymentMethod;
  };

  type PaynowConfig = {
    integrationId : Text;
    integrationKey : Text;
    returnUrl : Text;
    resultUrl : Text;
  };

  // User profile type for frontend requirements
  public type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
  };

  // Authorization state (kept for user-level operations)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Admin password stored on-chain
  var adminPassword : Text = "cs2026";

  // Persistent state
  var productIdCounter : Nat32 = 0;
  var orderIdCounter : Nat64 = 0;
  var currentRoundInfo : RoundInfo = {
    closingDate = "";
    roundNumber = 0;
  };
  var paynowConfig : PaynowConfig = {
    integrationId = "";
    integrationKey = "";
    returnUrl = "";
    resultUrl = "";
  };

  let productStore = Map.empty<Nat32, Product>();
  let orderStore = Map.empty<Nat64, OrderData>();
  let orderStatusStore = Map.empty<Nat64, OrderStatus>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  func getOrderStatus(orderId : Nat64) : OrderStatus {
    switch (orderStatusStore.get(orderId)) {
      case (?s) { s };
      case null { #pendingPayment };
    };
  };

  func withStatus(order : OrderData) : OrderDataWithStatus {
    {
      id = order.id;
      user = order.user;
      itemIds = order.itemIds;
      destination = order.destination;
      university = order.university;
      pincode = order.pincode;
      paymentMethod = order.paymentMethod;
      timestamp = order.timestamp;
      status = getOrderStatus(order.id);
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Admin password check
  public query func checkAdminPassword(password : Text) : async Bool {
    password == adminPassword;
  };

  // Change admin password
  public shared func changeAdminPassword(oldPassword : Text, newPassword : Text) : async Bool {
    if (oldPassword != adminPassword) {
      return false;
    };
    if (newPassword.size() < 4) {
      return false;
    };
    adminPassword := newPassword;
    true;
  };

  // Product management (Admin only via password)
  public shared func addProduct(adminKey : Text, name : Text, retailPrice : Nat32, origin : Text, category : Text) : async Nat32 {
    if (adminKey != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    productIdCounter += 1;
    let newProduct : Product = {
      id = productIdCounter;
      name;
      retailPrice;
      origin;
      category;
    };
    productStore.add(productIdCounter, newProduct);
    productIdCounter;
  };

  public shared func removeProduct(adminKey : Text, productId : Nat32) : async () {
    if (adminKey != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    if (not productStore.containsKey(productId)) {
      Runtime.trap("Product not found");
    };
    productStore.remove(productId);
  };

  public query func getAllProducts() : async [Product] {
    productStore.values().toArray().sort();
  };

  public query func getAllProductsByName() : async [Product] {
    productStore.values().toArray().sort(Product.compareByName);
  };

  // Order management
  public shared ({ caller }) func placeOrder(orderData : NewOrderData) : async Nat64 {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };
    if (orderData.itemIds.size() == 0) {
      Runtime.trap("Order must contain at least one item");
    };

    orderIdCounter += 1;
    let newOrder : OrderData = {
      id = orderIdCounter;
      user = caller;
      itemIds = orderData.itemIds;
      destination = orderData.destination;
      university = orderData.university;
      pincode = orderData.pincode;
      paymentMethod = orderData.paymentMethod;
      timestamp = Time.now();
    };
    orderStore.add(orderIdCounter, newOrder);
    orderStatusStore.add(orderIdCounter, #pendingPayment);
    orderIdCounter;
  };

  public query ({ caller }) func getMyOrders() : async [OrderDataWithStatus] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orderStore.values().toArray()
      .filter(func(order) { order.user == caller })
      .sort(OrderData.compareByTimestampDesc)
      .map(withStatus);
  };

  public shared func getAllOrders(adminKey : Text) : async [OrderDataWithStatus] {
    if (adminKey != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    orderStore.values().toArray()
      .sort(OrderData.compareByTimestampDesc)
      .map(withStatus);
  };

  public shared func updateOrderStatus(adminKey : Text, orderId : Nat64, status : OrderStatus) : async () {
    if (adminKey != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    if (not orderStore.containsKey(orderId)) {
      Runtime.trap("Order not found");
    };
    orderStatusStore.add(orderId, status);
  };

  public shared ({ caller }) func confirmOrderReceived(orderId : Nat64) : async () {
    switch (orderStore.get(orderId)) {
      case null { Runtime.trap("Order not found") };
      case (?order) {
        if (order.user != caller) {
          Runtime.trap("Unauthorized: Not your order");
        };
        switch (getOrderStatus(orderId)) {
          case (#delivered) {};
          case _ { Runtime.trap("Order must be in delivered status to confirm receipt") };
        };
        orderStatusStore.add(orderId, #receivedByUser);
      };
    };
  };

  public type RoundInfoArgs = {
    closingDate : Text;
    roundNumber : Nat32;
  };

  public query func getCurrentRoundInfo() : async RoundInfo {
    currentRoundInfo;
  };

  public shared func setCurrentRoundInfo(adminKey : Text, roundInfo : RoundInfoArgs) : async () {
    if (adminKey != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    currentRoundInfo := roundInfo;
  };

  public shared func setPaynowConfig(adminKey : Text, config : PaynowConfig) : async () {
    if (adminKey != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    paynowConfig := config;
  };

  public shared func getPaynowConfig(adminKey : Text) : async PaynowConfig {
    if (adminKey != adminPassword) {
      Runtime.trap("Unauthorized: Invalid admin password");
    };
    paynowConfig;
  };
};
