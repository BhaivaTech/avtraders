// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home              from './pages/Home.jsx';
import Clinic            from './pages/Clinic.jsx';
import Distribution      from './pages/Distribution.jsx';
import Farmers           from './pages/Farmers.jsx';
import Dealers           from './pages/Dealers.jsx';
import Admin             from './pages/Admin.jsx';
import About             from './pages/About.jsx';
import Contact           from './pages/Contact.jsx';
import Terms             from './pages/Terms.jsx';
import Privacy           from './pages/Privacy.jsx';
import Refund            from './pages/Refund.jsx';
import ReturnPolicy      from './pages/Return.jsx';
import Shipping          from './pages/Shipping.jsx';
import QuoteDemo         from './pages/QuoteDemo.jsx';
import Guide             from './pages/Guide.jsx';
import GuideChapter      from './pages/GuideChapter.jsx';
import Products          from './pages/Products.jsx';
import Checkout          from './pages/Checkout.jsx';
import PaymentResult     from './pages/PaymentResult.jsx';
import PaymentIframe     from './pages/PaymentIframe.jsx';
import FarmerProfile     from './pages/FarmerProfile.jsx';
import AdminAnnouncements from './pages/AdminAnnouncements.jsx';
import NotFound          from './pages/NotFound.jsx';

import SiteHeader        from './components/SiteHeader.jsx';
import ErrorBoundary     from './components/ErrorBoundary.jsx';

export default function App() {
  return (
    <>
      <SiteHeader />
      <div className="container">
        <ErrorBoundary>
          <Routes>
            <Route path="/"                          element={<Home />} />
            <Route path="/clinic"                    element={<Clinic />} />
            <Route path="/distribution"              element={<Distribution />} />
            <Route path="/farmers"                   element={<Farmers />} />
            <Route path="/dealers"                   element={<Dealers />} />
            <Route path="/admin"                     element={<Admin />} />
            <Route path="/about"                     element={<About />} />
            <Route path="/contact"                   element={<Contact />} />
            <Route path="/terms-and-conditions"      element={<Terms />} />
            <Route path="/privacy-policy"            element={<Privacy />} />
            <Route path="/refund-policy"             element={<Refund />} />
            <Route path="/return-policy"             element={<ReturnPolicy />} />
            <Route path="/shipping-policy"           element={<Shipping />} />
            <Route path="/demo/quote/:token"         element={<QuoteDemo />} />
            <Route path="/guide"                     element={<Guide />} />
            <Route path="/guide/chapter/:slug"       element={<GuideChapter />} />
            <Route path="/products"                  element={<Products />} />
            <Route path="/checkout"                  element={<Checkout />} />
            <Route path="/payment-result"            element={<PaymentResult />} />
            <Route path="/payment/phonepe/iframe"    element={<PaymentIframe />} />
            <Route path="/farmers/profile"           element={<FarmerProfile />} />
            <Route path="/admin/announcements"       element={<AdminAnnouncements />} />
            {/* Catch-all: show 404 page for unknown URLs */}
            <Route path="*"                          element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </>
  );
}
