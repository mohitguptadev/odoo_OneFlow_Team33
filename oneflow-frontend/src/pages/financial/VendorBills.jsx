import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import VendorBillModal from '../../components/financial/VendorBillModal';
import api from '../../utils/api';
import { formatCurrency, getStatusColor, formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Check } from 'lucide-react';

const VendorBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchBills();
  }, [filterStatus, projectId]);

  const fetchBills = async () => {
    try {
      const params = {};
      if (projectId) params.project_id = projectId;
      if (filterStatus !== 'All') params.status = filterStatus;
      const response = await api.get('/financial/vendor-bills', { params });
      setBills(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vendor bills:', error);
      setLoading(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.put(`/financial/vendor-bills/${id}/mark-paid`);
      fetchBills();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredBills = bills.filter(bill =>
    searchTerm === '' ||
    bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-6"><div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/4"></div></div></div>;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen page-transition">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Bills</h1>
          <p className="text-gray-600">Track vendor bills and payments</p>
        </div>
        {hasRole(['Admin', 'Sales/Finance']) && (
          <Button variant="primary" onClick={() => { setSelectedBill(null); setShowModal(true); }}>
            <Plus size={18} className="mr-2" />Create Vendor Bill
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {['All', 'Received', 'In Payment', 'Paid', 'Cancelled'].map((status) => (
            <button key={status} onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                filterStatus === status 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow-md'
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200divide-slate-800">
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.bill_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.vendor_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(bill.total_amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(bill.status)}`}>{bill.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(bill.bill_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(bill.due_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {hasRole(['Admin', 'Sales/Finance']) && bill.status !== 'Paid' && (
                      <button onClick={() => handleMarkPaid(bill.id)} className="text-green-600 hover:text-green-800 flex items-center">
                        <Check size={16} className="mr-1" />Mark Paid
                      </button>
                    )}
                    {hasRole(['Admin', 'Sales/Finance']) && (
                      <button onClick={() => { setSelectedBill(bill); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBills.length === 0 && <div className="text-center py-12"><p className="text-gray-500">No vendor bills found</p></div>}
        </div>
      </Card>

      <VendorBillModal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedBill(null); }}
        bill={selectedBill} projectId={projectId ? parseInt(projectId) : null} onSave={fetchBills} />
    </div>
  );
};

export default VendorBills;

