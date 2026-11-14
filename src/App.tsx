import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { StoreProvider, useStore } from './context/StoreContext';
import { AccountPage } from './pages/AccountPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CartPage, CheckoutPage } from './pages/CartAndCheckoutPage';
import { CatalogPage } from './pages/CatalogPage';
import { HomePage } from './pages/HomePage';
import { AboutPage, ContactPage, FaqPage, LegalPage, ShippingConditionsPage } from './pages/InfoPages';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { ProductDetailPage } from './pages/ProductDetailPage';

function AppRouter() {
  const { route, navigate } = useStore();
  const pathname = route.split('?')[0] || '/';

  if (pathname === '/') return <HomePage />;
  if (pathname === '/catalogue') return <CatalogPage />;
  if (pathname.startsWith('/produit/')) {
    const slug = decodeURIComponent(pathname.replace('/produit/', ''));
    return <ProductDetailPage slug={slug} />;
  }
  if (pathname === '/panier') return <CartPage />;
  if (pathname === '/commande') return <CheckoutPage />;
  if (pathname === '/compte' || pathname === '/connexion') return <AccountPage />;
  if (pathname === '/suivi') return <OrderTrackingPage />;
  if (pathname === '/admin') return <AdminDashboardPage />;
  if (pathname === '/a-propos') return <AboutPage />;
  if (pathname === '/contact') return <ContactPage />;
  if (pathname === '/faq') return <FaqPage />;
  if (pathname === '/livraison') return <ShippingConditionsPage />;
  if (pathname === '/cgv') return <LegalPage type="cgv" />;
  if (pathname === '/confidentialite') return <LegalPage type="privacy" />;
  if (pathname === '/retours') return <LegalPage type="returns" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
      <h1 className="text-3xl font-bold text-[#142B4A]">Page introuvable</h1>
      <p className="text-sm text-slate-600">La page demandée n’existe pas ou a été déplacée.</p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="px-5 py-2.5 rounded-lg bg-[#142B4A] text-white text-sm font-semibold cursor-pointer"
      >
        Retour à l’accueil
      </button>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <div className="min-h-screen flex flex-col bg-white text-slate-900">
        <Navbar />
        <CartDrawer />
        <main className="flex-1">
          <AppRouter />
        </main>
        <Footer />
      </div>
    </StoreProvider>
  );
}
