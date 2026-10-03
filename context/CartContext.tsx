'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { OrderItem, OrderExtra } from '@/types/supabase';

export interface ComplimentaryTreat {
  id: string;
  name: string;
  quantityText: string;
  priceText: string;
  imageUrl: string;
}

/**
 * Helper function to check if a 'Biryani' category item exists in a cart list.
 */
export function checkBiryaniInCart(cartItems: OrderItem[]): boolean {
  if (!cartItems || cartItems.length === 0) return false;
  return cartItems.some(
    (item) =>
      (item.product_id && item.product_id.startsWith('biryani-')) ||
      (item.name && item.name.toLowerCase().includes('biryani'))
  );
}

/**
 * Helper function that returns the corresponding free complimentary item configuration
 * (Raita, Shahi Tukda, Healthy Surprise) calculated from Biryanis in the cart based on size (500g/1kg).
 */
export function getComplimentaryItemsForCart(cartItems: OrderItem[]): ComplimentaryTreat[] {
  if (!cartItems || cartItems.length === 0) return [];

  let raitaMl = 0;
  let shahiTukdaPcs = 0;
  let healthySurpriseG = 0;

  for (const item of cartItems) {
    const isBiryani =
      (item.product_id && item.product_id.startsWith('biryani-')) ||
      (item.name && item.name.toLowerCase().includes('biryani'));

    if (isBiryani) {
      const is1kg =
        item.size.toLowerCase().includes('1kg') ||
        item.size.toLowerCase().includes('1 kg');

      const qty = item.quantity || 1;

      if (is1kg) {
        raitaMl += 200 * qty;
        shahiTukdaPcs += 4 * qty;
        healthySurpriseG += 5 * qty;
      } else {
        raitaMl += 100 * qty;
        shahiTukdaPcs += 2 * qty;
        healthySurpriseG += 3 * qty;
      }
    }
  }

  if (raitaMl === 0) return [];

  return [
    {
      id: 'comp-mint-raita',
      name: 'Signature Mint Raita',
      quantityText: `${raitaMl} ml`,
      priceText: 'FREE',
      imageUrl:
        'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: 'comp-shahi-tukda',
      name: 'The Encore (Shahi Tukda)',
      quantityText: `${shahiTukdaPcs} pieces`,
      priceText: 'FREE',
      imageUrl:
        'https://images.unsplash.com/photo-1605197161470-5b82269c5e53?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: 'comp-healthy-surprise',
      name: 'Healthy Surprise',
      quantityText: `${healthySurpriseG}g`,
      priceText: 'FREE',
      imageUrl:
        'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=300&auto=format&fit=crop',
    },
  ];
}

/**
 * Helper function that returns complimentary configuration for a single Biryani portion size.
 */
export function getComplimentaryConfigForSize(size: string, quantity: number = 1): ComplimentaryTreat[] {
  const is1kg = size.toLowerCase().includes('1kg') || size.toLowerCase().includes('1 kg');
  const raitaMl = is1kg ? 200 * quantity : 100 * quantity;
  const shahiTukdaPcs = is1kg ? 4 * quantity : 2 * quantity;
  const healthySurpriseG = is1kg ? 5 * quantity : 3 * quantity;

  return [
    {
      id: 'comp-mint-raita',
      name: 'Signature Mint Raita',
      quantityText: `${raitaMl} ml`,
      priceText: 'FREE',
      imageUrl:
        'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: 'comp-shahi-tukda',
      name: 'The Encore (Shahi Tukda)',
      quantityText: `${shahiTukdaPcs} pieces`,
      priceText: 'FREE',
      imageUrl:
        'https://images.unsplash.com/photo-1605197161470-5b82269c5e53?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: 'comp-healthy-surprise',
      name: 'Healthy Surprise',
      quantityText: `${healthySurpriseG}g`,
      priceText: 'FREE',
      imageUrl:
        'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=300&auto=format&fit=crop',
    },
  ];
}

interface CartItem extends OrderItem {}

interface CartContextType {
  cart: CartItem[];
  extras: OrderExtra[];
  complimentaryTreats: ComplimentaryTreat[];
  hasBiryaniInCart: boolean;
  getComplimentaryItems: (customCart?: OrderItem[]) => ComplimentaryTreat[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: {
    productId: string;
    name: string;
    size: string;
    price: number;
    imageUrl?: string;
    quantity?: number;
  }) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  toggleExtra: (extra: { id: string; name: string; price: number }) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;
  totalItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [extras, setExtras] = useState<OrderExtra[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('vediq_cart');
      const savedExtras = localStorage.getItem('vediq_cart_extras');
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedExtras) setExtras(JSON.parse(savedExtras));
    } catch {
      // ignore JSON parse errors
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vediq_cart', JSON.stringify(cart));
      localStorage.setItem('vediq_cart_extras', JSON.stringify(extras));
    } catch {
      // ignore
    }
  }, [cart, extras]);

  const addToCart = (item: {
    productId: string;
    name: string;
    size: string;
    price: number;
    imageUrl?: string;
    quantity?: number;
  }) => {
    const qtyToAdd = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const existingIndex = cart.findIndex(
      (c) => c.product_id === item.productId && c.size === item.size
    );

    if (existingIndex > -1) {
      setCart((prev) =>
        prev.map((c, idx) =>
          idx === existingIndex
            ? { ...c, quantity: c.quantity + qtyToAdd, total: (c.quantity + qtyToAdd) * c.price }
            : c
        )
      );
    } else {
      const newItem: CartItem = {
        id: `${item.productId}-${item.size}-${Date.now()}`,
        product_id: item.productId,
        name: item.name,
        size: item.size,
        price: item.price,
        quantity: qtyToAdd,
        total: item.price * qtyToAdd,
        image_url: item.imageUrl,
      };
      setCart((prev) => [...prev, newItem]);
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id === cartItemId) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            return { ...c, quantity: newQty, total: newQty * c.price };
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const toggleExtra = (extra: { id: string; name: string; price: number }) => {
    setExtras((prev) => {
      const exists = prev.find((e) => e.id === extra.id);
      if (exists) {
        return prev.filter((e) => e.id !== extra.id);
      } else {
        return [
          ...prev,
          {
            id: extra.id,
            name: extra.name,
            price: extra.price,
            quantity: 1,
            total: extra.price,
          },
        ];
      }
    });
  };

  const clearCart = () => {
    setCart([]);
    setExtras([]);
    try {
      localStorage.removeItem('vediq_cart');
      localStorage.removeItem('vediq_cart_extras');
    } catch {
      // ignore
    }
  };

  const complimentaryTreats = useMemo<ComplimentaryTreat[]>(() => {
    let raitaMl = 0;
    let shahiTukdaPcs = 0;
    let healthySurpriseG = 0;

    for (const item of cart) {
      const isBiryani =
        (item.product_id && item.product_id.startsWith('biryani-')) ||
        item.name.toLowerCase().includes('biryani');

      if (isBiryani) {
        const is1kg =
          item.size.toLowerCase().includes('1kg') ||
          item.size.toLowerCase().includes('1 kg');

        const qty = item.quantity || 1;

        if (is1kg) {
          raitaMl += 200 * qty;
          shahiTukdaPcs += 4 * qty;
          healthySurpriseG += 5 * qty;
        } else {
          raitaMl += 100 * qty;
          shahiTukdaPcs += 2 * qty;
          healthySurpriseG += 3 * qty;
        }
      }
    }

    if (raitaMl === 0) return [];

    return [
      {
        id: 'comp-mint-raita',
        name: 'Signature Mint Raita',
        quantityText: `${raitaMl} ml`,
        priceText: 'FREE',
        imageUrl:
          'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=300&auto=format&fit=crop',
      },
      {
        id: 'comp-shahi-tukda',
        name: 'The Encore (Shahi Tukda)',
        quantityText: `${shahiTukdaPcs} pieces`,
        priceText: 'FREE',
        imageUrl:
          'https://images.unsplash.com/photo-1605197161470-5b82269c5e53?q=80&w=300&auto=format&fit=crop',
      },
      {
        id: 'comp-healthy-surprise',
        name: 'Healthy Surprise',
        quantityText: `${healthySurpriseG}g`,
        priceText: 'FREE',
        imageUrl:
          'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=300&auto=format&fit=crop',
      },
    ];
  }, [cart]);

  const subtotal = useMemo(() => {
    const itemsTotal = cart.reduce((sum, item) => sum + item.total, 0);
    const extrasTotal = extras.reduce((sum, extra) => sum + extra.total, 0);
    return itemsTotal + extrasTotal;
  }, [cart, extras]);

  // Free delivery for orders >= 599, else ₹49
  const deliveryCharge = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal >= 599 ? 0 : 49;
  }, [subtotal]);

  // 10% instant promo discount on subtotal > 999
  const discount = useMemo(() => {
    if (subtotal >= 1000) return Math.round(subtotal * 0.1);
    return 0;
  }, [subtotal]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + deliveryCharge - discount);
  }, [subtotal, deliveryCharge, discount]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const hasBiryaniInCart = useMemo(() => {
    return checkBiryaniInCart(cart);
  }, [cart]);

  const getComplimentaryItems = (customCart?: OrderItem[]) => {
    return getComplimentaryItemsForCart(customCart || cart);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        extras,
        complimentaryTreats,
        hasBiryaniInCart,
        getComplimentaryItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleExtra,
        clearCart,
        subtotal,
        deliveryCharge,
        discount,
        grandTotal,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
