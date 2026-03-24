import React from 'react';
import { CheckCircle2, Clock, Package, Truck } from 'lucide-react';
import { Order } from '../types';

interface OrderStatusStepsProps {
  status: Order['status'];
}

export default function OrderStatusSteps({ status }: OrderStatusStepsProps) {
  const steps = [
    { id: 'pending', label: 'قيد الانتظار', icon: Clock },
    { id: 'confirmed', label: 'تم التأكيد', icon: CheckCircle2 },
    { id: 'shipped', label: 'جاري التوصيل', icon: Truck },
    { id: 'delivered', label: 'تم التوصيل', icon: Package },
  ];

  const getStepIndex = (s: Order['status']) => {
    switch (s) {
      case 'pending': return 0;
      case 'confirmed':
      case 'processing': return 1;
      case 'out-for-delivery': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="w-full py-4" dir="rtl">
      <div className="flex justify-between items-center relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 right-0 h-0.5 bg-brand-blue -translate-y-1/2 z-0 transition-all duration-500" 
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive ? 'bg-brand-blue text-white scale-110 shadow-lg' : 'bg-white text-gray-300 border-2 border-gray-200'
                } ${isCurrent ? 'ring-4 ring-brand-blue/20' : ''}`}
              >
                <Icon size={16} />
              </div>
              <span className={`text-[10px] font-bold whitespace-nowrap ${isActive ? 'text-brand-blue' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
