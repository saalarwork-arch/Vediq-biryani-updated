'use client';

import React from 'react';
import CartDrawer from './CartDrawer';
import OrderSuccessModal from './OrderSuccessModal';
import TrackOrder from './TrackOrder';

export default function OrderingSystem() {
  return (
    <>
      <CartDrawer />
      <OrderSuccessModal />
      <TrackOrder />
    </>
  );
}
