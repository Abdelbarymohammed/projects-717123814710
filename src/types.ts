export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory?: string;
  imageUrl: string;
  stock: number;
  rating: number;
  sizes?: string[];
  colors?: string[];
  reviews?: Review[];
  metaTitle?: string;
  metaDescription?: string;
  badge?: 'sale' | 'new' | 'none';
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  date: string;
  photoUrls?: string[];
  likes: number;
  likedBy: string[];
  status: 'pending' | 'approved' | 'hidden';
  replies?: Reply[];
}

export interface Reply {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  comment: string;
  date: string;
  isAdmin?: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
  selectedSize?: string;
  selectedColor?: string;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  role?: 'admin' | 'user';
}

export interface Order {
  id: string;
  userId: string;
  items: (CartItem & { product: Product })[];
  customerName: string;
  phone: string;
  address: string;
  state: string;
  city?: string; // For Khartoum sub-options
  shippingCost: number;
  subtotal: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'out-for-delivery' | 'delivered';
  createdAt: string;
  paymentMethod: 'bankak' | 'mycashy';
  paymentScreenshotUrl: string;
  notes?: string;
}

export interface SliderImage {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  order: number;
  badge?: 'sale' | 'new' | 'none';
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  subCategories?: string[];
}

export interface SiteConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: 'Cairo' | 'Almarai';
  mobileGridColumns: 2 | 3;
  announcementBar: {
    text: string;
    enabled: boolean;
    backgroundColor: string;
    textColor: string;
  };
  shippingPrices: {
    khartoum: number;
    omdurman: number;
    bahri: number;
    states: number;
  };
}
