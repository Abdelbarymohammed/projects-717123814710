import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Package, 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  ArrowRight,
  Upload,
  Search,
  Phone,
  MapPin,
  Image as ImageIcon,
  Tag,
  Eye,
  FileText,
  Globe,
  Palette,
  Truck,
  Lock,
  Maximize2,
  MessageSquare,
  CheckCircle,
  XCircle,
  Star,
  ShieldCheck
} from 'lucide-react';
import { Product, Order, Category, SliderImage, SiteConfig, Review, Reply } from '../types';
import { db, handleFirestoreError, OperationType, storage } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  addDoc,
  query,
  orderBy,
  getDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { generateInvoice } from '../Invoices';
import { cn } from '../lib/utils';

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'stats' | 'categories' | 'slider' | 'design' | 'shipping' | 'reviews'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isZoomedImage, setIsZoomedImage] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: 'أزياء',
    subCategory: '',
    imageUrl: '',
    stock: 10,
    rating: 5,
    sizes: ['M', 'L', 'XL'],
    colors: ['Black', 'White', 'Blue'],
    metaTitle: '',
    metaDescription: '',
    badge: 'none'
  });

  const [newCategory, setNewCategory] = useState({ name: '', subCategories: [] as string[] });
  const [newSlider, setNewSlider] = useState<Partial<SliderImage>>({ 
    imageUrl: '', 
    title: '', 
    subtitle: '',
    buttonText: 'تسوق الآن',
    buttonLink: '', 
    order: 0,
    badge: 'none'
  });

  useEffect(() => {
    const productsUnsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'products')
    );

    const ordersUnsubscribe = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'orders')
    );

    const categoriesUnsubscribe = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      }
    );

    const sliderUnsubscribe = onSnapshot(
      query(collection(db, 'sliderImages'), orderBy('order', 'asc')),
      (snapshot) => {
        setSliderImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SliderImage)));
      }
    );

    const configUnsubscribe = onSnapshot(doc(db, 'config', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSiteConfig(snapshot.data() as SiteConfig);
      }
    });

    const reviewsUnsubscribe = onSnapshot(
      collection(db, 'reviews'),
      (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'reviews')
    );

    return () => {
      productsUnsubscribe();
      ordersUnsubscribe();
      categoriesUnsubscribe();
      sliderUnsubscribe();
      configUnsubscribe();
      reviewsUnsubscribe();
    };
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'WassalAdmin2024') {
      setIsAdminAuthenticated(true);
      toast.success('تم تسجيل الدخول بنجاح');
    } else {
      toast.error('كلمة المرور غير صحيحة');
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-blue flex items-center justify-center p-4" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center"
        >
          <div className="bg-brand-gray w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-blue">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">دخول المسؤول</h2>
          <p className="text-gray-500 mb-8 text-sm">يرجى إدخال كلمة المرور للوصول إلى لوحة التحكم</p>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="كلمة المرور"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand-blue transition-all"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
            />
            <button type="submit" className="w-full btn-primary py-3 rounded-xl">
              تسجيل الدخول
            </button>
            <button 
              type="button"
              onClick={onBack}
              className="w-full text-gray-400 text-sm hover:text-brand-blue transition-colors"
            >
              العودة للمتجر
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...newProduct,
        id: '' // Will be updated
      });
      await updateDoc(docRef, { id: docRef.id });
      toast.success('تمت إضافة المنتج بنجاح');
      setIsAddingProduct(false);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        category: 'أزياء',
        subCategory: '',
        imageUrl: '',
        stock: 10,
        rating: 5,
        sizes: ['M', 'L', 'XL'],
        colors: ['Black', 'White', 'Blue'],
        metaTitle: '',
        metaDescription: '',
        badge: 'none'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const handleUpdateSiteConfig = async (newConfig: SiteConfig) => {
    try {
      await setDoc(doc(db, 'config', 'site'), newConfig);
      toast.success('تم تحديث إعدادات الموقع');
    } catch (error) {
      toast.error('فشل تحديث الإعدادات');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await updateDoc(doc(db, 'products', editingProduct.id), { ...editingProduct });
      toast.success('تم تحديث المنتج بنجاح');
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${editingProduct.id}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('تم حذف المنتج بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast.success('تم تحديث حالة الطلب');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'categories'), { ...newCategory });
      await updateDoc(docRef, { id: docRef.id });
      setNewCategory({ name: '', subCategories: [] });
      toast.success('تمت إضافة الفئة');
    } catch (error) {
      toast.error('فشل إضافة الفئة');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('تم حذف الفئة');
    } catch (error) {
      toast.error('فشل حذف الفئة');
    }
  };

  const handleAddSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'sliderImages'), { ...newSlider });
      await updateDoc(docRef, { id: docRef.id });
      setNewSlider({
        imageUrl: '',
        title: '',
        subtitle: '',
        buttonText: 'تسوق الآن',
        buttonLink: '#',
        order: 0,
        badge: 'none'
      });
      toast.success('تمت إضافة صورة السلايدر');
    } catch (error) {
      toast.error('فشل إضافة الصورة');
    }
  };

  const handleDeleteSlider = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'sliderImages', id));
      toast.success('تم حذف الصورة');
    } catch (error) {
      toast.error('فشل حذف الصورة');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Admin Header */}
      <header className="bg-brand-blue text-white py-6 px-8 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <LayoutDashboard className="h-8 w-8" />
          <h1 className="text-2xl font-bold">لوحة تحكم واصل ستور</h1>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-all"
        >
          <ArrowRight className="h-5 w-5" />
          العودة للمتجر
        </button>
      </header>

      <div className="flex-grow flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-l border-gray-200 p-6 space-y-4">
          <button 
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'stats' ? 'bg-brand-blue text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <LayoutDashboard size={20} />
            الإحصائيات
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'products' ? 'bg-brand-blue text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Package size={20} />
            المنتجات
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'categories' ? 'bg-brand-blue text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Tag size={20} />
            الفئات
          </button>
          <button 
            onClick={() => setActiveTab('slider')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'slider' ? 'bg-brand-blue text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <ImageIcon size={20} />
            السلايدر
          </button>
          <button 
            onClick={() => setActiveTab('design')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'design' ? 'bg-brand-blue text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Palette size={20} />
            تصميم الموقع
          </button>
          <button 
            onClick={() => setActiveTab('shipping')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'shipping' ? 'bg-brand-blue text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Truck size={20} />
            أسعار الشحن
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'orders' ? 'bg-brand-blue text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <ShoppingBag size={20} />
            الطلبات
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'reviews' ? 'bg-brand-blue text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <MessageSquare size={20} />
            المراجعات
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow p-8 overflow-y-auto">
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
                <div className="bg-blue-100 p-4 rounded-full text-brand-blue">
                  <Package size={32} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">إجمالي المنتجات</p>
                  <h3 className="text-3xl font-bold">{products.length}</h3>
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
                <div className="bg-green-100 p-4 rounded-full text-green-600">
                  <ShoppingBag size={32} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">إجمالي الطلبات</p>
                  <h3 className="text-3xl font-bold">{orders.length}</h3>
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
                <div className="bg-purple-100 p-4 rounded-full text-purple-600">
                  <Users size={32} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">إجمالي المبيعات</p>
                  <h3 className="text-3xl font-bold">{orders.reduce((acc, o) => acc + o.total, 0).toLocaleString()} SDG</h3>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'design' && siteConfig && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Palette className="text-brand-blue" /> تخصيص التصميم</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700">اللون الأساسي</label>
                    <div className="flex gap-4 items-center">
                      <input 
                        type="color" 
                        className="h-12 w-24 rounded-lg cursor-pointer"
                        value={siteConfig.primaryColor}
                        onChange={e => setSiteConfig({...siteConfig, primaryColor: e.target.value})}
                      />
                      <span className="font-mono text-sm">{siteConfig.primaryColor}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700">اللون الثانوي</label>
                    <div className="flex gap-4 items-center">
                      <input 
                        type="color" 
                        className="h-12 w-24 rounded-lg cursor-pointer"
                        value={siteConfig.secondaryColor}
                        onChange={e => setSiteConfig({...siteConfig, secondaryColor: e.target.value})}
                      />
                      <span className="font-mono text-sm">{siteConfig.secondaryColor}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700">الخط المستخدم</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                      value={siteConfig.fontFamily}
                      onChange={e => setSiteConfig({...siteConfig, fontFamily: e.target.value as any})}
                    >
                      <option value="Cairo">Cairo (عصري)</option>
                      <option value="Almarai">Almarai (كلاسيكي)</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700">عدد الأعمدة في الجوال</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                      value={siteConfig.mobileGridColumns}
                      onChange={e => setSiteConfig({...siteConfig, mobileGridColumns: Number(e.target.value) as any})}
                    >
                      <option value={2}>عمودين (2)</option>
                      <option value={3}>ثلاثة أعمدة (3)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Globe className="text-brand-blue" /> شريط الإعلانات العلوي</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <input 
                      type="checkbox" 
                      id="announcement-enabled"
                      className="w-5 h-5 rounded text-brand-blue focus:ring-brand-blue"
                      checked={siteConfig.announcementBar.enabled}
                      onChange={e => setSiteConfig({
                        ...siteConfig, 
                        announcementBar: { ...siteConfig.announcementBar, enabled: e.target.checked }
                      })}
                    />
                    <label htmlFor="announcement-enabled" className="text-sm font-bold text-gray-700">تفعيل شريط الإعلانات</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">نص الإعلان</label>
                      <input 
                        type="text" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                        value={siteConfig.announcementBar.text}
                        onChange={e => setSiteConfig({
                          ...siteConfig, 
                          announcementBar: { ...siteConfig.announcementBar, text: e.target.value }
                        })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">لون الخلفية</label>
                        <input 
                          type="color" 
                          className="w-full h-10 rounded-lg cursor-pointer"
                          value={siteConfig.announcementBar.backgroundColor}
                          onChange={e => setSiteConfig({
                            ...siteConfig, 
                            announcementBar: { ...siteConfig.announcementBar, backgroundColor: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">لون النص</label>
                        <input 
                          type="color" 
                          className="w-full h-10 rounded-lg cursor-pointer"
                          value={siteConfig.announcementBar.textColor}
                          onChange={e => setSiteConfig({
                            ...siteConfig, 
                            announcementBar: { ...siteConfig.announcementBar, textColor: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => handleUpdateSiteConfig(siteConfig)}
                  className="btn-primary px-12 py-3 rounded-xl shadow-lg flex items-center gap-2"
                >
                  <Save size={20} />
                  حفظ ونشر التغييرات
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && siteConfig && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Truck className="text-brand-blue" /> إدارة أسعار الشحن</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">الخرطوم (SDG)</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                      value={siteConfig.shippingPrices.khartoum}
                      onChange={e => setSiteConfig({
                        ...siteConfig, 
                        shippingPrices: { ...siteConfig.shippingPrices, khartoum: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">أم درمان (SDG)</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                      value={siteConfig.shippingPrices.omdurman}
                      onChange={e => setSiteConfig({
                        ...siteConfig, 
                        shippingPrices: { ...siteConfig.shippingPrices, omdurman: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">بحري (SDG)</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                      value={siteConfig.shippingPrices.bahri}
                      onChange={e => setSiteConfig({
                        ...siteConfig, 
                        shippingPrices: { ...siteConfig.shippingPrices, bahri: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">الولايات الأخرى (SDG)</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                      value={siteConfig.shippingPrices.states}
                      onChange={e => setSiteConfig({
                        ...siteConfig, 
                        shippingPrices: { ...siteConfig.shippingPrices, states: Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => handleUpdateSiteConfig(siteConfig)}
                    className="btn-primary px-12 py-3 rounded-xl shadow-lg flex items-center gap-2"
                  >
                    <Save size={20} />
                    حفظ الأسعار
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="relative w-64">
                  <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="ابحث عن منتج..."
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-10 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setIsAddingProduct(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={20} />
                  إضافة منتج جديد
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 text-gray-600 text-sm">
                    <tr>
                      <th className="px-6 py-4">المنتج</th>
                      <th className="px-6 py-4">الفئة</th>
                      <th className="px-6 py-4">السعر</th>
                      <th className="px-6 py-4">المخزون</th>
                      <th className="px-6 py-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg" referrerPolicy="no-referrer" />
                            <span className="font-bold">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{product.category}</td>
                        <td className="px-6 py-4 font-bold text-brand-light-blue">{product.price.toLocaleString()} SDG</td>
                        <td className="px-6 py-4">{product.stock}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => setEditingProduct(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-6">
              <form onSubmit={handleAddCategory} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex gap-4">
                <input 
                  required
                  type="text" 
                  placeholder="اسم الفئة الجديدة"
                  className="flex-grow bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                  value={newCategory.name}
                  onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                />
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Plus size={20} />
                  إضافة فئة
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                    <span className="font-bold">{cat.name}</span>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'slider' && (
            <div className="space-y-6">
              <form onSubmit={handleAddSlider} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">رابط الصورة</label>
                  <input 
                    required
                    type="url" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={newSlider.imageUrl}
                    onChange={e => setNewSlider({ ...newSlider, imageUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">العنوان الرئيسي</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={newSlider.title}
                    onChange={e => setNewSlider({ ...newSlider, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">العنوان الفرعي</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={newSlider.subtitle}
                    onChange={e => setNewSlider({ ...newSlider, subtitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">نص الزر</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={newSlider.buttonText}
                    onChange={e => setNewSlider({ ...newSlider, buttonText: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">رابط الزر</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={newSlider.buttonLink}
                    onChange={e => setNewSlider({ ...newSlider, buttonLink: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">الترتيب</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                      value={newSlider.order}
                      onChange={e => setNewSlider({ ...newSlider, order: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">شارة (Badge)</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                      value={newSlider.badge}
                      onChange={e => setNewSlider({ ...newSlider, badge: e.target.value as any })}
                    >
                      <option value="none">بدون</option>
                      <option value="sale">تخفيضات</option>
                      <option value="new">وصل حديثاً</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="md:col-span-2 btn-primary flex items-center justify-center gap-2 py-3">
                  <Plus size={20} />
                  إضافة للسلايدر
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sliderImages.map(img => (
                  <div key={img.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative h-48">
                      <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                      {img.badge && img.badge !== 'none' && (
                        <span className="absolute top-2 right-2 bg-brand-light-blue text-white text-[10px] font-bold px-2 py-1 rounded">
                          {img.badge === 'sale' ? 'تخفيضات' : 'جديد'}
                        </span>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold">{img.title || 'بدون عنوان'}</h4>
                          <p className="text-xs text-gray-500">{img.subtitle}</p>
                        </div>
                        <button onClick={() => handleDeleteSlider(img.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t text-[10px] text-gray-400">
                        <span>الترتيب: {img.order}</span>
                        <span>الزر: {img.buttonText}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">الطلبات الواردة</h2>
              <div className="grid grid-cols-1 gap-6">
                {orders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-brand-blue text-xs font-bold px-3 py-1 rounded-full">#{order.id.slice(-6)}</span>
                        <span className="text-gray-400 text-xs">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                      <h4 className="font-bold text-lg">{order.customerName}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-2"><Phone size={14} /> {order.phone}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-2"><MapPin size={14} /> {order.state} - {order.city} - {order.address}</p>
                      <div className="flex gap-2 mt-4">
                        <button 
                          onClick={() => setViewingOrder(order)}
                          className="flex items-center gap-2 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye size={14} />
                          عرض التفاصيل
                        </button>
                        <button 
                          onClick={() => generateInvoice(order)}
                          className="flex items-center gap-2 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <FileText size={14} />
                          تحميل الفاتورة
                        </button>
                      </div>
                    </div>
                      <div className="flex flex-col justify-between items-end">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">إجمالي الطلب</p>
                          <h3 className="text-2xl font-bold text-brand-blue">{order.total.toLocaleString()} SDG</h3>
                        </div>
                        <div className="flex flex-col gap-2 mt-4 items-end">
                          <select 
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                            className={`px-4 py-1 rounded-full text-xs font-bold border-none outline-none cursor-pointer ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'processing' ? 'bg-orange-100 text-orange-700' :
                              order.status === 'out-for-delivery' ? 'bg-purple-100 text-purple-700' :
                              'bg-green-100 text-green-700'
                            }`}
                          >
                            <option value="pending">قيد الانتظار</option>
                            <option value="confirmed">تم التأكيد</option>
                            <option value="processing">قيد التجهيز</option>
                            <option value="out-for-delivery">خارج للتوصيل</option>
                            <option value="delivered">تم التوصيل</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-blue/10 rounded-xl text-brand-blue">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">إدارة المراجعات</h2>
                    <p className="text-sm text-gray-500 font-bold">الموافقة على مراجعات العملاء والرد عليها</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-xl text-xs font-bold border border-yellow-100">
                    قيد الانتظار: {reviews.filter(r => r.status === 'pending').length}
                  </div>
                  <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-xs font-bold border border-green-100">
                    تمت الموافقة: {reviews.filter(r => r.status === 'approved').length}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {reviews.length > 0 ? (
                  [...reviews].sort((a, b) => a.status === 'pending' ? -1 : 1).map((review) => (
                    <div key={review.id} className={cn(
                      "bg-white p-6 rounded-2xl shadow-sm border transition-all",
                      review.status === 'pending' ? "border-yellow-200 bg-yellow-50/30" : "border-gray-100"
                    )}>
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-grow space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center overflow-hidden">
                                {review.userPhoto ? <img src={review.userPhoto} className="w-full h-full object-cover" /> : <Users size={20} />}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm">{review.userName}</h4>
                                <div className="flex text-yellow-400">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={i < review.rating ? "fill-current" : "text-gray-300"} size={12} />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-400">{new Date(review.date).toLocaleString('ar-EG')}</span>
                          </div>

                          <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                          </div>

                          {review.photoUrls && review.photoUrls.length > 0 && (
                            <div className="flex gap-2">
                              {review.photoUrls.map((url, idx) => (
                                <img 
                                  key={idx} 
                                  src={url} 
                                  className="w-20 h-20 object-cover rounded-lg border cursor-zoom-in" 
                                  onClick={() => setIsZoomedImage(url)}
                                />
                              ))}
                            </div>
                          )}

                          {/* Admin Reply Section */}
                          <div className="space-y-3 pt-4 border-t border-gray-100">
                            <h5 className="text-xs font-bold text-gray-500">الردود ({review.replies?.length || 0})</h5>
                            {review.replies?.map((reply) => (
                              <div key={reply.id} className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                                <div className="flex-grow">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold flex items-center gap-1">
                                      {reply.userName}
                                      {reply.isAdmin && <ShieldCheck size={10} className="text-brand-blue" />}
                                    </span>
                                    <span className="text-[8px] text-gray-400">{new Date(reply.date).toLocaleDateString('ar-EG')}</span>
                                  </div>
                                  <p className="text-[10px] text-gray-600">{reply.comment}</p>
                                </div>
                                <button 
                                  onClick={async () => {
                                    const updatedReplies = review.replies.filter(r => r.id !== reply.id);
                                    await updateDoc(doc(db, 'reviews', review.id), { replies: updatedReplies });
                                    toast.success('تم حذف الرد');
                                  }}
                                  className="text-red-400 hover:text-red-600 p-1"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                            
                            <div className="flex gap-2 mt-2">
                              <input 
                                type="text"
                                placeholder="اكتب رداً كمسؤول..."
                                className="flex-grow bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand-blue"
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    const text = e.currentTarget.value;
                                    e.currentTarget.value = '';
                                    const newReply: Reply = {
                                      id: Math.random().toString(36).substr(2, 9),
                                      userId: 'admin',
                                      userName: 'متجر وصّل',
                                      userPhoto: '',
                                      comment: text,
                                      date: new Date().toISOString(),
                                      isAdmin: true
                                    };
                                    await updateDoc(doc(db, 'reviews', review.id), {
                                      replies: arrayUnion(newReply)
                                    });
                                    toast.success('تم إضافة رد المسؤول');
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 min-w-[120px]">
                          {review.status === 'pending' ? (
                            <button 
                              onClick={() => updateDoc(doc(db, 'reviews', review.id), { status: 'approved' })}
                              className="flex-grow flex items-center justify-center gap-2 bg-green-500 text-white py-2 px-4 rounded-xl text-xs font-bold hover:bg-green-600 transition-colors"
                            >
                              <CheckCircle size={14} /> موافقة
                            </button>
                          ) : (
                            <button 
                              onClick={() => updateDoc(doc(db, 'reviews', review.id), { status: 'pending' })}
                              className="flex-grow flex items-center justify-center gap-2 bg-yellow-500 text-white py-2 px-4 rounded-xl text-xs font-bold hover:bg-yellow-600 transition-colors"
                            >
                              <Eye size={14} /> إخفاء
                            </button>
                          )}
                          <button 
                            onClick={() => deleteDoc(doc(db, 'reviews', review.id))}
                            className="flex-grow flex items-center justify-center gap-2 bg-red-50 text-red-500 py-2 px-4 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={14} /> حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-20 rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                      <MessageSquare size={40} />
                    </div>
                    <p className="text-gray-400 font-bold">لا توجد مراجعات حالياً</p>
                  </div>
                )}
              </div>
            </div>
          )}
          </main>
        </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-brand-blue text-white p-6 flex justify-between items-center">
                <h3 className="text-xl font-bold">تفاصيل الطلب #{viewingOrder.id.slice(-6)}</h3>
                <button onClick={() => setViewingOrder(null)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold border-b pb-2">معلومات العميل</h4>
                    <p className="text-sm"><span className="opacity-60">الاسم:</span> {viewingOrder.customerName}</p>
                    <p className="text-sm"><span className="opacity-60">الهاتف:</span> {viewingOrder.phone}</p>
                    <p className="text-sm"><span className="opacity-60">العنوان:</span> {viewingOrder.address}, {viewingOrder.city || ''}, {viewingOrder.state}</p>
                    <p className="text-sm"><span className="opacity-60">طريقة الدفع:</span> {viewingOrder.paymentMethod.toUpperCase()}</p>
                    {viewingOrder.notes && <p className="text-sm"><span className="opacity-60">ملاحظات:</span> {viewingOrder.notes}</p>}
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold border-b pb-2 text-brand-blue">إثبات الدفع</h4>
                    <div className="border rounded-xl overflow-hidden relative group">
                      <img 
                        src={viewingOrder.paymentScreenshotUrl} 
                        alt="Payment Proof" 
                        className="w-full h-48 object-contain bg-gray-50 cursor-zoom-in"
                        onClick={() => setIsZoomedImage(viewingOrder.paymentScreenshotUrl)}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Maximize2 className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold border-b pb-2">المنتجات</h4>
                  <div className="space-y-3">
                    {viewingOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                        <div className="flex gap-4 items-center">
                          <img src={item.product.imageUrl} className="w-12 h-12 object-cover rounded-lg" />
                          <div>
                            <p className="font-bold text-sm">{item.product.name}</p>
                            <p className="text-xs text-gray-500">الكمية: {item.quantity} | المقاس: {item.selectedSize || '-'} | اللون: {item.selectedColor || '-'}</p>
                          </div>
                        </div>
                        <p className="font-bold text-brand-blue">{(item.product.price * item.quantity).toLocaleString()} SDG</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right space-y-1">
                    <p className="text-sm opacity-60">المجموع الفرعي: {viewingOrder.subtotal.toLocaleString()} SDG</p>
                    <p className="text-sm opacity-60">الشحن: {viewingOrder.shippingCost.toLocaleString()} SDG</p>
                    <p className="text-xl font-bold text-brand-blue">الإجمالي: {viewingOrder.total.toLocaleString()} SDG</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {(isAddingProduct || editingProduct) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-brand-blue text-white p-6 flex justify-between items-center">
                <h3 className="text-xl font-bold">{isAddingProduct ? 'إضافة منتج جديد' : 'تعديل المنتج'}</h3>
                <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <form 
                onSubmit={isAddingProduct ? handleAddProduct : handleUpdateProduct}
                className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">اسم المنتج</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={isAddingProduct ? newProduct.name : editingProduct?.name}
                    onChange={e => isAddingProduct ? setNewProduct({...newProduct, name: e.target.value}) : setEditingProduct({...editingProduct!, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">الفئة</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={isAddingProduct ? newProduct.category : editingProduct?.category}
                    onChange={e => isAddingProduct ? setNewProduct({...newProduct, category: e.target.value}) : setEditingProduct({...editingProduct!, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    {categories.length === 0 && (
                      <>
                        <option value="أزياء">أزياء</option>
                        <option value="إلكترونيات">إلكترونيات</option>
                        <option value="منزل وديكور">منزل وديكور</option>
                        <option value="جمال وعناية">جمال وعناية</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">الفئة الفرعية</label>
                  <input 
                    type="text" 
                    placeholder="مثال: رجالي، نسائي، هواتف..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={isAddingProduct ? newProduct.subCategory : editingProduct?.subCategory}
                    onChange={e => isAddingProduct ? setNewProduct({...newProduct, subCategory: e.target.value}) : setEditingProduct({...editingProduct!, subCategory: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">شارة المنتج (Badge)</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={isAddingProduct ? newProduct.badge : editingProduct?.badge}
                    onChange={e => isAddingProduct ? setNewProduct({...newProduct, badge: e.target.value as any}) : setEditingProduct({...editingProduct!, badge: e.target.value as any})}
                  >
                    <option value="none">بدون</option>
                    <option value="sale">تخفيض</option>
                    <option value="new">جديد</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">السعر (SDG)</label>
                  <input 
                    required
                    type="number" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={isAddingProduct ? newProduct.price : editingProduct?.price}
                    onChange={e => isAddingProduct ? setNewProduct({...newProduct, price: Number(e.target.value)}) : setEditingProduct({...editingProduct!, price: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">المخزون</label>
                  <input 
                    required
                    type="number" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={isAddingProduct ? newProduct.stock : editingProduct?.stock}
                    onChange={e => isAddingProduct ? setNewProduct({...newProduct, stock: Number(e.target.value)}) : setEditingProduct({...editingProduct!, stock: Number(e.target.value)})}
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-gray-700">المقاسات (مفصولة بفاصلة)</label>
                  <input 
                    type="text" 
                    placeholder="S, M, L, XL"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={isAddingProduct ? newProduct.sizes?.join(', ') : editingProduct?.sizes?.join(', ')}
                    onChange={e => {
                      const sizes = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                      isAddingProduct ? setNewProduct({...newProduct, sizes}) : setEditingProduct({...editingProduct!, sizes});
                    }}
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-gray-700">الألوان (مفصولة بفاصلة)</label>
                  <input 
                    type="text" 
                    placeholder="Red, Blue, Black"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={isAddingProduct ? newProduct.colors?.join(', ') : editingProduct?.colors?.join(', ')}
                    onChange={e => {
                      const colors = e.target.value.split(',').map(c => c.trim()).filter(c => c !== '');
                      isAddingProduct ? setNewProduct({...newProduct, colors}) : setEditingProduct({...editingProduct!, colors});
                    }}
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-gray-700">رابط الصورة</label>
                  <input 
                    required
                    type="url" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                    value={isAddingProduct ? newProduct.imageUrl : editingProduct?.imageUrl}
                    onChange={e => isAddingProduct ? setNewProduct({...newProduct, imageUrl: e.target.value}) : setEditingProduct({...editingProduct!, imageUrl: e.target.value})}
                  />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-gray-700">وصف المنتج</label>
                  <textarea 
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue h-24"
                    value={isAddingProduct ? newProduct.description : editingProduct?.description}
                    onChange={e => isAddingProduct ? setNewProduct({...newProduct, description: e.target.value}) : setEditingProduct({...editingProduct!, description: e.target.value})}
                  />
                </div>

                <div className="col-span-1 md:col-span-2 border-t pt-4 space-y-4">
                  <h4 className="font-bold flex items-center gap-2"><Globe size={18} /> إعدادات SEO</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">عنوان Meta</label>
                      <input 
                        type="text" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                        value={isAddingProduct ? newProduct.metaTitle : editingProduct?.metaTitle}
                        onChange={e => isAddingProduct ? setNewProduct({...newProduct, metaTitle: e.target.value}) : setEditingProduct({...editingProduct!, metaTitle: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">وصف Meta</label>
                      <input 
                        type="text" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 outline-none focus:ring-2 focus:ring-brand-blue"
                        value={isAddingProduct ? newProduct.metaDescription : editingProduct?.metaDescription}
                        onChange={e => isAddingProduct ? setNewProduct({...newProduct, metaDescription: e.target.value}) : setEditingProduct({...editingProduct!, metaDescription: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 pt-4">
                  <button type="submit" className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                    <Save size={20} />
                    {isAddingProduct ? 'إضافة المنتج' : 'حفظ التعديلات'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zoomed Image Modal */}
      <AnimatePresence>
        {isZoomedImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsZoomedImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center"
            >
              <img src={isZoomedImage} alt="Zoomed" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
              <button 
                onClick={() => setIsZoomedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X size={32} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
