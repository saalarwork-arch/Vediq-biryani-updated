'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Check,
  Sparkles,
  MapPin,
  Navigation,
  Compass,
  Home,
  Briefcase,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  Building,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useData } from '@/context/DataContext';
import { EXTRA_ITEMS } from '@/data/menuData';
import { formatINR } from '@/lib/utils';
import { generateTrackingCode } from '@/lib/tracking';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { CustomerOrder, SavedDeliveryAddress } from '@/types/supabase';
import GoogleAddressAutocomplete, { AddressSelectionData } from '@/components/GoogleAddressAutocomplete';
import { isCoordinateInDelhiNcr, DELHI_NCR_UNSUPPORTED_MESSAGE } from '@/lib/delhiNcrValidation';
import LocationPickerModal from '@/components/LocationPickerModal';
import SavedAddressesModal from '@/components/SavedAddressesModal';
import { getSavedAddresses, reverseGeocodeCoordinates } from '@/lib/addressStorage';

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
  const [houseBuilding, setHouseBuilding] = useState('');
  const [roadArea, setRoadArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('Standard (45-60 mins)');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [customerNotes, setCustomerNotes] = useState('');

  // Delhi NCR Google Places validation state
  const [addressSelection, setAddressSelection] = useState<AddressSelectionData | null>(null);
  const [isDeliveryAreaValid, setIsDeliveryAreaValid] = useState<boolean | null>(null);

  // Saved Addresses & Location Picker Modals State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [savedAddressesList, setSavedAddressesList] = useState<SavedDeliveryAddress[]>([]);
  const [activeSavedAddress, setActiveSavedAddress] = useState<SavedDeliveryAddress | null>(null);

  // GPS Location Button State
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Load saved delivery addresses on open
  useEffect(() => {
    if (isCartOpen) {
      getSavedAddresses().then((list) => {
        setSavedAddressesList(list);
        if (!activeSavedAddress && !fullAddress && list.length > 0) {
          const defaultAddr = list.find((a) => a.is_default) || list[0];
          applyAddressSelection(defaultAddr);
        }
      });
    }
  }, [isCartOpen]);

  // Helper to apply a selected address
  const applyAddressSelection = (addr: SavedDeliveryAddress) => {
    setActiveSavedAddress(addr);
    setFullAddress(addr.formatted_address);
    setHouseBuilding(addr.house_building || '');
    setRoadArea(addr.road_area_colony || '');
    setLandmark(addr.landmark || '');
    setPincode(addr.pincode || '');
    if (addr.delivery_instructions) {
      setDeliveryInstructions(addr.delivery_instructions);
    }

    const isValid = addr.is_delhi_ncr ?? isCoordinateInDelhiNcr(addr.latitude, addr.longitude);
    setIsDeliveryAreaValid(isValid);

    setAddressSelection({
      fullAddress: addr.formatted_address,
      lat: addr.latitude,
      lng: addr.longitude,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isValidDeliveryArea: isValid,
    });

    if (!isValid) {
      setFormError(DELHI_NCR_UNSUPPORTED_MESSAGE);
    } else {
      setFormError('');
    }
  };

  // Prominent "Use My Current Location" Handler (Tapped explicitly by customer)
  const handleUseCurrentLocation = () => {
    setGpsError(null);
    setFormError('');

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser. Please select your address on the map.');
      return;
    }

    setIsLocatingGPS(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const geo = await reverseGeocodeCoordinates(lat, lng);
          const isValid = isCoordinateInDelhiNcr(lat, lng);

          setIsDeliveryAreaValid(isValid);
          setAddressSelection({
            fullAddress: geo.formatted_address,
            lat,
            lng,
            city: geo.city,
            state: geo.state,
            pincode: geo.pincode,
            isValidDeliveryArea: isValid,
          });

          setFullAddress(geo.formatted_address);
          if (geo.road_area_colony) setRoadArea(geo.road_area_colony);
          if (geo.pincode) setPincode(geo.pincode);

          setActiveSavedAddress({
            id: `current-gps-${Date.now()}`,
            tag: 'Other',
            custom_tag: 'Current GPS Location',
            house_building: '',
            road_area_colony: geo.road_area_colony || '',
            city: geo.city || 'Delhi NCR',
            state: geo.state || 'Delhi',
            pincode: geo.pincode || '110001',
            formatted_address: geo.formatted_address,
            latitude: lat,
            longitude: lng,
            is_delhi_ncr: isValid,
            created_at: new Date().toISOString(),
          });

          if (!isValid) {
            setFormError(DELHI_NCR_UNSUPPORTED_MESSAGE);
          } else {
            setFormError('');
          }
        } catch (err: any) {
          setGpsError('Failed to fetch address for current coordinates. Please select your location on the map.');
        } finally {
          setIsLocatingGPS(false);
        }
      },
      (err) => {
        setIsLocatingGPS(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Please search your address or drop a pin manually on the map.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError('GPS location unavailable. Please pick your address manually on the map.');
        } else {
          setGpsError('Unable to detect GPS location. Please pick your address on the map.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

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
      // Frontend check against Delhi NCR boundary
      if (isDeliveryAreaValid === false) {
        setFormError(DELHI_NCR_UNSUPPORTED_MESSAGE);
        setIsSubmitting(false);
        return;
      }

      let finalOrderData = newOrder;

      // 1. Submit through backend API route for strict server-side Delhi NCR validation
      const combinedNotes = [
        deliveryInstructions.trim() ? `Valet: ${deliveryInstructions.trim()}` : '',
        customerNotes.trim() ? `Note: ${customerNotes.trim()}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const orderPayload = {
        ...newOrder,
        latitude: addressSelection?.lat || activeSavedAddress?.latitude,
        longitude: addressSelection?.lng || activeSavedAddress?.longitude,
        house_building: houseBuilding.trim() || activeSavedAddress?.house_building,
        road_area_colony: roadArea.trim() || activeSavedAddress?.road_area_colony,
        city: addressSelection?.city || activeSavedAddress?.city || 'Delhi NCR',
        state: addressSelection?.state || activeSavedAddress?.state || 'Delhi',
        pincode: pincode.trim() || addressSelection?.pincode || activeSavedAddress?.pincode || '110001',
        full_address: fullAddress.trim(),
        customer_notes: combinedNotes || undefined,
        is_delhi_ncr: true,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const resData = await res.json();

      if (!res.ok) {
        setFormError(resData.error || DELHI_NCR_UNSUPPORTED_MESSAGE);
        setIsSubmitting(false);
        return;
      }

      if (resData.order) {
        finalOrderData = resData.order as CustomerOrder;
      } else if (isSupabaseConfigured()) {
        try {
          const { data: directData } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', newOrder.order_number)
            .maybeSingle();
          if (directData) finalOrderData = directData as CustomerOrder;
        } catch {
          // ignore
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

                  {/* Smart Delivery Address Section (Swiggy / Zomato Style) */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[#F5F1E8] font-bold text-xs flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C9A24A]" />
                        <span>Delivery Address (Delhi NCR Only) *</span>
                      </label>
                      {isDeliveryAreaValid === true && (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Delhi NCR Verified</span>
                        </span>
                      )}
                    </div>

                    {/* GPS Error Banner */}
                    {gpsError && (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p>{gpsError}</p>
                          <button
                            type="button"
                            onClick={() => setIsLocationModalOpen(true)}
                            className="text-[11px] font-bold text-[#E2C56B] underline hover:text-white"
                          >
                            Open Map &amp; Search Address Instead
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Primary Location Action Buttons */}
                    <div className="space-y-2">
                      {/* 1. Prominent "Use My Current Location" Button */}
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocatingGPS}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#C9A24A]/20 to-amber-500/15 hover:from-amber-500/25 hover:to-[#C9A24A]/30 border border-[#C9A24A]/60 hover:border-[#C9A24A] text-[#F5F1E8] font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
                      >
                        {isLocatingGPS ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#E2C56B]" />
                            <span>Detecting your GPS location...</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4 text-[#E2C56B] animate-pulse" />
                            <span>Use My Current Location (GPS)</span>
                          </>
                        )}
                      </button>

                      {/* 2. Map Pin & Saved Addresses Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setIsLocationModalOpen(true)}
                          className="py-2 px-3 rounded-xl bg-[#07111F] hover:bg-[#101F35] border border-[#1C2D4A] hover:border-[#C9A24A]/50 text-xs font-bold text-[#AAB4C2] hover:text-[#F5F1E8] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Compass className="w-3.5 h-3.5 text-[#C9A24A]" />
                          <span>Pick on Map / Search</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsSavedModalOpen(true)}
                          className="py-2 px-3 rounded-xl bg-[#07111F] hover:bg-[#101F35] border border-[#1C2D4A] hover:border-[#C9A24A]/50 text-xs font-bold text-[#AAB4C2] hover:text-[#F5F1E8] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-[#E2C56B]" />
                          <span>
                            Saved Addresses
                            {savedAddressesList.length > 0 && ` (${savedAddressesList.length})`}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Confirmed Delivery Address Card (Swiggy / Zomato Style) */}
                    {fullAddress ? (
                      <div className="p-3.5 rounded-2xl bg-[#07111F] border border-[#1C2D4A] space-y-2.5 text-xs shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-[#C9A24A]/20 text-[#E2C56B] text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 border border-[#C9A24A]/30">
                              {activeSavedAddress?.tag === 'Home' ? (
                                <Home className="w-2.5 h-2.5" />
                              ) : activeSavedAddress?.tag === 'Work' ? (
                                <Briefcase className="w-2.5 h-2.5" />
                              ) : (
                                <MapPin className="w-2.5 h-2.5" />
                              )}
                              <span>{activeSavedAddress?.custom_tag || activeSavedAddress?.tag || 'Delivery Pin'}</span>
                            </span>

                            {isDeliveryAreaValid === true ? (
                              <span className="text-[10px] font-bold text-emerald-400">
                                ✓ Delhi NCR
                              </span>
                            ) : isDeliveryAreaValid === false ? (
                              <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Outside Service Area</span>
                              </span>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsLocationModalOpen(true)}
                            className="text-[11px] font-bold text-[#E2C56B] hover:text-white underline cursor-pointer"
                          >
                            Change Pin
                          </button>
                        </div>

                        {/* Complete Address Text */}
                        <div className="space-y-0.5">
                          {houseBuilding && (
                            <p className="font-bold text-sm text-[#F5F1E8] leading-tight">
                              {houseBuilding}
                            </p>
                          )}
                          <p className="text-[#AAB4C2] leading-relaxed text-xs">
                            {fullAddress}
                          </p>
                        </div>

                        {/* Coordinates & Landmark Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1C2D4A]/80 text-[11px]">
                          {(addressSelection?.lat || activeSavedAddress?.latitude) && (
                            <span className="text-[#7E8B9B] font-mono text-[10px] flex items-center gap-1 bg-[#101F35] px-2 py-0.5 rounded-md border border-[#1C2D4A]">
                              <Navigation className="w-2.5 h-2.5 text-[#E2C56B]" />
                              <span>
                                GPS:{' '}
                                {(addressSelection?.lat || activeSavedAddress?.latitude)?.toFixed(4)},{' '}
                                {(addressSelection?.lng || activeSavedAddress?.longitude)?.toFixed(4)}
                              </span>
                            </span>
                          )}

                          {landmark && (
                            <span className="text-[#AAB4C2] text-[10px]">
                              Near: <span className="text-[#F5F1E8] font-semibold">{landmark}</span>
                            </span>
                          )}

                          {deliveryInstructions && (
                            <p className="w-full text-amber-300 text-[11px] italic bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                              Valet note: &ldquo;{deliveryInstructions}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Address Search Autocomplete Input when no address picked yet */
                      <div>
                        <GoogleAddressAutocomplete
                          value={fullAddress}
                          onChange={setFullAddress}
                          onAddressSelect={(data) => {
                            setAddressSelection(data);
                            setIsDeliveryAreaValid(data.isValidDeliveryArea);
                            if (data.pincode && !pincode) {
                              setPincode(data.pincode);
                            }
                            if (!data.isValidDeliveryArea) {
                              setFormError(DELHI_NCR_UNSUPPORTED_MESSAGE);
                            } else {
                              setFormError('');
                            }
                          }}
                          onValidationChange={(isValid) => {
                            setIsDeliveryAreaValid(isValid);
                            if (!isValid) {
                              setFormError(DELHI_NCR_UNSUPPORTED_MESSAGE);
                            } else {
                              setFormError('');
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Detailed House/Flat and Valet Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[#AAB4C2] text-[11px] font-semibold mb-1">
                          House / Flat / Floor / Building *
                        </label>
                        <input
                          type="text"
                          required
                          value={houseBuilding}
                          onChange={(e) => setHouseBuilding(e.target.value)}
                          placeholder="e.g. Flat 402, Tower C"
                          className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] focus:bg-[#101F35] shadow-xs text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[#AAB4C2] text-[11px] font-semibold mb-1">
                          Nearby Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. Near Metro Gate 3"
                          className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] focus:bg-[#101F35] shadow-xs text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#AAB4C2] text-[11px] font-semibold mb-1">
                        Delivery Instructions for Valet (Optional)
                      </label>
                      <input
                        type="text"
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        placeholder="e.g. Ring bell, leave with security guard, do not call"
                        className="w-full px-3 py-2 rounded-xl bg-[#07111F] border border-[#1C2D4A] text-[#F5F1E8] placeholder-[#7E8B9B] focus:outline-none focus:border-[#C9A24A] focus:bg-[#101F35] shadow-xs text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#F5F1E8] font-bold mb-1">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="e.g. 110001"
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
              disabled={isSubmitting || isDeliveryAreaValid === false || !fullAddress.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] disabled:opacity-50 disabled:cursor-not-allowed text-[#07111F] font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(201,162,74,0.3)] active:scale-98 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Placing Royal Order...</span>
              ) : isDeliveryAreaValid === false ? (
                <span>Delhi NCR Delivery Only</span>
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

      {/* Interactive Location Picker Modal (Google Maps + Draggable Pin + Form) */}
      {isLocationModalOpen && (
        <LocationPickerModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          initialAddress={activeSavedAddress}
          onAddressConfirmed={(addr) => {
            applyAddressSelection(addr);
            // Refresh saved addresses
            getSavedAddresses().then((list) => setSavedAddressesList(list));
          }}
        />
      )}

      {/* Saved Addresses Modal */}
      {isSavedModalOpen && (
        <SavedAddressesModal
          isOpen={isSavedModalOpen}
          onClose={() => setIsSavedModalOpen(false)}
          currentSelectedId={activeSavedAddress?.id}
          onSelectAddress={(addr) => {
            applyAddressSelection(addr);
          }}
          onAddNewAddress={() => {
            setIsSavedModalOpen(false);
            setIsLocationModalOpen(true);
          }}
          onEditAddress={(addr) => {
            setActiveSavedAddress(addr);
            setIsSavedModalOpen(false);
            setIsLocationModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
