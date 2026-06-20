// src/App.jsx
// Top-level route table. Pages are loaded with React.lazy so the initial
// JS bundle stays small; a Suspense boundary shows a route-shaped skeleton
// while each chunk is fetched.

import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

import SiteHeader        from './components/SiteHeader.jsx';
import ErrorBoundary     from './components/ErrorBoundary.jsx';
import OfflineBanner     from './components/OfflineBanner.jsx';
import PageSkeleton      from './components/PageSkeleton.jsx';
import PwaInstallPrompt  from './components/PwaInstallPrompt.jsx';
import useScrollOnNavigate from './hooks/useScrollOnNavigate.js';

// Lazy-loaded route chunks. Each import() becomes its own JS file
// in the production build, so first paint does not pay for Admin,
// Checkout, or any of the heavier pages.
const Home               = lazy(() => import('./pages/Home.jsx'));
const Clinic             = lazy(() => import('./pages/Clinic.jsx'));
const Distribution       = lazy(() => import('./pages/Distribution.jsx'));
const Farmers            = lazy(() => import('./pages/Farmers.jsx'));
const Dealers            = lazy(() => import('./pages/Dealers.jsx'));
const Admin              = lazy(() => import('./pages/Admin.jsx'));
const About              = lazy(() => import('./pages/About.jsx'));
const Contact            = lazy(() => import('./pages/Contact.jsx'));
const Terms              = lazy(() => import('./pages/Terms.jsx'));
const Privacy            = lazy(() => import('./pages/Privacy.jsx'));
const Refund             = lazy(() => import('./pages/Refund.jsx'));
const ReturnPolicy       = lazy(() => import('./pages/Return.jsx'));
const Shipping           = lazy(() => import('./pages/Shipping.jsx'));
const QuoteDemo          = lazy(() => import('./pages/QuoteDemo.jsx'));
const Guide              = lazy(() => import('./pages/Guide.jsx'));
const GuideChapter       = lazy(() => import('./pages/GuideChapter.jsx'));
const Products           = lazy(() => import('./pages/Products.jsx'));
const Checkout           = lazy(() => import('./pages/Checkout.jsx'));
const PaymentResult      = lazy(() => import('./pages/PaymentResult.jsx'));
const PaymentIframe      = lazy(() => import('./pages/PaymentIframe.jsx'));
const FarmerProfile      = lazy(() => import('./pages/FarmerProfile.jsx'));
const AdminAnnouncements = lazy(() => import('./pages/AdminAnnouncements.jsx'));
const NotFound           = lazy(() => import('./pages/NotFound.jsx'));

// ── New admin sub-pages (modular restructure) ──────────────────────
const AdminLayout       = lazy(() => import('./components/Admin/AdminLayout.jsx'));
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminInbox        = lazy(() => import('./pages/admin/AdminInbox.jsx'));
const AdminQuotations   = lazy(() => import('./pages/admin/AdminQuotations.jsx'));
const AdminPayments     = lazy(() => import('./pages/admin/AdminPayments.jsx'));
const AdminTracking     = lazy(() => import('./pages/admin/AdminTracking.jsx'));
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminAnalytics    = lazy(() => import('./pages/admin/AdminAnalytics.jsx'));
const AdminSettings     = lazy(() => import('./pages/admin/AdminSettings.jsx'));

/**
 * Suspense wrapper that picks a route-shaped skeleton based on the
 * current pathname. Admin routes get an "admin" skeleton so the office
 * team does not see a flash of blank when navigating within the admin.
 */
function RouteSuspense({ children }) {
  const { pathname } = useLocation();
  const variant = pathname.startsWith('/admin') ? 'admin' : 'default';
  return <Suspense fallback={<PageSkeleton variant={variant} />}>{children}</Suspense>;
}

/**
 * App-internal scroll restoration. Lives inside <BrowserRouter> so
 * useLocation() works, but does NOT rely on the data-router-only
 * <ScrollRestoration /> component. See src/hooks/useScrollOnNavigate.js
 * for the full rationale.
 */
function ScrollOnNavigate() {
  useScrollOnNavigate();
  return null;
}

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <OfflineBanner />
      <SiteHeader />
      <div className="container">
        <ErrorBoundary>
          <ScrollOnNavigate />
          <main id="main" tabIndex={-1}>
            <RouteSuspense>
              <Routes>
                <Route path="/"                          element={<Home />} />
                <Route path="/clinic"                    element={<Clinic />} />
                <Route path="/distribution"              element={<Distribution />} />
                <Route path="/farmers"                   element={<Farmers />} />
                <Route path="/dealers"                   element={<Dealers />} />

                {/* Legacy monolithic admin — preserved for backwards compat */}
                {/* Legacy announcements page — still reachable */}
                <Route path="/admin/announcements"       element={<AdminAnnouncements />} />

                {/* New modular admin panel with layout + sidebar */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard"    element={<AdminDashboard />} />
                  <Route path="/admin/inbox"        element={<AdminInbox />} />
                  <Route path="/admin/quotations"   element={<AdminQuotations />} />
                  <Route path="/admin/payments"     element={<AdminPayments />} />
                  <Route path="/admin/tracking"     element={<AdminTracking />} />
                  <Route path="/admin/users"        element={<AdminUsers />} />
                  <Route path="/admin/analytics"    element={<AdminAnalytics />} />
                  <Route path="/admin/settings"     element={<AdminSettings />} />
                </Route>

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
                {/* Catch-all: show 404 page for unknown URLs */}
                <Route path="*"                          element={<NotFound />} />
              </Routes>
            </RouteSuspense>
          </main>
        </ErrorBoundary>
      </div>
      <PwaInstallPrompt />
    </>
  );
}
