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

  module OrderData {
    public func compare(order1 : OrderData, order2 : OrderData) : Order.Order {
      Nat64.compare(order1.id, order2.id);
    };

    public func compareByTimestamp(order1 : OrderData, order2 : OrderData) : Order.Order {
      Int.compare(order1.timestamp, order2.timestamp);
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

  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Persistent state
  var productIdCounter : Nat32 = 0;
  var orderIdCounter : Nat64 = 0;
  var currentRoundInfo : RoundInfo = {
    closingDate = "";
    roundNumber = 0;
  };

  let productStore = Map.empty<Nat32, Product>();
  let orderStore = Map.empty<Nat64, OrderData>();

  // Product management (Admin only)
  public shared ({ caller }) func addProduct(name : Text, retailPrice : Nat32, origin : Text, category : Text) : async Nat32 {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin access required");
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

  public shared ({ caller }) func removeProduct(productId : Nat32) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin access required");
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
    orderIdCounter;
  };

  public query ({ caller }) func getMyOrders() : async [OrderData] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orderStore.values().toArray().filter(
      func(order) { order.user == caller }
    );
  };

  public shared ({ caller }) func getAllOrders() : async [OrderData] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    orderStore.values().toArray().sort();
  };

  public query ({ caller }) func getAllOrdersByTimestamp() : async [OrderData] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    orderStore.values().toArray().sort(OrderData.compareByTimestamp);
  };

  // Round info management
  public type RoundInfoArgs = {
    closingDate : Text;
    roundNumber : Nat32;
  };

  public query func getCurrentRoundInfo() : async RoundInfo {
    currentRoundInfo;
  };

  public shared ({ caller }) func setCurrentRoundInfo(roundInfo : RoundInfoArgs) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    currentRoundInfo := roundInfo;
  };
};
