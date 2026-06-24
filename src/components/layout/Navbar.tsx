// @ts-nocheck
import { useAuth } from "../../contexts/auth/useAuth.js";
import { useNotification } from "../../contexts/notification/useNotification.js";
import { useCartStore } from "../../stores/useCartStore.js";
import {
  HiOutlineBell,
  HiOutlineLogout,
  HiChevronDown,
  HiOutlineMenuAlt2,
  HiUser,
  HiOutlineCog,
  HiOutlineQuestionMarkCircle,
  HiCheckCircle,
  HiOutlineShoppingCart,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineMinus,
} from "react-icons/hi";
import { useState, useRef, useEffect } from "react";
import { formatDate } from "../../utils/dateFormat.js";
import { useNavigate } from "react-router-dom";

const getPermission = (user, permission) => {
  return user?.permission?.permissions?.includes(permission);
};

const Header = ({ onBellClick }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotification();
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef();
  const notificationRef = useRef();
  const cartRef = useRef();
  const navigate = useNavigate();

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setNotificationOpen(false);
        setShowAll(false);
      }
      if (cartRef.current && !cartRef.current.contains(e.target)) {
        setCartOpen(false);
      }
    }
    if (menuOpen || notificationOpen || cartOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, notificationOpen, cartOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("[Navbar] logout failed", err);
    }
  };

  // Notification click handler with navigation
  const handleNotificationClick = async (n) => {
    await markAsRead(n._id);

    // Redirect based on notification type
    if (n.type === "register_request") {
      navigate("/users");
    } else if (n.type === "new_order_request") {
      if (getPermission(user, "view_approve_request")) {
        navigate("/approve-requests");
      } else {
        navigate("/order-requests");
      }
    } else if (n.type === "pending_delivery") {
      if (getPermission(user, "view_confirm_delivery")) {
        navigate("/confirm-delivery");
      } else {
        navigate("/order-requests");
      }
    } else if (
      [
        "order_approved",
        "order_rejected",
        "order_completed",
        "order_on_hold",
        "order_cancelled",
        "order_delivered",
      ].includes(n.type)
    ) {
      navigate("/order-requests");
    } else if (
      n.entity_type === "Order Request" ||
      n.entity_type === "OrderRequest"
    ) {
      navigate("/order-requests");
    }
  };

  return (
    <header className="bg-[#1e3a5f] flex items-center justify-between px-4 py-3 z-30 relative">
      <HiOutlineMenuAlt2
        onClick={onBellClick}
        className="text-white hover:text-gray-400 text-xl cursor-pointer transition"
      />
      <div className="flex items-center gap-3">
        {/* Cart Icon */}
        <div className="relative" ref={cartRef}>
          <button
            tabIndex={0}
            className="relative mt-2 focus:outline-none hover:text-gray-500 transition hover:cursor-pointer"
            onClick={() => setCartOpen((v) => !v)}
            title="Cart"
          >
            <HiOutlineShoppingCart className="text-white hover:text-gray-400 text-xl" />
            {cartCount > 0 && (
              <span className="absolute -top-4 left-2 bg-red-500 text-white text-sm rounded-full w-auto h-auto flex items-center justify-center px-2">
                {cartCount}
              </span>
            )}
          </button>
          {cartOpen && (
            <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-lg p-3 w-96 z-50 animate-fade-in-up border border-gray-100">
              <div className="flex items-center justify-between px-1 pt-1 mb-2">
                <span className="font-bold text-sm">
                  Cart ({cartCount} items)
                </span>
                {cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <hr className="my-2 border-gray-100" />
              {cartItems.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-6">
                  Cart is empty
                </div>
              ) : (
                <>
                  <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {cartItems.map((item) => (
                      <li
                        key={item.product._id}
                        className="flex items-center gap-3 py-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            ${Number(item.product.price).toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product._id,
                                item.quantity - 1,
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                          >
                            <HiOutlineMinus className="text-xs" />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product._id,
                                item.quantity + 1,
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                          >
                            <HiOutlinePlus className="text-xs" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product._id)}
                          className="p-1 rounded hover:bg-red-50 cursor-pointer text-red-400 hover:text-red-600"
                        >
                          <HiOutlineTrash className="text-base" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setCartOpen(false);
                        navigate("/order-requests");
                      }}
                      className="w-full bg-[#1e3a5f] hover:bg-[#16375b] text-white text-sm font-medium py-2.5 rounded-xl cursor-pointer transition"
                    >
                      Place Order Request
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="relative" ref={notificationRef}>
          <button
            tabIndex={0}
            className="relative mt-2 focus:outline-none hover:text-gray-900 transition hover:cursor-pointer"
            onClick={() => setNotificationOpen((v) => !v)}
          >
            <HiOutlineBell className="text-white hover:text-gray-400 text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-4 left-2 bg-red-500 text-white text-sm rounded-full w-auto h-auto flex items-center justify-center px-2">
                {unreadCount}
              </span>
            )}
          </button>
          {notificationOpen && (
            <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-lg p-2 w-120 z-50 animate-fade-in-up border border-gray-100">
              <div className="px-2 pt-2 flex items-center justify-between">
                <div className="font-bold text-sm leading-tight">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs font-semibold bg-red-100 text-red-500 px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="flex items-center gap-1 text-xs text-[#64748b] hover:text-gray-900 font-medium transition cursor-pointer"
                    title="Mark all as read"
                  >
                    <HiCheckCircle className="text-base" />
                    Mark all as read
                  </button>
                )}
              </div>
              <hr className="my-2 border-gray-100" />
              {notifications.length === 0 ? (
                <div className="w-full p-4 text-[#64748b] text-center text-sm rounded-xl">
                  No new notifications
                </div>
              ) : (
                <>
                  <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {(showAll ? notifications : notifications.slice(0, 5)).map(
                      (n) => (
                        <li
                          key={n._id}
                          className="flex items-start justify-between gap-3 px-2 py-3 bg-[#f1f5f9] transition cursor-pointer hover:bg-[#e2e8f0] rounded-xl"
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 leading-snug">
                              {n.message}
                            </p>
                          </div>
                          <div className="text-xs text-gray-400 text-right whitespace-nowrap min-w-28 pt-0.5">
                            {formatDate(n.createdAt, true)}
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                  {notifications.length > 5 && (
                    <div className="mt-1 pt-1 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAll((v) => !v);
                        }}
                        className="w-full text-center text-sm text-[#64748b] hover:text-gray-900 font-medium py-2 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                      >
                        {showAll
                          ? "Show less"
                          : `View ${notifications.length - 5} more`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          <button
            tabIndex={0}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 p-1 rounded-full transition focus:outline-none cursor-pointer hover:bg-gray-400"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm overflow-hidden">
              {user?.profile && user.profile !== "" && !imageError ? (
                <img
                  src={user.profile}
                  alt={user.name || user.email || "User"}
                  className="w-8 h-8 object-cover rounded-full"
                  onError={() => setImageError(true)}
                />
              ) : imageError ? (
                <img
                  src="/default-profile.png"
                  alt="Default Profile"
                  className="w-8 h-8 object-cover rounded-full"
                />
              ) : (
                <HiUser className="text-white text-xl" />
              )}
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-white text-sm leading-tight">
                {user?.first_name + " " + user?.last_name || "User"}
              </span>
            </div>
            <HiChevronDown className="text-white text-xl ml-1" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-13 bg-white rounded-2xl shadow-lg p-2 w-60 z-50 animate-fade-in-up border border-gray-100">
              <div className="px-3 pt-3">
                <div className="text-sm leading-tight">
                  {user?.first_name + " " + user?.last_name}
                  <span className="ml-2 capitalize">({user?.role})</span>
                </div>
                <div className="text-gray-500 text-sm mb-1">{user?.email}</div>
              </div>
              <hr className="my-2 border-gray-100" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings?tab=profile");
                }}
                className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl cursor-pointer"
              >
                <HiUser className="text-xl" />
                <span>Profile Settings</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings?tab=account");
                }}
                className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl cursor-pointer"
              >
                <HiOutlineCog className="text-xl" />
                <span>Account Settings</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings?tab=help");
                }}
                className="w-full flex items-center px-2 py-3 text-[#64748b] hover:text-gray-900 hover:bg-[#f1f5f9] transition text-sm space-x-2 rounded-xl cursor-pointer"
              >
                <HiOutlineQuestionMarkCircle className="text-xl" />
                <span>Help & Support</span>
              </button>
              <hr className="my-2 border-gray-100" />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                className="w-full flex items-center px-2 py-3 text-red-500 hover:bg-red-50 transition text-sm space-x-2 rounded-xl cursor-pointer"
              >
                <HiOutlineLogout className="text-red-500 text-xl" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
