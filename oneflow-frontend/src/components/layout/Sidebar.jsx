import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  BarChart3,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  DollarSign,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/projects", icon: FolderKanban, label: "Projects" },
    { path: "/tasks", icon: CheckSquare, label: "Tasks" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
  ];

  const financialItems = [
    {
      path: "/financial/sales-orders",
      icon: ShoppingCart,
      label: "Sales Orders",
    },
    {
      path: "/financial/purchase-orders",
      icon: FileText,
      label: "Purchase Orders",
    },
    { path: "/financial/invoices", icon: Receipt, label: "Invoices" },
    {
      path: "/financial/vendor-bills",
      icon: CreditCard,
      label: "Vendor Bills",
    },
    { path: "/financial/expenses", icon: DollarSign, label: "Expenses" },
  ];

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <aside className="w-64 bg-white/95 backdrop-blur-md min-h-screen border-r border-gray-200 hidden md:block transition-all duration-300">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            OneFlow
          </h1>
        </div>
        
        <nav className="space-y-1 mb-8">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Main
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-gray-900 text-white font-medium shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <nav className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Financial
          </p>
          {financialItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-gray-900 text-white font-medium shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
