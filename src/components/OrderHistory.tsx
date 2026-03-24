import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Order } from '../types';
import { ShoppingBag, Package, MapPin, Phone, ArrowRight, Clock, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { generateInvoice } from '../Invoices';

interface OrderHistoryProps {
  userId: string;
  onBack: () => void;
}

export default function OrderHistory({ userId, onBack }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'confirmed': return 'تم التأكيد';
      case 'processing': return 'قيد التجهيز';
      case 'out-for-delivery': return 'خارج للتوصيل';
      case 'delivered': return 'تم التوصيل';
      default: return status;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-orange-100 text-orange-700';
      case 'out-for-delivery': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12" dir="rtl">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-brand-blue mb-8 hover:underline"
      >
        <ArrowRight className="h-5 w-5" />
        العودة للمتجر
      </button>

      <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <ShoppingBag className="text-brand-blue" />
        طلباتي السابقة
      </h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Package size={64} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 text-lg">ليس لديك أي طلبات سابقة بعد.</p>
          <button 
            onClick={onBack}
            className="btn-primary mt-6 px-8"
          >
            ابدأ التسوق الآن
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={order.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between gap-4 bg-gray-50/50">
                <div className="flex flex-wrap gap-4 items-center">
                  <span className="bg-brand-blue text-white text-xs font-bold px-3 py-1 rounded-full">
                    #{order.id.slice(-6)}
                  </span>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Clock size={14} />
                    {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                  <span className={`px-4 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <div className="text-left md:text-right flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">إجمالي الطلب</p>
                    <p className="text-xl font-bold text-brand-blue">{order.total.toLocaleString()} SDG</p>
                  </div>
                  {order.status === 'delivered' && (
                    <button 
                      onClick={() => generateInvoice(order)}
                      className="flex items-center gap-2 text-xs bg-brand-blue text-white px-3 py-1.5 rounded-lg hover:bg-brand-light-blue transition-colors"
                    >
                      <FileText size={14} />
                      تحميل الفاتورة
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider">المنتجات</h4>
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name} 
                            className="w-12 h-12 object-cover rounded-md"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-sm font-bold">{item.product.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} × {item.product.price.toLocaleString()} SDG
                              {item.selectedSize && ` | المقاس: ${item.selectedSize}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider">معلومات الشحن</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2"><MapPin size={14} /> {order.state} - {order.city} - {order.address}</p>
                      <p className="flex items-center gap-2"><Phone size={14} /> {order.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
