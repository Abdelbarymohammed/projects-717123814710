import React, { useState, useEffect } from 'react';
import { Product, CartItem, Order } from '../types';
import { ArrowRight, ShoppingBag, MapPin, Phone, User, CreditCard, Upload, Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import { motion } from 'motion/react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';

interface CheckoutProps {
  cart: (CartItem & { product: Product })[];
  onPlaceOrder: (orderDetails: Partial<Order>) => void;
  onBack: () => void;
}

const SUDAN_STATES = [
  "الخرطوم", "الجزيرة", "البحر الأحمر", "كسلا", "القضارف", "سنار", "النيل الأبيض", "النيل الأزرق", 
  "الشمالية", "نهر النيل", "شمال دارفور", "غرب دارفور", "جنوب دارفور", "شرق دارفور", "وسط دارفور", 
  "شمال كردفان", "غرب كردفان", "جنوب كردفان"
];

const KHARTOUM_CITIES = [
  { name: "الخرطوم (المدينة)", cost: 10000 },
  { name: "الخرطوم بحري", cost: 10000 },
  { name: "أم درمان", cost: 7000 }
];

const FLAT_SHIPPING_RATE = 15000;

const PAYMENT_METHODS = [
  { id: 'bankak', name: 'بنكك (Bankak)', details: 'حساب رقم: 3344644 (عبدالباري محمد عبدالرحمن)' },
  { id: 'mycashy', name: 'ماي كاشي (MyCashy)', details: 'رقم: 603565 (عبدالباري محمد عبدالرحمن)' }
];

export default function Checkout({ cart, onPlaceOrder, onBack }: CheckoutProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    state: '',
    city: '',
    paymentMethod: 'bankak' as 'bankak' | 'mycashy',
    notes: ''
  });

  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  useEffect(() => {
    if (formData.state === "الخرطوم") {
      const city = KHARTOUM_CITIES.find(c => c.name === formData.city);
      setShippingCost(city ? city.cost : 0);
    } else if (formData.state) {
      setShippingCost(FLAT_SHIPPING_RATE);
    } else {
      setShippingCost(0);
    }
  }, [formData.state, formData.city]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone || !formData.address || !formData.state || !screenshot) {
      toast.error('يرجى إكمال جميع الحقول ورفع صورة التحويل');
      return;
    }
    if (formData.state === "الخرطوم" && !formData.city) return;

    setIsUploading(true);
    try {
      const screenshotRef = ref(storage, `payments/${Date.now()}_${screenshot.name}`);
      await uploadBytes(screenshotRef, screenshot);
      const screenshotUrl = await getDownloadURL(screenshotRef);

      onPlaceOrder({
        customerName: formData.customerName,
        phone: formData.phone,
        address: formData.address,
        state: formData.state,
        city: formData.city,
        shippingCost,
        subtotal,
        total: subtotal + shippingCost,
        paymentMethod: formData.paymentMethod,
        paymentScreenshotUrl: screenshotUrl,
        notes: formData.notes
      });
    } catch (error) {
      console.error("Error uploading screenshot:", error);
      toast.error('حدث خطأ أثناء رفع الصورة، يرجى المحاولة مرة أخرى');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12" dir="rtl">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-brand-blue mb-8 hover:underline"
      >
        <ArrowRight className="h-5 w-5" />
        العودة للسلة
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Form Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100"
        >
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <MapPin className="text-brand-blue" />
            معلومات الشحن والتوصيل
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">الاسم الكامل</label>
              <div className="relative">
                <User className="absolute right-3 top-3 text-gray-400" size={18} />
                <input 
                  required
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-10 focus:ring-2 focus:ring-brand-blue outline-none"
                  placeholder="أدخل اسمك بالكامل"
                  value={formData.customerName}
                  onChange={e => setFormData({...formData, customerName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">رقم الهاتف</label>
              <div className="relative">
                <Phone className="absolute right-3 top-3 text-gray-400" size={18} />
                <input 
                  required
                  type="tel" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-10 focus:ring-2 focus:ring-brand-blue outline-none"
                  placeholder="09XXXXXXXX"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">العنوان بالتفصيل</label>
              <textarea 
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-brand-blue outline-none h-24"
                placeholder="اسم الشارع، رقم المنزل، المعالم القريبة..."
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">الولاية</label>
                <select 
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-brand-blue outline-none"
                  value={formData.state}
                  onChange={e => setFormData({...formData, state: e.target.value, city: ''})}
                >
                  <option value="">اختر الولاية</option>
                  {SUDAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {formData.state === "الخرطوم" && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">المدينة / المنطقة</label>
                  <select 
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-brand-blue outline-none"
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                  >
                    <option value="">اختر المنطقة</option>
                    {KHARTOUM_CITIES.map(city => (
                      <option key={city.name} value={city.name}>{city.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="text-brand-blue" />
                طريقة الدفع
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData({...formData, paymentMethod: method.id as any})}
                    className={cn(
                      "p-4 rounded-xl border-2 text-right transition-all",
                      formData.paymentMethod === method.id 
                        ? "border-brand-blue bg-blue-50" 
                        : "border-gray-100 hover:border-brand-blue"
                    )}
                  >
                    <p className="font-bold mb-1">{method.name}</p>
                    <p className="text-xs text-gray-500">{method.details}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">رفع صورة التحويل (إجباري)</label>
              <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-blue transition-all cursor-pointer">
                <input 
                  required
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <Upload className="mx-auto text-gray-400" size={32} />
                  <p className="text-sm text-gray-500">
                    {screenshot ? screenshot.name : "اضغط هنا لرفع لقطة شاشة للتحويل"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">ملاحظات إضافية</label>
              <textarea 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-brand-blue outline-none h-20"
                placeholder="أي ملاحظات تود إضافتها للطلب..."
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <button 
              type="submit"
              disabled={isUploading}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              ) : (
                <>
                  <CreditCard className="h-6 w-6" />
                  تأكيد الطلب والدفع
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Order Summary Section */}
        <div className="space-y-8">
          <div className="bg-brand-blue text-white p-8 rounded-2xl shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <ShoppingBag />
              ملخص الطلب
            </h3>
            
            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map(item => (
                <div key={item.productId} className="flex justify-between items-center bg-white/10 p-4 rounded-lg">
                  <div className="flex gap-4">
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      className="w-16 h-16 object-cover rounded-md"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-bold text-sm">{item.product.name}</h4>
                      <p className="text-xs opacity-70">الكمية: {item.quantity}</p>
                      {item.selectedSize && <p className="text-xs opacity-70">المقاس: {item.selectedSize}</p>}
                    </div>
                  </div>
                  <span className="font-bold">{(item.product.price * item.quantity).toLocaleString()} SDG</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-white/20 pt-6">
              <div className="flex justify-between opacity-80">
                <span>المجموع الفرعي:</span>
                <span>{subtotal.toLocaleString()} SDG</span>
              </div>
              <div className="flex justify-between opacity-80">
                <span>تكلفة الشحن:</span>
                <span>{shippingCost > 0 ? `${shippingCost.toLocaleString()} SDG` : "سيتم حسابه"}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-4 border-t border-white/20">
                <span>الإجمالي الكلي:</span>
                <span>{(subtotal + shippingCost).toLocaleString()} SDG</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-blue-800 text-sm flex gap-4">
            <Info className="flex-shrink-0" />
            <div>
              <p className="font-bold mb-2">تعليمات الدفع:</p>
              <p>يرجى تحويل المبلغ الإجمالي إلى الحساب المذكور أعلاه ورفع لقطة شاشة للتحويل لتأكيد طلبك. سيتم مراجعة الدفع من قبل الإدارة قبل شحن الطلب.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
