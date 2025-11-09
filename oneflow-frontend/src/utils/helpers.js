// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
};

// Format date
export const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format datetime
export const formatDateTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    Planned: "bg-gray-100 text-gray-800",
    "In Progress": "bg-blue-100 text-blue-800",
    Completed: "bg-green-100 text-green-800",
    "On Hold": "bg-yellow-100 text-yellow-800",
    New: "bg-gray-100 text-gray-800",
    Blocked: "bg-red-100 text-red-800",
    Done: "bg-green-100 text-green-800",
    Draft: "bg-gray-100 text-gray-800",
    Sent: "bg-blue-100 text-blue-800",
    Paid: "bg-green-100 text-green-800",
    Overdue: "bg-red-100 text-red-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Approved: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

// Get priority color
export const getPriorityColor = (priority) => {
  const colors = {
    Low: "bg-green-100 text-green-800",
    Medium: "bg-yellow-100 text-yellow-800",
    High: "bg-orange-100 text-orange-800",
    Urgent: "bg-red-100 text-red-800",
  };
  return colors[priority] || "bg-gray-100 text-gray-800";
};

// Calculate progress percentage
export const calculateProgress = (completed, total) => {
  if (!total || total === 0) return 0;
  return Math.round((completed / total) * 100);
};
