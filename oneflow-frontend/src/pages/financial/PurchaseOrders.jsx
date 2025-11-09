import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PurchaseOrderModal from '../../components/financial/PurchaseOrderModal';
import api from '../../utils/api';
import { formatCurrency, getStatusColor, formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus } from 'lucide-react';

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, [filterStatus, projectId]);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (projectId) params.project_id = projectId;
      if (filterStatus !== 'All') params.status = filterStatus;
      const response = await api.get('/financial/purchase-orders', { params });
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order =>
    searchTerm === '' ||
    order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/4"></div></div></div>;
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen page-transition">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Orders</h1>
          <p className="text-gray-600">Manage purchase orders</p>
        </div>
        {hasRole(['Admin', 'Sales/Finance']) && (
          <Button variant="primary" onClick={() => { setSelectedOrder(null); setShowModal(true); }}>
            <Plus size={18} className="mr-2" />Create Purchase Order
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {['All', 'Draft', 'Sent', 'Confirmed', 'Received', 'Cancelled'].map((status) => (
            <button key={status} onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filterStatus === status 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}>{status}</button>
          ))}
        </div>
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all duration-300 hover:border-gray-300" />
        </div>
      </div>

      <Card hover glass className="animate-fade-in">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200divide-slate-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.po_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.vendor_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(order.total_amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.order_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {hasRole(['Admin', 'Sales/Finance']) && (
                      <button onClick={() => { setSelectedOrder(order); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && <div className="text-center py-12"><p className="text-gray-500">No purchase orders found</p></div>}
        </div>
      </Card>

      <PurchaseOrderModal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedOrder(null); }}
        order={selectedOrder} projectId={projectId ? parseInt(projectId) : null} onSave={fetchOrders} />
    </div>
  );
};

export default PurchaseOrders;

