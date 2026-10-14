'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Home,
  Briefcase,
  Compass,
  Plus,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import { SavedDeliveryAddress, AddressTag } from '@/types/supabase';
import {
  getSavedAddresses,
  deleteDeliveryAddress,
  saveDeliveryAddress,
} from '@/lib/addressStorage';

interface SavedAddressesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: SavedDeliveryAddress) => void;
  onAddNewAddress: () => void;
  onEditAddress: (address: SavedDeliveryAddress) => void;
  currentSelectedId?: string;
}

export default function SavedAddressesModal({
  isOpen,
  onClose,
  onSelectAddress,
  onAddNewAddress,
  onEditAddress,
  currentSelectedId,
}: SavedAddressesModalProps) {
  const [addresses, setAddresses] = useState<SavedDeliveryAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const list = await getSavedAddresses();
      setAddresses(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAddresses();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this saved address?')) {
      await deleteDeliveryAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const getTagIcon = (tag: AddressTag) => {
    switch (tag) {
      case 'Home':
        return <Home className="w-3.5 h-3.5" />;
      case 'Work':
        return <Briefcase className="w-3.5 h-3.5" />;
      default:
        return <Compass className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C9A24A]/15 text-[#B8860B] flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-tight">
                Saved Delivery Addresses
              </h3>
              <p className="text-[11px] text-gray-500">
                Select where you want your hot dum biryani delivered
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close saved addresses modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Saved Addresses */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-xs text-gray-400">
              Loading your saved addresses...
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#B8860B] flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <p className="text-xs text-gray-500">
                No saved addresses found. Add your first delivery address below.
              </p>
            </div>
          ) : (
            addresses.map((addr) => {
              const isSelected = addr.id === currentSelectedId;
              return (
                <div
                  key={addr.id}
                  onClick={() => {
                    onSelectAddress(addr);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative group ${
                    isSelected
                      ? 'bg-amber-50/70 border-[#C9A24A] shadow-xs ring-1 ring-[#C9A24A]'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-[11px] font-bold flex items-center gap-1.5">
                        {getTagIcon(addr.tag)}
                        <span>{addr.custom_tag || addr.tag}</span>
                      </span>

                      {isSelected && (
                        <span className="text-[11px] font-bold text-[#B8860B] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAddress(addr);
                          onClose();
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                        title="Edit Address"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(addr.id, e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete Address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs text-gray-700">
                    <p className="font-bold text-gray-900 text-sm">
                      {addr.house_building}
                    </p>
                    <p className="text-gray-600">
                      {addr.road_area_colony}
                      {addr.landmark ? `, Near ${addr.landmark}` : ''}
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono">
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    {addr.delivery_instructions && (
                      <p className="text-[11px] text-amber-800 italic pt-1">
                        &ldquo;{addr.delivery_instructions}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Add New Address */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 shrink-0">
          <button
            type="button"
            onClick={() => {
              onAddNewAddress();
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#C9A24A] to-[#B89033] hover:from-[#D4AF37] hover:to-[#C9A24A] text-slate-900 font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Delivery Location (Map Pin)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
