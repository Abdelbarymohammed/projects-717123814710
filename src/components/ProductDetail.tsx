import React, { useState, useEffect } from 'react';
import { Star, ShoppingCart, ArrowRight, Check, ThumbsUp, MessageSquare, ShieldCheck, Camera, Send, User } from 'lucide-react';
import { Product, Review, Reply, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, updateDoc, doc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface ProductDetailProps {
  product: Product;
  user: UserProfile | null;
  onAddToCart: (product: Product, quantity: number, size?: string, color?: string) => void;
  onBack: () => void;
  onLogin: () => void;
}

export default function ProductDetail({ product, user, onAddToCart, onBack, onLogin }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', photoUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', product.id),
      where('status', '==', 'approved'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'reviews'));

    return () => unsubscribe();
  }, [product.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newReview.comment.trim()) {
      toast.error('يرجى كتابة تعليق');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: product.id,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toISOString(),
        photoUrls: newReview.photoUrl ? [newReview.photoUrl] : [],
        likes: 0,
        likedBy: [],
        status: 'pending', // Reviews need admin approval
        replies: []
      });
      setNewReview({ rating: 5, comment: '', photoUrl: '' });
      toast.success('شكراً لك! سيتم مراجعة تعليقك ونشره قريباً.');
    } catch (error) {
      toast.error('فشل إرسال التعليق');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeReview = async (reviewId: string, likedBy: string[]) => {
    if (!user) {
      onLogin();
      return;
    }

    const isLiked = likedBy.includes(user.uid);
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likes: isLiked ? likedBy.length - 1 : likedBy.length + 1
      });
    } catch (error) {
      toast.error('حدث خطأ ما');
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!user) return;
    if (!replyText.trim()) return;

    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      const newReply: Reply = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        comment: replyText,
        date: new Date().toISOString(),
        isAdmin: user.role === 'admin'
      };

      await updateDoc(doc(db, 'reviews', reviewId), {
        replies: arrayUnion(newReply)
      });
      setReplyText('');
      setReplyingTo(null);
      toast.success('تم إضافة الرد');
    } catch (error) {
      toast.error('فشل إضافة الرد');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32" dir="rtl">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-brand-blue mb-8 hover:underline font-bold"
      >
        <ArrowRight className="h-5 w-5" />
        العودة للمتجر
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl overflow-hidden shadow-2xl bg-white"
        >
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover aspect-square hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Info Section */}
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-brand-blue leading-tight">{product.name}</h1>
            <div className="flex items-center gap-3">
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={i < Math.floor(product.rating) ? "fill-current" : "text-gray-300"} size={18} />
                ))}
              </div>
              <span className="text-gray-400 text-sm font-bold">({reviews.length} تقييم)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-4">
            <p className="text-4xl font-black text-brand-blue">{product.price.toLocaleString()} SDG</p>
            {product.badge === 'sale' && (
              <span className="text-lg text-gray-400 line-through">{(product.price * 1.2).toLocaleString()} SDG</span>
            )}
          </div>
          
          <p className="text-gray-600 leading-relaxed text-lg">{product.description}</p>

          <div className="space-y-6 pt-8 border-t border-gray-100">
            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <span className="block font-bold text-gray-700">اختر المقاس:</span>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-bold transition-all",
                        selectedSize === size 
                          ? "bg-brand-blue text-white border-brand-blue shadow-lg scale-105" 
                          : "bg-white text-gray-500 border-gray-100 hover:border-brand-blue"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3">
                <span className="block font-bold text-gray-700">اختر اللون:</span>
                <div className="flex flex-wrap gap-4">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "w-10 h-10 rounded-full border-4 transition-all relative group",
                        selectedColor === color ? "border-brand-blue scale-125 shadow-md" : "border-white shadow-sm"
                      )}
                      style={{ backgroundColor: color.toLowerCase() }}
                    >
                      {selectedColor === color && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className={cn("h-5 w-5", color.toLowerCase() === 'white' ? 'text-black' : 'text-white')} />
                        </div>
                      )}
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {color}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex items-center bg-gray-100 rounded-2xl p-1 h-14 w-full sm:w-40">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-full flex items-center justify-center hover:bg-white rounded-xl transition-colors font-bold text-xl"
                >-</button>
                <span className="flex-1 text-center font-black text-lg">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-full flex items-center justify-center hover:bg-white rounded-xl transition-colors font-bold text-xl"
                >+</button>
              </div>

              <button 
                onClick={() => onAddToCart(product, quantity, selectedSize, selectedColor)}
                disabled={product.stock === 0}
                className="flex-grow btn-primary h-14 text-lg flex items-center justify-center gap-3 shadow-xl shadow-brand-blue/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-6 w-6" />
                {product.stock > 0 ? 'إضافة إلى السلة' : 'نفذت الكمية'}
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
              <ShieldCheck size={16} className="text-green-500" />
              ضمان جودة 100% وتوصيل آمن
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-32 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b pb-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-brand-blue">آراء ومراجعات العملاء</h2>
            <p className="text-gray-500 font-bold">ماذا يقول المتسوقون عن هذا المنتج</p>
          </div>
          
          <div className="flex items-center gap-4 bg-brand-blue/5 p-4 rounded-2xl">
            <div className="text-center px-4 border-l border-brand-blue/10">
              <div className="text-3xl font-black text-brand-blue">{product.rating}</div>
              <div className="text-[10px] font-bold text-gray-400">من 5 نجوم</div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={i < Math.floor(product.rating) ? "fill-current" : "text-gray-300"} size={14} />
                ))}
              </div>
              <div className="text-xs font-bold text-gray-500">{reviews.length} مراجعة موثقة</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Review Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="text-brand-blue" />
                أضف مراجعتك
              </h3>
              
              {user ? (
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">تقييمك للمنتج:</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className={cn(
                            "p-2 rounded-xl transition-all",
                            newReview.rating >= star ? "text-yellow-400 bg-yellow-50" : "text-gray-300 bg-gray-50"
                          )}
                        >
                          <Star className={newReview.rating >= star ? "fill-current" : ""} size={24} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">رأيك بالتفصيل:</label>
                    <textarea
                      required
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="اكتب تجربتك مع المنتج هنا..."
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm h-32 focus:ring-2 focus:ring-brand-blue outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">أضف صورة (اختياري):</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="url"
                        placeholder="رابط صورة المنتج..."
                        value={newReview.photoUrl}
                        onChange={(e) => setNewReview({ ...newReview, photoUrl: e.target.value })}
                        className="flex-grow bg-gray-50 border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-blue outline-none"
                      />
                      <div className="p-3 bg-gray-100 rounded-xl text-gray-400">
                        <Camera size={20} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-3 shadow-lg shadow-brand-blue/20"
                  >
                    {isSubmitting ? 'جاري الإرسال...' : 'نشر المراجعة'}
                    <Send size={18} />
                  </button>
                </form>
              ) : (
                <div className="text-center py-8 space-y-6">
                  <div className="w-16 h-16 bg-brand-blue/5 rounded-full flex items-center justify-center mx-auto text-brand-blue">
                    <User size={32} />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-gray-700">يرجى تسجيل الدخول لإضافة تعليقك</p>
                    <p className="text-xs text-gray-400 leading-relaxed">نحن نهتم بمصداقية المراجعات، لذا نطلب من عملائنا تسجيل الدخول أولاً.</p>
                  </div>
                  <button 
                    onClick={onLogin}
                    className="w-full btn-primary py-3"
                  >
                    تسجيل الدخول الآن
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-8">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center overflow-hidden">
                        {review.userPhoto ? (
                          <img src={review.userPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="text-brand-blue" size={24} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-blue">{review.userName}</h4>
                        <div className="flex text-yellow-400 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={i < review.rating ? "fill-current" : "text-gray-300"} size={12} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                      {new Date(review.date).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <p className="text-gray-600 leading-relaxed font-medium">{review.comment}</p>

                  {review.photoUrls && review.photoUrls.length > 0 && (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {review.photoUrls.map((url, idx) => (
                        <img 
                          key={idx} 
                          src={url} 
                          alt="Review" 
                          className="w-32 h-32 object-cover rounded-2xl border-2 border-gray-50 hover:scale-105 transition-transform cursor-pointer" 
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                    <button 
                      onClick={() => handleLikeReview(review.id, review.likedBy)}
                      className={cn(
                        "flex items-center gap-2 text-xs font-bold transition-colors",
                        review.likedBy.includes(user?.uid || '') ? "text-brand-blue" : "text-gray-400 hover:text-brand-blue"
                      )}
                    >
                      <ThumbsUp size={16} className={review.likedBy.includes(user?.uid || '') ? "fill-current" : ""} />
                      مفيد ({review.likes})
                    </button>
                    <button 
                      onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                      className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-blue transition-colors"
                    >
                      <MessageSquare size={16} />
                      رد ({review.replies?.length || 0})
                    </button>
                  </div>

                  {/* Replies */}
                  <AnimatePresence>
                    {(review.replies && review.replies.length > 0) && (
                      <div className="space-y-4 mt-6 pr-6 border-r-2 border-gray-100">
                        {review.replies.map((reply) => (
                          <div key={reply.id} className="bg-gray-50 p-4 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{reply.userName}</span>
                                {reply.isAdmin && (
                                  <span className="bg-brand-blue text-white text-[8px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <ShieldCheck size={8} /> متجر وصّل
                                  </span>
                                )}
                              </div>
                              <span className="text-[8px] text-gray-400">{new Date(reply.date).toLocaleDateString('ar-EG')}</span>
                            </div>
                            <p className="text-xs text-gray-600">{reply.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Reply Input */}
                  {replyingTo === review.id && user && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 flex gap-2"
                    >
                      <input 
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="اكتب ردك هنا..."
                        className="flex-grow bg-gray-50 border-none rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
                      />
                      <button 
                        onClick={() => handleReply(review.id)}
                        className="bg-brand-blue text-white p-2 rounded-xl hover:bg-brand-light-blue transition-colors"
                      >
                        <Send size={16} />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                  <MessageSquare size={40} />
                </div>
                <p className="text-gray-400 font-bold">لا توجد مراجعات لهذا المنتج بعد. كن أول من يشاركنا رأيه!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
