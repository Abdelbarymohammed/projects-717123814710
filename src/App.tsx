import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  User, 
  ShoppingCart, 
  Heart, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  Settings,
  Star,
  ShoppingBag,
  CheckCircle2, 
  Clock,
  Shirt,
  Smartphone,
  Watch,
  Gem,
  Home,
  Bell,
  ThumbsUp,
  MessageSquare,
  ShieldCheck,
  Send,
  Camera,
  Heart as HeartIcon,
  Phone,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, logOut, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { Toaster, toast } from 'sonner';
import { Product, CartItem, WishlistItem, UserProfile, Order, SliderImage, Category, SiteConfig } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import ProductDetail from './components/ProductDetail';
import Checkout from './components/Checkout';
import AdminDashboard from './components/AdminDashboard';
import Wishlist from './components/Wishlist';
import OrderHistory from './components/OrderHistory';
import AuthModal from './components/AuthModal';
import OrderStatusSteps from './components/OrderStatusSteps';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-gray p-4 text-center" dir="rtl">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">عذراً، حدث خطأ ما</h2>
            <p className="text-gray-600 mb-6">لقد واجهنا مشكلة غير متوقعة. يرجى محاولة إعادة تحميل الصفحة.</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              إعادة تحميل الصفحة
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-6 p-4 bg-red-50 text-red-800 text-xs overflow-auto rounded text-left" dir="ltr">
                {this.state.error?.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Sample Products with enhanced data
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'فستان صيفي أنيق',
    description: 'فستان صيفي خفيف ومريح بتصميم عصري وأنيق، مثالي للمناسبات الصباحية والخرجات الصيفية. مصنوع من أجود أنواع القطن السوداني.',
    price: 45000,
    category: 'أزياء',
    imageUrl: 'https://picsum.photos/seed/dress1/600/800',
    stock: 10,
    rating: 4.5,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Pink', 'Blue'],
    reviews: [
      { id: 'r1', productId: '1', userId: '1', userName: 'سارة أحمد', rating: 5, comment: 'خامة ممتازة وتصميم رائع جداً!', date: '2024-03-20', status: 'approved', likes: 0, likedBy: [] },
      { id: 'r2', productId: '1', userId: '2', userName: 'منى علي', rating: 4, comment: 'جميل جداً ومريح في اللبس.', date: '2024-03-18', status: 'approved', likes: 0, likedBy: [] }
    ]
  },
  {
    id: '2',
    name: 'قميص رجالي كاجوال',
    description: 'قميص قطني مريح مناسب لجميع الأوقات، يتميز بقصة عصرية وألوان جذابة تناسب الذوق الرفيع.',
    price: 25000,
    category: 'أزياء',
    imageUrl: 'https://picsum.photos/seed/shirt1/600/800',
    stock: 15,
    rating: 4.2,
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Blue', 'Grey', 'Black'],
    reviews: [
      { id: 'r3', productId: '2', userId: '3', userName: 'محمد عثمان', rating: 4, comment: 'جيد جداً وسعره مناسب.', date: '2024-03-15', status: 'approved', likes: 0, likedBy: [] }
    ]
  },
  {
    id: '3',
    name: 'حقيبة يد جلدية',
    description: 'حقيبة يد فاخرة مصنوعة من الجلد الطبيعي، تصميم كلاسيكي يضيف لمسة من الرقي لإطلالتك.',
    price: 65000,
    category: 'أزياء',
    imageUrl: 'https://picsum.photos/seed/bag1/600/800',
    stock: 5,
    rating: 4.8,
    colors: ['Brown', 'Black', 'Tan'],
    reviews: [
      { id: 'r4', productId: '3', userId: '4', userName: 'فاطمة حسن', rating: 5, comment: 'الجلد طبيعي وواضح جداً الجودة العالية.', date: '2024-03-22', status: 'approved', likes: 0, likedBy: [] }
    ]
  },
  {
    id: '4',
    name: 'حذاء رياضي عصري',
    description: 'حذاء رياضي مريح وخفيف الوزن، مثالي للمشي والجري والاستخدام اليومي الشاق.',
    price: 35000,
    category: 'أزياء',
    imageUrl: 'https://picsum.photos/seed/shoes1/600/800',
    stock: 8,
    rating: 4.6,
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['White', 'Black', 'Grey']
  },
  {
    id: '5',
    name: 'هاتف ذكي حديث',
    description: 'هاتف ذكي بأحدث المواصفات، كاميرا عالية الدقة وبطارية تدوم طويلاً.',
    price: 250000,
    category: 'إلكترونيات',
    imageUrl: 'https://picsum.photos/seed/phone1/600/800',
    stock: 5,
    rating: 4.9,
    colors: ['Black', 'Silver', 'Gold']
  },
  {
    id: '6',
    name: 'طقم أواني منزلية',
    description: 'طقم أواني طهي متكامل، جودة عالية وتصميم عصري لمطبخك.',
    price: 85000,
    category: 'منزل وديكور',
    imageUrl: 'https://picsum.photos/seed/home1/600/800',
    stock: 12,
    rating: 4.4,
    colors: ['Silver', 'Red']
  },
  {
    id: '7',
    name: 'مجموعة العناية بالبشرة',
    description: 'مجموعة متكاملة للعناية بالبشرة بمكونات طبيعية لجمال يدوم.',
    price: 45000,
    category: 'جمال وعناية',
    imageUrl: 'https://picsum.photos/seed/beauty1/600/800',
    stock: 20,
    rating: 4.7,
    colors: ['Natural']
  }
];

export default function AppWrapper() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  );
}

type View = 'home' | 'detail' | 'checkout' | 'admin' | 'order-success' | 'wishlist' | 'orders' | 'categories';

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [cart, setCart] = useState<(CartItem & { product: Product })[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [currentView, setCurrentView] = useState<View>('home');
  const productGridRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastOrder, setLastOrder] = useState<Partial<Order> | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentSliderIndex, setCurrentSliderIndex] = useState(0);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    primaryColor: '#003366',
    secondaryColor: '#FFFFFF',
    fontFamily: 'Cairo',
    mobileGridColumns: 2,
    announcementBar: {
      text: 'توصيل مجاني للطلبات فوق 50 ألف جنيه',
      enabled: true,
      backgroundColor: '#003366',
      textColor: '#FFFFFF'
    },
    shippingPrices: {
      khartoum: 5000,
      omdurman: 7000,
      bahri: 6000,
      states: 15000
    }
  });

  useEffect(() => {
    const configUnsubscribe = onSnapshot(doc(db, 'config', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SiteConfig;
        setSiteConfig(data);
        
        // Apply theme to root
        const root = document.documentElement;
        root.style.setProperty('--primary-color', data.primaryColor);
        root.style.setProperty('--secondary-color', data.secondaryColor);
        root.style.setProperty('--font-family', data.fontFamily === 'Cairo' ? '"Cairo", sans-serif' : '"Almarai", sans-serif');
      }
    });

    const sliderUnsubscribe = onSnapshot(
      query(collection(db, 'sliderImages'), orderBy('order', 'asc')),
      (snapshot) => {
        setSliderImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SliderImage)));
      }
    );

    const categoriesUnsubscribe = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      }
    );

    return () => {
      configUnsubscribe();
      sliderUnsubscribe();
      categoriesUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (sliderImages.length > 0) {
      const timer = setInterval(() => {
        setCurrentSliderIndex((prev) => (prev + 1) % sliderImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [sliderImages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, `users/${u.uid}`);
        try {
          await setDoc(userRef, {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName || '',
            photoURL: u.photoURL || '',
            createdAt: new Date().toISOString(),
            lastLogin: serverTimestamp(),
            role: 'user'
          }, { merge: true });

          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${u.uid}`);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setActiveOrders([]);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setActiveOrders(allOrders.filter(o => o.status !== 'delivered'));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const productsUnsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setDbProducts(products.length > 0 ? products : SAMPLE_PRODUCTS);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'products')
    );
    return () => productsUnsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setCart([]);
      setWishlist([]);
      return;
    }

    const cartUnsubscribe = onSnapshot(
      collection(db, `users/${user.uid}/cart`), 
      (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data() as CartItem);
        const cartWithProducts = items.map(item => {
          const product = dbProducts.find(p => p.id === item.productId) || SAMPLE_PRODUCTS.find(p => p.id === item.productId);
          return { ...item, product: product! };
        }).filter(item => item.product);
        setCart(cartWithProducts);
      },
      (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/cart`)
    );

    const wishlistUnsubscribe = onSnapshot(
      collection(db, `users/${user.uid}/wishlist`), 
      (snapshot) => {
        setWishlist(snapshot.docs.map(doc => doc.data() as WishlistItem));
      },
      (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/wishlist`)
    );

    return () => {
      cartUnsubscribe();
      wishlistUnsubscribe();
    };
  }, [user, dbProducts]);

  const handleCategoryClick = (category: string) => {
    setIsCategoryLoading(true);
    setActiveCategory(category);
    setCurrentView('home');
    
    // Scroll to products
    setTimeout(() => {
      productGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsCategoryLoading(false);
    }, 800);
  };

  const addToCart = async (product: Product, quantity: number = 1, size?: string, color?: string) => {
    if (!user) {
      toast.error('يرجى تسجيل الدخول أولاً');
      return;
    }

    const path = `users/${user.uid}/cart/${product.id}`;
    const cartRef = doc(db, path);
    const existingItem = cart.find(item => item.productId === product.id);

    try {
      if (existingItem) {
        await updateDoc(cartRef, { 
          quantity: existingItem.quantity + quantity,
          selectedSize: size || existingItem.selectedSize,
          selectedColor: color || existingItem.selectedColor
        });
      } else {
        await setDoc(cartRef, {
          productId: product.id,
          quantity,
          addedAt: new Date().toISOString(),
          selectedSize: size,
          selectedColor: color
        });
      }
      
      toast.custom((t) => (
        <div className="bg-white p-6 rounded-xl shadow-2xl border border-brand-blue flex flex-col gap-4 max-w-sm" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full text-green-600">
              <CheckCircle2 size={24} />
            </div>
            <p className="font-bold">تمت إضافة المنتج بنجاح!</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { toast.dismiss(t); setIsCartOpen(true); }}
              className="flex-1 btn-primary py-2 text-sm"
            >
              عرض السلة
            </button>
            <button 
              onClick={() => toast.dismiss(t)}
              className="flex-1 btn-outline py-2 text-sm"
            >
              متابعة التسوق
            </button>
          </div>
        </div>
      ), { duration: 5000 });

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/cart/${productId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateQuantity = async (productId: string, delta: number) => {
    if (!user) return;
    const item = cart.find(i => i.productId === productId);
    if (!item) return;
    const newQty = item.quantity + delta;
    const path = `users/${user.uid}/cart/${productId}`;
    try {
      if (newQty <= 0) {
        await removeFromCart(productId);
      } else {
        await updateDoc(doc(db, path), { quantity: newQty });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handlePlaceOrder = async (orderDetails: Partial<Order>) => {
    if (!user) return;
    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        ...orderDetails,
        userId: user.uid,
        items: cart,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      // Clear cart
      for (const item of cart) {
        await deleteDoc(doc(db, `users/${user.uid}/cart/${item.productId}`));
      }

      setLastOrder({ ...orderDetails, id: orderRef.id });
      setCurrentView('order-success');
      toast.success('تم استلام طلبك بنجاح!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const path = `users/${user.uid}/wishlist/${productId}`;
    const wishlistRef = doc(db, path);
    const exists = wishlist.some(item => item.productId === productId);

    try {
      if (exists) {
        await deleteDoc(wishlistRef);
        toast.success('تمت الإزالة من قائمة الأمنيات');
      } else {
        await setDoc(wishlistRef, {
          productId,
          addedAt: new Date().toISOString()
        });
        toast.success('تمت الإضافة لقائمة الأمنيات');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const filteredProducts = dbProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'الكل' || p.category === activeCategory || p.subCategory === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (currentView === 'admin' && userProfile?.role === 'admin') {
    return <AdminDashboard onBack={() => setCurrentView('home')} />;
  }

  const WHATSAPP_NUMBER = "+249960453439";
  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`;

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Helmet>
        <title>WassalStore | وصّل - متجرك الأول في السودان</title>
        <meta name="description" content="اكتشف أحدث صيحات الموضة والإلكترونيات في السودان. جودة عالية وتوصيل سريع لكل الولايات." />
      </Helmet>
      <Toaster position="top-center" />
      
      {siteConfig.announcementBar.enabled && (
        <div 
          className="py-2 px-4 text-center text-sm font-medium transition-all sticky top-0 z-[60]"
          style={{ 
            backgroundColor: siteConfig.announcementBar.backgroundColor, 
            color: siteConfig.announcementBar.textColor 
          }}
        >
          {siteConfig.announcementBar.text}
        </div>
      )}

      {/* Floating WhatsApp */}
      <a 
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-[100] bg-green-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-brand-gray shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setCurrentView('home')}>
              <h1 className="text-2xl font-bold text-brand-blue tracking-wider">WASSAL<span className="text-brand-light-blue">STORE</span></h1>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="ابحث عن منتجات..."
                  className="w-full bg-brand-gray border-none rounded-full py-2 px-10 focus:ring-2 focus:ring-brand-blue transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute right-3 top-2.5 text-gray-400 h-5 w-5" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4 space-x-reverse">
              {userProfile?.role === 'admin' && (
                <button 
                  onClick={() => setCurrentView('admin')}
                  className="p-2 hover:bg-brand-gray rounded-full transition-colors text-brand-blue"
                >
                  <Settings className="h-6 w-6" />
                </button>
              )}
              
              <div className="relative">
                <button 
                  onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 p-1 hover:bg-brand-gray rounded-full transition-colors border border-transparent hover:border-gray-100"
                >
                  {user ? (
                    <div className="relative">
                      <img src={user.photoURL || ''} alt={user.displayName || ''} className="h-8 w-8 rounded-full border-2 border-brand-blue" />
                      <div className="absolute -top-1 -right-1 bg-red-500 h-3 w-3 rounded-full border-2 border-white animate-pulse" />
                    </div>
                  ) : (
                    <div className="p-2 bg-brand-gray rounded-full text-brand-blue">
                      <User className="h-6 w-6" />
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && user && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                      >
                        <div className="p-4 bg-brand-blue text-white">
                          <p className="font-bold text-sm truncate">{user.displayName}</p>
                          <p className="text-xs opacity-70 truncate">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <button 
                            onClick={() => { setCurrentView('orders'); setIsUserMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                          >
                            <Bell size={18} className="text-brand-blue" />
                            التنبيهات
                            <span className="mr-auto bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">جديد</span>
                          </button>
                          <button 
                            onClick={() => { setCurrentView('orders'); setIsUserMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                          >
                            <ShoppingBag size={18} className="text-brand-blue" />
                            طلباتي
                          </button>
                          {userProfile?.role === 'admin' && (
                            <button 
                              onClick={() => { setCurrentView('admin'); setIsUserMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                              <Settings size={18} className="text-brand-blue" />
                              لوحة التحكم
                            </button>
                          )}
                          <button 
                            onClick={() => { setCurrentView('wishlist'); setIsUserMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                          >
                            <Heart size={18} className="text-red-500" />
                            قائمة الأمنيات
                          </button>
                          <div className="h-px bg-gray-100 my-2" />
                          <button 
                            onClick={() => { logOut(); setIsUserMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <ArrowRight size={18} />
                            تسجيل الخروج
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              <button 
                onClick={() => setIsCartOpen(true)}
                className="p-2 hover:bg-brand-gray rounded-full transition-colors relative"
              >
                <ShoppingCart className="h-6 w-6 text-brand-blue" />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-brand-light-blue text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* View Content */}
      <AnimatePresence mode="wait">
        {currentView === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Mega Menu / Categories Bar */}
            <div className="bg-brand-blue text-white overflow-x-auto whitespace-nowrap scrollbar-hide">
              <div className="max-w-7xl mx-auto px-4 flex items-center h-12 gap-8 text-sm font-medium">
                <button 
                  onClick={() => setActiveCategory('الكل')}
                  className={cn("hover:text-brand-light-blue transition-colors", activeCategory === 'الكل' && "text-brand-light-blue border-b-2 border-brand-light-blue h-full px-2")}
                >
                  الكل
                </button>
                {categories.length > 0 ? categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.name)}
                    className={cn("hover:text-brand-light-blue transition-colors", activeCategory === cat.name && "text-brand-light-blue border-b-2 border-brand-light-blue h-full px-2")}
                  >
                    {cat.name}
                  </button>
                )) : ['أزياء', 'إلكترونيات', 'منزل وديكور', 'جمال وعناية'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn("hover:text-brand-light-blue transition-colors", activeCategory === cat && "text-brand-light-blue border-b-2 border-brand-light-blue h-full px-2")}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-categories Bar */}
            {(activeCategory === 'أزياء' || activeCategory === 'إلكترونيات') && (
              <div className="bg-white border-b border-gray-100 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="max-w-7xl mx-auto px-4 flex items-center h-10 gap-6 text-xs font-bold text-gray-500">
                  {activeCategory === 'أزياء' && ['الكل', 'رجالي', 'نسائي', 'أطفال'].map(sub => (
                    <button key={sub} className="hover:text-brand-blue transition-colors">{sub}</button>
                  ))}
                  {activeCategory === 'إلكترونيات' && ['الكل', 'هواتف', 'إكسسوارات'].map(sub => (
                    <button key={sub} className="hover:text-brand-blue transition-colors">{sub}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Hero Slider */}
            <section className="relative h-[300px] md:h-[500px] overflow-hidden bg-brand-gray">
              <AnimatePresence mode="wait">
                {sliderImages.length > 0 ? (
                  <motion.div
                    key={currentSliderIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <img 
                      src={sliderImages[currentSliderIndex].imageUrl} 
                      alt={sliderImages[currentSliderIndex].title || 'Hero'} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-brand-blue/40 to-transparent" />
                    {sliderImages[currentSliderIndex].title && (
                      <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
                        <div className="max-w-xl text-white">
                          {sliderImages[currentSliderIndex].badge && sliderImages[currentSliderIndex].badge !== 'none' && (
                            <span className="inline-block bg-brand-light-blue text-white px-4 py-1 rounded-full text-sm font-bold mb-4">
                              {sliderImages[currentSliderIndex].badge === 'sale' ? 'تخفيضات' : 'وصل حديثاً'}
                            </span>
                          )}
                          <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{sliderImages[currentSliderIndex].title}</h2>
                          {sliderImages[currentSliderIndex].subtitle && (
                            <p className="text-lg md:text-xl mb-8 opacity-90">{sliderImages[currentSliderIndex].subtitle}</p>
                          )}
                          {sliderImages[currentSliderIndex].buttonText && (
                            <button 
                              onClick={() => window.location.href = sliderImages[currentSliderIndex].buttonLink || '#'}
                              className="btn-primary text-lg px-10 py-4 rounded-full shadow-lg"
                            >
                              {sliderImages[currentSliderIndex].buttonText}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="absolute inset-0">
                    <img 
                      src="https://picsum.photos/seed/fashion-hero/1920/1080" 
                      alt="Hero" 
                      className="w-full h-full object-cover opacity-80"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-brand-blue/40 to-transparent" />
                    <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
                      <div className="max-w-xl text-white">
                        <h2 className="text-5xl font-bold mb-6 leading-tight">أناقتك تبدأ من هنا</h2>
                        <p className="text-xl mb-8 opacity-90">اكتشف أحدث صيحات الموضة في السودان. جودة عالية وتوصيل سريع لكل الولايات.</p>
                        <button className="btn-primary text-lg px-10 py-4 rounded-full shadow-lg">
                          تسوق الآن
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>
              
              {sliderImages.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {sliderImages.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentSliderIndex(idx)}
                      className={cn("h-2 rounded-full transition-all", currentSliderIndex === idx ? "w-8 bg-white" : "w-2 bg-white/50")}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {/* Featured Categories Section */}
              <section className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-brand-blue border-r-4 border-brand-light-blue pr-4">تسوق حسب الفئة</h2>
                  <button onClick={() => handleCategoryClick('الكل')} className="text-brand-light-blue font-bold hover:underline">عرض الكل</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { name: 'رجالي', icon: <Shirt size={28} />, category: 'أزياء', sub: 'رجالي', color: 'bg-blue-50' },
                    { name: 'نسائي', icon: <Gem size={28} />, category: 'أزياء', sub: 'نسائي', color: 'bg-pink-50' },
                    { name: 'إلكترونيات', icon: <Smartphone size={28} />, category: 'إلكترونيات', color: 'bg-purple-50' },
                    { name: 'إكسسوارات', icon: <Watch size={28} />, category: 'إكسسوارات', color: 'bg-orange-50' }
                  ].map((cat, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCategoryClick(cat.sub || cat.category)}
                      className={cn(
                        "flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl transition-all border border-transparent hover:border-brand-light-blue/20",
                        cat.color
                      )}
                    >
                      <div className="text-brand-blue mb-3 p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                        {cat.icon}
                      </div>
                      <span className="text-base md:text-lg font-bold text-brand-blue">{cat.name}</span>
                      <span className="text-[10px] md:text-xs text-gray-500 mt-1">اكتشف المزيد</span>
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* Product Grid */}
              <div 
                ref={productGridRef}
                className="relative"
              >
                {isCategoryLoading && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-3xl">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-brand-light-blue border-t-transparent rounded-full animate-spin" />
                      <p className="text-brand-blue font-bold animate-pulse">جاري تحميل المنتجات...</p>
                    </div>
                  </div>
                )}
                <div className={cn(
                  "grid gap-6",
                  siteConfig.mobileGridColumns === 2 ? "grid-cols-2" : "grid-cols-3",
                  "lg:grid-cols-4"
                )}>
                {filteredProducts.map((product) => (
                  <motion.div
                    layout
                    key={product.id}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-gray"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden cursor-pointer" onClick={() => { setSelectedProduct(product); setCurrentView('detail'); }}>
                      {product.badge && product.badge !== 'none' && (
                        <div className="absolute top-2 right-2 z-10">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm",
                            product.badge === 'sale' ? "bg-red-500" : "bg-brand-light-blue"
                          )}>
                            {product.badge === 'sale' ? 'تخفيض' : 'جديد'}
                          </span>
                        </div>
                      )}
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                          className={cn(
                            "p-2 rounded-full backdrop-blur-sm transition-all shadow-sm",
                            wishlist.some(item => item.productId === product.id)
                              ? "bg-red-500 text-white"
                              : "bg-white/80 text-gray-400 hover:text-red-500"
                          )}
                        >
                          <Heart size={18} className={wishlist.some(item => item.productId === product.id) ? "fill-current" : ""} />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-white/90 backdrop-blur-sm">
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                          className="w-full btn-primary flex items-center justify-center gap-2 text-sm"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          أضف للسلة
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm mb-1 truncate">{product.name}</h3>
                      <p className="text-brand-light-blue font-bold text-lg">{product.price.toLocaleString()} SDG</p>
                      <div className="mt-2 flex items-center text-yellow-400 text-xs">
                        <Star size={12} className="fill-current" />
                        <span className="text-gray-400 mr-1">({product.rating})</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </main>
        </motion.div>
      )}

        {currentView === 'categories' && (
          <motion.div 
            key="categories"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-grow bg-brand-gray/30 py-12 px-4"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-bold text-brand-blue">تصفح الفئات</h2>
                <button 
                  onClick={() => setCurrentView('home')}
                  className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors text-brand-blue"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-8">
                {[
                  { name: 'رجالي', icon: <Shirt size={40} />, category: 'أزياء', sub: 'رجالي', color: 'bg-blue-50', desc: 'أحدث الملابس الرجالية' },
                  { name: 'نسائي', icon: <Gem size={40} />, category: 'أزياء', sub: 'نسائي', color: 'bg-pink-50', desc: 'أناقة لا مثيل لها' },
                  { name: 'إلكترونيات', icon: <Smartphone size={40} />, category: 'إلكترونيات', color: 'bg-purple-50', desc: 'أحدث التقنيات' },
                  { name: 'إكسسوارات', icon: <Watch size={40} />, category: 'إكسسوارات', color: 'bg-orange-50', desc: 'لمسات تكتمل بها أناقتك' }
                ].map((cat, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryClick(cat.sub || cat.category)}
                    className={cn(
                      "flex flex-col items-center justify-center p-8 md:p-12 rounded-[2.5rem] transition-all border-2 border-transparent hover:border-brand-light-blue/20 shadow-sm hover:shadow-xl",
                      cat.color
                    )}
                  >
                    <div className="text-brand-blue mb-6 p-5 bg-white rounded-3xl shadow-md">
                      {cat.icon}
                    </div>
                    <span className="text-xl md:text-2xl font-bold text-brand-blue mb-2">{cat.name}</span>
                    <span className="text-xs md:text-sm text-gray-500">{cat.desc}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {currentView === 'detail' && selectedProduct && (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ProductDetail 
              product={selectedProduct} 
              user={userProfile}
              onAddToCart={addToCart} 
              onBack={() => setCurrentView('home')} 
              onLogin={() => setIsAuthModalOpen(true)}
            />
          </motion.div>
        )}

        {currentView === 'checkout' && (
          <motion.div 
            key="checkout"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <Checkout 
              cart={cart} 
              onPlaceOrder={handlePlaceOrder} 
              onBack={() => setIsCartOpen(true)} 
            />
          </motion.div>
        )}

        {currentView === 'order-success' && lastOrder && (
          <motion.div 
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-12 text-center relative overflow-hidden"
            >
              {/* Background Accents */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-light-blue/5 rounded-full -ml-16 -mb-16" />

              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600 shadow-inner"
              >
                <CheckCircle2 size={64} />
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">تهانينا! تم استلام طلبك بنجاح</h2>
              <p className="text-gray-500 mb-8 text-lg">شكراً لثقتك في متجر <span className="text-brand-blue font-bold">وصّل</span>. طلبك الآن قيد المراجعة.</p>
              
              <div className="bg-brand-gray/50 p-6 rounded-2xl mb-8 text-right border border-brand-gray">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
                  <span className="text-gray-400 text-sm">رقم الطلب</span>
                  <span className="font-bold text-brand-blue text-lg">#{lastOrder.id?.slice(-6)}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الاسم:</span>
                    <span className="font-bold">{lastOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الولاية:</span>
                    <span className="font-bold">{lastOrder.state}</span>
                  </div>
                  <div className="flex justify-between text-lg border-t border-gray-200 pt-4">
                    <span className="text-brand-blue font-bold">الإجمالي:</span>
                    <span className="text-brand-blue font-bold">{lastOrder.total?.toLocaleString()} SDG</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setCurrentView('home')}
                  className="btn-outline py-4 rounded-xl flex items-center justify-center gap-2"
                >
                  متابعة التسوق
                </button>
                <button 
                  onClick={() => setCurrentView('orders')}
                  className="btn-primary py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/20"
                >
                  <ShoppingBag size={20} />
                  تتبع حالة الطلبيات
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {currentView === 'wishlist' && user && (
          <motion.div 
            key="wishlist"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <Wishlist 
              userId={user.uid} 
              products={dbProducts} 
              onAddToCart={addToCart} 
              onBack={() => setCurrentView('home')}
              onSelectProduct={(p) => { setSelectedProduct(p); setCurrentView('detail'); }}
            />
          </motion.div>
        )}

        {currentView === 'orders' && user && (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <OrderHistory 
              userId={user.uid} 
              onBack={() => setCurrentView('home')} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Footer */}
      <footer className="bg-brand-blue text-white py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Column 1: Brand Identity */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold tracking-tighter">WASSALSTORE</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                متجر وصّل هو وجهتكم الأولى للأناقة والتميز في السودان. نسعى لتوفير أحدث صيحات الموضة بجودة عالمية وأسعار تنافسية تصلكم أينما كنتم.
              </p>
              <div className="flex space-x-4 space-x-reverse">
                <a href="https://www.facebook.com/share/1CPVuNKVhr/" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-brand-light-blue transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://www.instagram.com/abdalbari_mohamad2?igsh=bTB5NHg1YnhlenNh" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-brand-light-blue transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-bold mb-8 text-lg border-r-4 border-brand-light-blue pr-3">روابط سريعة</h4>
              <ul className="space-y-4 text-gray-300 text-sm">
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setCurrentView('home')}>الرئيسية</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setCurrentView('categories')}>تصفح الفئات</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setCurrentView('wishlist')}>قائمة الأمنيات</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setCurrentView('orders')}>تتبع الطلبات</li>
              </ul>
            </div>

            {/* Column 3: Customer Support */}
            <div>
              <h4 className="font-bold mb-8 text-lg border-r-4 border-brand-light-blue pr-3">خدمة العملاء</h4>
              <ul className="space-y-4">
                <li>
                  <a 
                    href="https://wa.me/249966336633" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-green-600/20 text-green-400 rounded-xl hover:bg-green-600/30 transition-colors"
                  >
                    <Phone size={18} />
                    <span className="text-sm font-bold">تواصل معنا عبر واتساب</span>
                  </a>
                </li>
                <li className="text-gray-300 text-sm hover:text-white cursor-pointer flex items-center gap-2" onClick={() => toast.info("نقوم بالتوصيل لجميع ولايات السودان خلال 3-5 أيام عمل.")}>
                  <Truck size={18} className="text-brand-light-blue" />
                  سياسة الشحن والتوصيل
                </li>
                <li className="text-gray-300 text-sm hover:text-white cursor-pointer flex items-center gap-2" onClick={() => toast.info("نلتزم بحماية بيانات عملائنا وسرية معلومات الدفع.")}>
                  <ShieldCheck size={18} className="text-brand-light-blue" />
                  سياسة الخصوصية والأمان
                </li>
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div>
              <h4 className="font-bold mb-8 text-lg border-r-4 border-brand-light-blue pr-3">النشرة البريدية</h4>
              <p className="text-gray-400 text-xs mb-4">اشترك للحصول على آخر العروض والخصومات الحصرية.</p>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="بريدك الإلكتروني" 
                  className="w-full bg-white/10 border-none rounded-xl py-4 px-6 text-sm focus:ring-2 focus:ring-brand-light-blue outline-none" 
                />
                <button className="absolute left-2 top-2 bottom-2 bg-brand-light-blue text-white px-4 rounded-lg hover:bg-blue-400 transition-colors">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-white/10 text-center text-gray-400 text-xs">
            <p>&copy; {new Date().getFullYear()} WASSALSTORE. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-brand-blue text-white">
                <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingBag /> سلة التسوق</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="flex-grow overflow-y-auto p-6 space-y-8">
                {/* Active Orders Section */}
                {activeOrders.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-brand-blue flex items-center gap-2 border-b pb-2">
                      <Clock size={16} /> طلبات نشطة ({activeOrders.length})
                    </h3>
                    <div className="space-y-4">
                      {activeOrders.map(order => (
                        <div key={order.id} className="bg-brand-gray/30 rounded-xl p-4 border border-brand-gray">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-brand-blue">#{order.id.slice(-6)}</span>
                            <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                          
                          <div className="flex -space-x-2 space-x-reverse mb-4 overflow-hidden">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <img 
                                key={idx} 
                                src={item.product.imageUrl} 
                                alt="" 
                                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ))}
                            {order.items.length > 3 && (
                              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>

                          <OrderStatusSteps status={order.status} />
                          
                          <div className="mt-4 flex justify-between items-center">
                            <span className="text-sm font-bold">{order.total.toLocaleString()} SDG</span>
                            <button 
                              onClick={() => { setIsCartOpen(false); setCurrentView('orders'); }}
                              className="text-xs text-brand-blue hover:underline font-bold"
                            >
                              عرض التفاصيل
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cart Items Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 border-b pb-2">المنتجات في السلة</h3>
                  {cart.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400 space-y-4">
                      <ShoppingCart size={64} className="opacity-10" />
                      <p>السلة فارغة</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.productId} className="flex gap-4 border-b pb-6 last:border-0">
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-20 h-20 object-cover rounded-lg" referrerPolicy="no-referrer" />
                        <div className="flex-grow">
                          <div className="flex justify-between">
                            <h4 className="font-bold text-sm">{item.product.name}</h4>
                            <button onClick={() => removeFromCart(item.productId)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                          </div>
                          <p className="text-brand-light-blue font-bold text-sm mt-1">{item.product.price.toLocaleString()} SDG</p>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border rounded-md">
                              <button onClick={() => updateQuantity(item.productId, -1)} className="px-2 py-1 hover:bg-gray-100"><Minus size={14} /></button>
                              <span className="px-3 text-sm font-bold">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.productId, 1)} className="px-2 py-1 hover:bg-gray-100"><Plus size={14} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {cart.length > 0 && (
                <div className="p-6 bg-brand-gray border-t space-y-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>الإجمالي:</span>
                    <span>{cart.reduce((acc, i) => acc + i.product.price * i.quantity, 0).toLocaleString()} SDG</span>
                  </div>
                  <button 
                    onClick={() => { setIsCartOpen(false); setCurrentView('checkout'); }}
                    className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3"
                  >
                    إتمام الشراء <ArrowRight />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-6 py-3 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setCurrentView('home')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            currentView === 'home' ? "text-brand-blue" : "text-gray-400"
          )}
        >
          <Home size={20} />
          <span className="text-[10px] font-bold">الرئيسية</span>
        </button>
        <button 
          onClick={() => setCurrentView('categories')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            currentView === 'categories' ? "text-brand-blue" : "text-gray-400"
          )}
        >
          <Menu size={20} />
          <span className="text-[10px] font-bold">الفئات</span>
        </button>
        <button 
          onClick={() => setCurrentView('wishlist')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            currentView === 'wishlist' ? "text-brand-blue" : "text-gray-400"
          )}
        >
          <HeartIcon size={20} />
          <span className="text-[10px] font-bold">المفضلة</span>
        </button>
        <button 
          onClick={() => user ? setCurrentView('orders') : setIsAuthModalOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            currentView === 'orders' ? "text-brand-blue" : "text-gray-400"
          )}
        >
          <User size={20} />
          <span className="text-[10px] font-bold">{user ? 'حسابي' : 'دخول'}</span>
        </button>
      </div>
    </div>
  );
}
