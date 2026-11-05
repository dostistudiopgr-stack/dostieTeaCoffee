import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout  from '../components/layout/MainLayout';
import AdminLayout from '../admin-components/layout/AdminLayout';
import DeliveryLayout from '../components/delivery/DeliveryLayout';

// Auth guards
import ProtectedRoute      from '../components/common/ProtectedRoute';
import ProtectedAdminRoute from '../components/admin/ProtectedAdminRoute';
import ProtectedDeliveryRoute from '../components/delivery/ProtectedDeliveryRoute';

// Customer pages
const Home = lazy(() => import('../pages/customer/Home'));
const Shop = lazy(() => import('../pages/customer/Shop'));
const CategoryPage = lazy(() => import('../pages/customer/CategoryPage'));
const ProductDetails = lazy(() => import('../pages/customer/ProductDetails'));
const Cart = lazy(() => import('../pages/customer/Cart'));
const Checkout = lazy(() => import('../pages/customer/Checkout'));
const Login = lazy(() => import('../pages/customer/Login'));
const Register = lazy(() => import('../pages/customer/Register'));
const ForgotPassword = lazy(() => import('../pages/customer/ForgotPassword'));
const About = lazy(() => import('../pages/customer/About'));
const Contact = lazy(() => import('../pages/customer/Contact'));
const MyOrders = lazy(() => import('../pages/customer/MyOrders'));
const TrackOrder = lazy(() => import('../pages/customer/TrackOrder'));
const Profile = lazy(() => import('../pages/customer/Profile'));
const OrderConfirmation = lazy(() => import('../pages/customer/OrderConfirmation'));
const CustomerOrderDetails = lazy(() => import('../pages/customer/OrderDetails'));

// Admin pages
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'));
const AdminSetup = lazy(() => import('../pages/admin/AdminSetup'));
const AdminRecovery = lazy(() => import('../pages/admin/AdminRecovery'));
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const Products = lazy(() => import('../pages/admin/Products'));
const AddProduct = lazy(() => import('../pages/admin/AddProduct'));
const EditProduct = lazy(() => import('../pages/admin/EditProduct'));
const Categories = lazy(() => import('../pages/admin/Categories'));
const Orders = lazy(() => import('../pages/admin/Orders'));
const OrderDetails = lazy(() => import('../pages/admin/OrderDetails'));
const Customers = lazy(() => import('../pages/admin/Customers'));
const Inventory = lazy(() => import('../pages/admin/Inventory'));
const Reports = lazy(() => import('../pages/admin/Reports'));
const Settings = lazy(() => import('../pages/admin/Settings'));
const DeliveryBoys = lazy(() => import('../pages/admin/DeliveryBoys'));
const CreateSale = lazy(() => import('../pages/admin/CreateSale'));

// Delivery pages
const DeliveryLogin = lazy(() => import('../pages/delivery/DeliveryLogin'));
const DeliveryDashboard = lazy(() => import('../pages/delivery/DeliveryDashboard'));
const DeliveryOrders = lazy(() => import('../pages/delivery/DeliveryOrders'));
const DeliveryOrderDetails = lazy(() => import('../pages/delivery/DeliveryOrderDetails'));

// Misc
const ComponentPreview = lazy(() => import('../pages/ComponentPreview'));
const NotFound = lazy(() => import('../pages/NotFound'));

const AppRoutes = () => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-[#73786F]" role="status">Loading page?</div>}>
  <Routes>
    {/* ── Customer routes — wrapped in MainLayout ──────────── */}
    <Route element={<MainLayout />}>
      <Route path="/"                          element={<Home />}           />
      <Route path="/shop"                      element={<Shop />}           />
      <Route path="/category/:slug"            element={<CategoryPage />}   />
      <Route path="/product/:slug"             element={<ProductDetails />} />
      <Route path="/cart"                      element={<Cart />}           />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/about"                     element={<About />}          />
      <Route path="/contact"                   element={<Contact />}        />
      <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
      <Route path="/track-order/:orderNumber" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
      <Route path="/order-details/:id" element={<ProtectedRoute><CustomerOrderDetails /></ProtectedRoute>} />
      <Route path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/order-confirmation/:id" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
    </Route>

    {/* ── Auth pages — standalone (no MainLayout) ──────────── */}
    <Route path="/login"            element={<Login />}          />
    <Route path="/register"         element={<Register />}       />
    <Route path="/forgot-password"  element={<ForgotPassword />} />

    {/* ── Admin routes — wrapped in AdminLayout + ProtectedAdminRoute ── */}
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin/setup" element={<AdminSetup />} />
    {import.meta.env.DEV && <Route path="/admin/recovery" element={<AdminRecovery />} />}
    <Route
      path="/admin"
      element={
        <ProtectedAdminRoute>
          <AdminLayout />
        </ProtectedAdminRoute>
      }
    >
      <Route index                          element={<Dashboard />}    />
      <Route path="dashboard"               element={<Dashboard />}    />
      <Route path="products"                element={<Products />}     />
      <Route path="products/add"            element={<AddProduct />}   />
      <Route path="products/:id/edit"       element={<EditProduct />}  />
      <Route path="categories"              element={<Categories />}   />
      <Route path="orders"                  element={<Orders />}      />
      <Route path="orders/:id"              element={<OrderDetails />} />
      <Route path="sales/new"               element={<CreateSale />} />
      <Route path="customers"               element={<Customers />}    />
      <Route path="delivery-boys"           element={<DeliveryBoys />} />
      <Route path="inventory"               element={<Inventory />}    />
      <Route path="reports"                element={<Reports />}      />
      <Route path="settings"               element={<Settings />}     />
    </Route>

    {/* ── Dev preview ──────────────────────────────────────── */}
    <Route path="/dev/components" element={<ComponentPreview />} />

    {/* ── Delivery routes ──────────────────────────────────── */}
    <Route path="/delivery/login" element={<DeliveryLogin />} />
    <Route
      path="/delivery"
      element={
        <ProtectedDeliveryRoute>
          <DeliveryLayout />
        </ProtectedDeliveryRoute>
      }
    >
      <Route index                   element={<DeliveryDashboard />}    />
      <Route path="dashboard"        element={<DeliveryDashboard />}    />
      <Route path="orders"           element={<DeliveryOrders />}       />
      <Route path="orders/:id"       element={<DeliveryOrderDetails />} />
      <Route path="history"          element={<DeliveryOrders />}       />
    </Route>

    {/* ── 404 ──────────────────────────────────────────────── */}
    <Route path="*" element={<NotFound />} />
  </Routes>
  </Suspense>
);

export default AppRoutes;
