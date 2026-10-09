'use client';

import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Check, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useData } from '@/context/DataContext';
import { EXTRA_ITEMS } from '@/data/menuData';
import { formatINR } from '@/lib/utils';
import { generateTrackingCode } from '@/lib/tracking';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { CustomerOrder } from '@/types/supabase';

export default function CartDrawer() {
  const {
    cart,
    extras,
    complimentaryTreats,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    toggleExtra,
    clearCart,
    subtotal,
    deliveryCharge,
    discount,
    grandTotal,
    totalItemsCount,
  } = useCart();

  const { setOrderSuccessData } = useData();

  // Checkout form fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('Standard (45-60 mins)');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [customerNotes, setCustomerNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isCartOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (cart.length === 0) {
      setFormError('Your cart is empty. Please add items to order.');
      return;
    }

    if (!customerName.trim() || !phone.trim() || !fullAddress.trim()) {
      setFormError('Please fill in your name, phone number, and delivery address.');
      return;
    }

    if (phone.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);

    const generatedTrackingCode = generateTrackingCode();

    const newOrder: CustomerOrder = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `order-${Date.now()}`,
      order_number: generatedTrackingCode,
      tracking_code: generatedTrackingCode,
      customer_name: customerName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      full_address: fullAddress.trim(),
      pincode: pincode.trim() || undefined,
      delivery_time: deliveryTime,
      items: cart,
      extras: extras,
      complimentary_items: complimentaryTreats.map((t) => ({
        name: t.name,
        quantityText: t.quantityText,
      })),
      subtotal: subtotal,
      delivery_charge: deliveryCharge,
      discount: discount,
      total: grandTotal,
      order_status: 'pending',
      payment_method: paymentMethod,
      payment_status: 'pending',
      customer_notes: customerNotes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    try {
      let finalOrderData = newOrder;

      if (isSupabaseConfigured()) {
        try {
          const { data: directData, error } = await supabase.from('orders').insert([
            {
              order_number: newOrder.order_number,
              customer_name: newOrder.customer_name,
              phone: newOrder.phone,
              email: newOrder.email,
              full_address: newOrder.full_address,
              house_building: newOrder.house_building || null,
              road_area_colony: newOrder.road_area_colony || null,
              city: newOrder.city || 'Ghaziabad',
              state: newOrder.state || 'Uttar Pradesh',
              pincode: newOrder.pincode || '201012',
              delivery_date: newOrder.delivery_date || null,
              delivery_time: newOrder.delivery_time,
              items: newOrder.items,
              extras: newOrder.extras,
              complimentary_items: newOrder.complimentary_items,
              subtotal: newOrder.subtotal,
              delivery_charge: newOrder.delivery_charge,
              discount: newOrder.discount,
              total: newOrder.total,
              order_status: newOrder.order_status,
              payment_method: newOrder.payment_method,
              payment_status: newOrder.payment_status,
              customer_notes: newOrder.customer_notes,
            },
          ]).select().maybeSingle();

          if (error) {
            console.warn('Supabase order insert warning:', error.message);
          } else if (directData) {
            finalOrderData = directData as CustomerOrder;
          }
        } catch (dbErr) {
          console.warn('[CartDrawer] Direct Supabase insert exception:', dbErr);
        }
      }

      // Store in local active orders list for guest tracking & history
      try {
        const storedOrders: CustomerOrder[] = JSON.parse(localStorage.getItem('vediq_user_orders') || '[]');
        const updatedOrders = [finalOrderData, ...storedOrders.filter((o) => o.order_number !== finalOrderData.order_number)];
        localStorage.setItem('vediq_user_orders', JSON.stringify(updatedOrders));
      } catch {
        // ignore
      }

      setOrderSuccessData(finalOrderData);
      clearCart();
      setIsCartOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 w-full max-w-full overflow-x-hidden">
      <div
        className="w-full max-w-lg bg-[#0A1628] border-l border-[#1C2D4A] h-full flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#1C2D4A] flex items-center justify-between bg-[#07111F]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#C9A24A]" />
            <h2 className="font-serif text-lg font-bold text-[#F5F1E8]">Your Royal Cart</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#101F35] text-[#E2C56B] font-bold border border-[#C9A24A]/40">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-xl text-[#7E8B9B] hover:text-[#F5F1E8] hover:bg-[#101F35] transition cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ShoppingBag className="w-12 h-12 text-[#1C2D4A] mx-auto" />
              <h3 className="text-base font-bold text-[#F5F1E8]">Your cart is empty</h3>
              <p className="text-xs text-[#AAB4C2] max-w-xs mx-auto">
                Explore our authentic slow-cooked dum biryanis and royal delicacies.
              </p>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7E8B9B]">
                  Selected Biryanis & Delicacies
                </span>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#101F35] border border-[#1C2D4A] flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#F5F1E8] truncate">{item.name}</h4>
                      <div className="text-[11px] text-[#AAB4C2]">
                        {item.size} • <span className="font-bold text-[#E2C56B]">₹{item.price}</span>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 bg-[#0A1628] px-2 py-1 rounded-xl border border-[#1C2D4A] shadow-xs">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 text-[#AAB4C2] hover:text-[#F5F1E8] transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-[#F5F1E8] w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 text-[#AAB4C2] hover:text-[#F5F1E8] transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line total & remove */}
                    <div className="text-right flex items-center gap-2.5">
                      <span className="text-xs font-bold text-[#F5F1E8]">₹{item.total}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-[#EF4444] hover:bg-[#FEF2F2]/10 rounded-lg transition cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Complimentary Treats Section */}
              {complimentaryTreats.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#101F35] to-[#07111F] border border-[#C9A24A]/40 space-y-3 shadow-md animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-[#E2C56B]">
                      <Sparkles className="w-4 h-4 text-[#C9A24A]" />
                      <span>Your Complimentary Treats 🎁</span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#C9A24A]/20 text-[#E2C56B] border border-[#C9A24A]/40">
                      Free With Biryani
                    </span>
                  </div>

                  <div className="space-y-2">
                    {complimentaryTreats.map((treat) => (
                      <div
                        key={treat.id}
                        className="p-2.5 rounded-xl bg-[#0A1628] border border-[#1C2D4A] flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={treat.imageUrl}
                            alt={treat.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[#1C2D4A] shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-[#F5F1E8] truncate">{treat.name}</h5>
                            <p className="text-[10px] text-[#AAB4C2]">
                              Quantity: <span className="font-bold text-[#E2C56B]">{treat.quantityText}</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#C9A24A]/20 text-[#E2C56B] border border-[#C9A24A]/40 shrink-0">
                          {treat.priceText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra Addons */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7E8B9B]">
                  Pair With Royal Extras & Salans
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXTRA_ITEMS.map((extra) => {
                    const isSelected = extras.some((e) => e.id === extra.id);
                    return (
                      <button
                        key={extra.id}
                        type="button"
                        onClick={() => toggleExtra(extra)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer shadow-xs ${
                          isSelected
                            ? 'bg-[#101F35] border-[#C9A24A] text-[#F5F1E8]'
                            : 'bg-[#07111F] border-[#1C2D4A] text-[#AAB4C2] hover:bg-[#101F35] hover:text-[#F5F1E8]'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <div className="text-[11px] font-bold truncate">{extra.name}</div>
                          <div className="text-[10px] text-[#E2C56B] font-semibold">₹{extra.price}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#C9A24A] border-[#C9A24A] text-[#07111F]'
                              : 'border-[#1C2D4A] bg-[#0A1628]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Details Form */}
              <form onSubmit={handleSubmitOrder} id="cart-checkout-form" className="space-y-4 pt-3 border-t border-[#1C2D4A]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7E8B9B]">
                  Delivery Address & Contact
                </span>

                {formError && (
                  <div className="p-3 rounded-xl bg-[#FEF2F2]/10 border border-[#EF4444]/40 text-xs font-semibold text-[#F87171]">
                    {formError}
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[#F5F1E8] font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Yashvardhan Mehta"
                      className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] focus:bg-[#101F35] shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#F5F1E8] font-bold mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit number"
                        className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] focus:bg-[#101F35] shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#F5F1E8] font-bold mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="For receipt"
                        className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] focus:bg-[#101F35] shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#F5F1E8] font-bold mb-1">Delivery Address *</label>
                    <textarea
                      required
                      rows={2}
                      value={fullAddress}
                      onChange={(e) => setFullAddress(e.target.value)}
                      placeholder="House/Flat No, Landmark, Society/Street"
                      className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] focus:bg-[#101F35] shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#F5F1E8] font-bold mb-1">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="e.g. 380015"
                        className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] focus:bg-[#101F35] shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#F5F1E8] font-bold mb-1">Delivery Slot</label>
                      <select
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-[#F5F1E8] focus:outline-none focus:border-[#C9A24A] focus:bg-[#101F35] shadow-xs"
                      >
                        <option value="Standard (45-60 mins)">Instant Dum (45-60 mins)</option>
                        <option value="Lunch (12:30 PM - 02:00 PM)">Lunch (12:30 PM - 02:00 PM)</option>
                        <option value="Dinner (07:30 PM - 09:30 PM)">Dinner (07:30 PM - 09:30 PM)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#F5F1E8] font-bold mb-1">Payment Method</label>
                    <div className="p-3 rounded-xl bg-[#101F35] border border-[#C9A24A]/40 flex items-start gap-3 shadow-xs">
                      <div className="w-4 h-4 rounded-full border-2 border-[#C9A24A] flex items-center justify-center mt-0.5 shrink-0 bg-[#07111F]">
                        <div className="w-2 h-2 rounded-full bg-[#E2C56B]"></div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#E2C56B] text-xs">Cash on Delivery (COD)</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#07111F] text-emerald-400 border border-emerald-500/30">
                            Available
                          </span>
                        </div>
                        <p className="text-[11px] text-[#AAB4C2] leading-relaxed">
                          Pay with Cash or UPI upon delivery at your doorstep when your royal dum biryani arrives hot.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#F5F1E8] font-bold mb-1">Special Cooking Notes (Optional)</label>
                    <input
                      type="text"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="e.g. Mild spice, extra salan pouch"
                      className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] focus:bg-[#101F35] shadow-xs"
                    />
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer Summary & Place Order */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[#1C2D4A] bg-[#07111F] space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#AAB4C2]">
                <span>Item Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#AAB4C2]">
                <span>Delivery Charge</span>
                <span>{deliveryCharge === 0 ? <span className="text-[#E2C56B] font-bold">FREE</span> : formatINR(deliveryCharge)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#E2C56B] font-semibold">
                  <span>Royal 10% Discount</span>
                  <span>- {formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-[#F5F1E8] pt-2 border-t border-[#1C2D4A]">
                <span>Grand Total</span>
                <span className="text-base text-[#E2C56B]">{formatINR(grandTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              form="cart-checkout-form"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] disabled:opacity-50 text-[#07111F] font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(201,162,74,0.3)] active:scale-98 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Placing Royal Order...</span>
              ) : (
                <>
                  <span>Place Order • {formatINR(grandTotal)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
