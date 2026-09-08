import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Helper para lazy loading de exportaciones con nombre
const lazyNamed = (loader, exportName) =>
  React.lazy(() => loader().then(m => ({ default: m[exportName] })));

// Páginas Públicas (Lazy Loaded)
const LandingPage = lazyNamed(() => import('./pages/public/LandingPage'), 'LandingPage');
const ServicesPage = lazyNamed(() => import('./pages/public/ServicesPage'), 'ServicesPage');
const StorePage = lazyNamed(() => import('./pages/public/StorePage'), 'StorePage');
const BlogPage = lazyNamed(() => import('./pages/public/BlogPage'), 'BlogPage');
const AppointmentBookingPage = lazyNamed(() => import('./pages/public/AppointmentBookingPage'), 'AppointmentBookingPage');
const AuthPage = lazyNamed(() => import('./pages/public/AuthPage'), 'AuthPage');
const PrivacyPage = lazyNamed(() => import('./pages/public/PrivacyPage'), 'PrivacyPage');
const TermsPage = lazyNamed(() => import('./pages/public/TermsPage'), 'TermsPage');
const QRGeneratorPage = lazyNamed(() => import('./pages/public/QRGeneratorPage'), 'QRGeneratorPage');

// Páginas Portal Cliente (Lazy Loaded)
const ClientDashboard = lazyNamed(() => import('./pages/portal/ClientDashboard'), 'ClientDashboard');
const PetsPage = lazyNamed(() => import('./pages/portal/PetsPage'), 'PetsPage');
const MedicalRecordPage = lazyNamed(() => import('./pages/portal/MedicalRecordPage'), 'MedicalRecordPage');
const MyAppointmentsPage = lazyNamed(() => import('./pages/portal/MyAppointmentsPage'), 'MyAppointmentsPage');
const CheckoutPage = lazyNamed(() => import('./pages/portal/CheckoutPage'), 'CheckoutPage');

// Páginas Staff Clínico (Lazy Loaded - FullCalendar desacoplado)
const StaffAgendaPage = lazyNamed(() => import('./pages/staff/StaffAgendaPage'), 'StaffAgendaPage');
const MedicalConsultationPage = lazyNamed(() => import('./pages/staff/MedicalConsultationPage'), 'MedicalConsultationPage');
const ControlledMedsPage = lazyNamed(() => import('./pages/staff/ControlledMedsPage'), 'ControlledMedsPage');
const HospitalizationPage = React.lazy(() => import('./pages/staff/HospitalizationPage'));
const GroomingCheckinPage = React.lazy(() => import('./pages/staff/GroomingCheckinPage'));
const RemindersPage = React.lazy(() => import('./pages/staff/RemindersPage'));
const POSPage = React.lazy(() => import('./pages/staff/POSPage'));
const VerifyPrescriptionPage = React.lazy(() => import('./pages/public/VerifyPrescriptionPage'));

// Páginas Administrador (Lazy Loaded - Chart.js desacoplado)
const AdminDashboardPage = lazyNamed(() => import('./pages/staff/AdminDashboardPage'), 'AdminDashboardPage');
const AdminStaffPage = lazyNamed(() => import('./pages/staff/AdminStaffPage'), 'AdminStaffPage');
const InventoryFEFOPage = lazyNamed(() => import('./pages/staff/InventoryFEFOPage'), 'InventoryFEFOPage');
const AdminReportsPage = lazyNamed(() => import('./pages/staff/AdminReportsPage'), 'AdminReportsPage');
const AuditExplorerPage = lazyNamed(() => import('./pages/staff/AuditExplorerPage'), 'AuditExplorerPage');
const CMSManagerPage = lazyNamed(() => import('./pages/staff/CMSManagerPage'), 'CMSManagerPage');

export default function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      <main className="flex-grow-1">
        <Suspense fallback={
          <div className="py-5 text-center min-vh-50 d-flex align-items-center justify-content-center">
            <LoadingSpinner message="Cargando módulo de Luna-Vet Acapulco..." />
          </div>
        }>
          <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/tienda" element={<StorePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/citas" element={<AppointmentBookingPage />} />
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/registro" element={<AuthPage initialMode="register" />} />
          <Route path="/aviso-privacidad" element={<PrivacyPage />} />
          <Route path="/terminos-condiciones" element={<TermsPage />} />
          <Route path="/terminos" element={<Navigate to="/terminos-condiciones" replace />} />
          <Route path="/qr" element={<QRGeneratorPage />} />
          <Route path="/generador-qr" element={<Navigate to="/qr" replace />} />
          <Route path="/receta/:folio" element={<VerifyPrescriptionPage />} />

          {/* Rutas Portal del Cliente */}
          <Route path="/portal" element={
            <ProtectedRoute allowedRoles={['cliente', 'administrador']}>
              <ClientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/portal/mascotas" element={
            <ProtectedRoute allowedRoles={['cliente', 'administrador']}>
              <PetsPage />
            </ProtectedRoute>
          } />
          <Route path="/portal/expediente/:id" element={
            <ProtectedRoute allowedRoles={['cliente', 'veterinario', 'recepcionista', 'administrador']}>
              <MedicalRecordPage />
            </ProtectedRoute>
          } />
          <Route path="/portal/citas" element={
            <ProtectedRoute allowedRoles={['cliente', 'administrador']}>
              <MyAppointmentsPage />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute allowedRoles={['cliente', 'administrador']}>
              <CheckoutPage />
            </ProtectedRoute>
          } />

          {/* Rutas Staff Médico & Recepción */}
          <Route path="/staff/agenda" element={
            <ProtectedRoute allowedRoles={['veterinario', 'recepcionista', 'administrador']}>
              <StaffAgendaPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/consultas" element={
            <ProtectedRoute allowedRoles={['veterinario', 'administrador']}>
              <MedicalConsultationPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/controlados" element={
            <ProtectedRoute allowedRoles={['veterinario', 'recepcionista', 'administrador']}>
              <ControlledMedsPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/hospitalizacion" element={
            <ProtectedRoute allowedRoles={['veterinario', 'recepcionista', 'administrador']}>
              <HospitalizationPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/estetica" element={
            <ProtectedRoute allowedRoles={['veterinario', 'recepcionista', 'administrador']}>
              <GroomingCheckinPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/recordatorios" element={
            <ProtectedRoute allowedRoles={['veterinario', 'recepcionista', 'administrador']}>
              <RemindersPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/pos" element={
            <ProtectedRoute allowedRoles={['veterinario', 'recepcionista', 'administrador']}>
              <POSPage />
            </ProtectedRoute>
          } />

          {/* Rutas Administrador General */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/staff" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminStaffPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/inventario" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <InventoryFEFOPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/reportes" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/auditoria" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AuditExplorerPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/cms" element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <CMSManagerPage />
            </ProtectedRoute>
          } />

          {/* 404 No Encontrado */}
          <Route path="*" element={
            <div className="container py-5 text-center my-auto">
              <div className="py-5">
                <h1 className="display-1 fw-bold text-primary">404</h1>
                <h3 className="fw-bold text-dark mb-3">Página No Encontrada</h3>
                <p className="text-muted mb-4">La ruta a la que intentas acceder no existe en la plataforma web.</p>
                <Link to="/" className="btn btn-primary rounded-pill px-4">
                  <i className="bi bi-house me-1"></i> Ir al Inicio
                </Link>
              </div>
            </div>
          } />
        </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
