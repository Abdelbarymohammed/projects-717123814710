import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Product, WishlistItem } from '../types';
import { Heart, ShoppingCart, Trash2, ArrowRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WishlistProps {
  userId: string;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
}

export default function Wishlist({ userId, products, onAddToCart, onBack, onSelectProduct }: WishlistProps) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, `users/${userId}/wishlist`),
      (snapshot) => {
        setWishlistItems(snapshot.docs.map(doc => doc.data() as WishlistItem));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${userId}/wishlist`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const removeFromWishlist = async (productId: string) => {
    const path = `users/${userId}/wishlist/${productId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const wishlistProducts = wishlistItems.map(item => {
    return products.find(p => p.id === item.productId);
  }).filter(p => p !== undefined) as Product[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12" dir="rtl">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-brand-blue mb-8 hover:underline"
      >
        <ArrowRight className="h-5 w-5" />
        العودة للمتجر
      </button>

      <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Heart className="text-red-500 fill-current" />
        قائمة الأمنيات
      </h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Heart size={64} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 text-lg">قائمة الأمنيات الخاصة بك فارغة حالياً.</p>
          <button 
            onClick={onBack}
            className="btn-primary mt-6 px-8"
          >
            استكشف المنتجات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {wishlistProducts.map((product) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={product.id}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-gray"
              >
                <div className="relative aspect-[3/4] overflow-hidden cursor-pointer" onClick={() => onSelectProduct(product)}>
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromWishlist(product.id); }}
                      className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                    >
                      <Trash2 size={18} />
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
                  <button 
                    onClick={() => onAddToCart(product)}
                    className="w-full btn-primary mt-4 flex items-center justify-center gap-2 text-sm"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    أضف للسلة
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
