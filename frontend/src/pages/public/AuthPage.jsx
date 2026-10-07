import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { useBrand } from '../../contexts/BrandContext';
import { usePageSeo } from '../../hooks/usePageSeo';
import { useLanguage } from '../../contexts/LanguageContext';

export function AuthPage({ initialMode = 'login' }) {
  const { brand } = useBrand();
  const { t, isEnglish } = useLanguage();
  const [portalType, setPortalType] = useState('cliente'); // 'cliente' | 'staff'
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  usePageSeo(
    isRegister ? (isEnglish ? 'Create Account' : 'Registro de Cuenta') : (isEnglish ? 'Sign In' : 'Iniciar Sesión'),
    isEnglish
      ? 'Sign in to Luna-Vet medical portal to review clinical records, vaccines, prescriptions, and veterinary appointments in Acapulco.'
      : 'Accede al portal médico veterinario de Luna-Vet para consultar expedientes clínicos, vacunas, recetas y citas en Acapulco.'
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Campos de login / registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');

  // Estado para 2FA TOTP
  const [twoFactorState, setTwoFactorState] = useState(null);
  const [totpCode, setTotpCode] = useState('');

  const { login, verify2FA, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterLogin = (userRole) => {
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    if (userRole === 'cliente') {
      navigate('/portal', { replace: true });
    } else if (userRole === 'administrador') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/staff/agenda', { replace: true });
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRegister && portalType === 'cliente') {
        const res = await register({
          nombre,
          apellido,
          email,
          password,
          telefono
        });
        redirectAfterLogin(res.user.rol);
      } else {
        const isStaffPortal = portalType === 'staff';
        const res = await login(email, password, isStaffPortal);
        if (res.requires2FA) {
          setTwoFactorState(res);
        } else {
          redirectAfterLogin(res.user.rol);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error durante la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await verify2FA(twoFactorState.tempToken, totpCode);
      redirectAfterLogin(res.user.rol);
    } catch (err) {
      setErrorMsg(err.message || 'Código de seguridad incorrecto.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="py-5 bg-light min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-5">
            <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5 bg-white">
              {/* Encabezado con Icono y Marca Luna-Vet Editable */}
              <div className="text-center mb-4">
                <div className="d-flex justify-content-center mb-2">
                  <BrandLogo size={58} />
                </div>
                <h1 className="h3 fw-bold text-dark mb-1">
                  {brand.nombre.includes('-') ? (
                    <>
                      {brand.nombre.split('-')[0]}<span className="text-primary">-{brand.nombre.split('-')[1]}</span>
                    </>
                  ) : (
                    brand.nombre
                  )}
                </h1>
                <p className="text-muted small fst-italic mb-3">
                  "{brand.slogan}"
                </p>

                {/* Selector de Tipo de Acceso (Cliente vs Personal) */}
                {!twoFactorState && (
                  <div className="btn-group w-100 mb-2 p-1 bg-light rounded-pill border" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill fw-semibold ${portalType === 'cliente' ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary'}`}
                      onClick={() => {
                        setPortalType('cliente');
                        setErrorMsg(null);
                      }}
                    >
                      <i className="bi bi-person me-1"></i> {t('auth.tabTutor', 'Soy Cliente')}
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill fw-semibold ${portalType === 'staff' ? 'btn-dark text-white shadow-sm' : 'btn-light text-secondary'}`}
                      onClick={() => {
                        setPortalType('staff');
                        setIsRegister(false);
                        setErrorMsg(null);
                      }}
                    >
                      <i className="bi bi-hospital me-1"></i> {t('auth.tabStaff', 'Personal Clínico')}
                    </button>
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="alert alert-danger d-flex align-items-center gap-2 small py-2 mb-4">
                  <i className="bi bi-exclamation-octagon-fill flex-shrink-0"></i>
                  <div>{errorMsg}</div>
                </div>
              )}

              {/* Formulario 2FA TOTP */}
              {twoFactorState ? (
                <form onSubmit={handle2FASubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">{t('auth.twoFactorTitle', 'Código de Seguridad (TOTP)')}</label>
                    <input
                      type="text"
                      maxLength="6"
                      className="form-control form-control-lg text-center fw-bold letter-spacing-2"
                      placeholder="000000"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                      required
                    />
                    <div className="form-text text-center small mt-2">
                      {t('auth.twoFactorDesc', 'Código generado por Google Authenticator, Authy o 1Password.')}
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-primary btn-lg rounded-pill" disabled={loading || totpCode.length !== 6}>
                      {loading ? t('common.loading', 'Verificando...') : t('auth.verifyCodeBtn', 'Confirmar e Ingresar')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-link text-muted btn-sm"
                      onClick={() => {
                        setTwoFactorState(null);
                        setTotpCode('');
                      }}
                    >
                      {isEnglish ? 'Return to login' : 'Regresar al inicio de sesión'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Formulario Login / Registro */
                <form onSubmit={handleAuthSubmit}>
                  {isRegister && portalType === 'cliente' && (
                    <>
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="form-label small fw-semibold text-dark">{t('common.name', 'Nombre')}</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ej. Ana"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold text-dark">{isEnglish ? 'Last Name' : 'Apellido'}</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ej. López"
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-dark">{t('common.phone', 'Teléfono Celular')}</label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="7441234567"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      {portalType === 'staff' ? (isEnglish ? 'Work / Staff Email' : 'Correo Institucional') : t('auth.emailLabel', 'Correo Electrónico')}
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder={portalType === 'staff' ? 'usuario@lunavet.lat' : 'cliente@ejemplo.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-dark">{t('auth.passwordLabel', 'Contraseña')}</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="d-grid mb-3">
                    <button
                      type="submit"
                      className={`btn btn-lg rounded-pill shadow-sm ${portalType === 'staff' ? 'btn-dark' : 'btn-primary'}`}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          {t('common.loading', 'Procesando...')}
                        </>
                      ) : (
                        isRegister
                          ? t('auth.registerBtn', 'Crear Mi Cuenta')
                          : (portalType === 'staff' ? (isEnglish ? 'Access Staff Portal' : 'Entrar a Panel Staff') : t('auth.loginBtn', 'Entrar a Mi Cuenta'))
                      )}
                    </button>
                  </div>

                  {portalType === 'cliente' && (
                    <div className="text-center mb-3">
                      <button
                        type="button"
                        className="btn btn-link text-decoration-none small text-secondary"
                        onClick={() => {
                          setIsRegister(!isRegister);
                          setErrorMsg(null);
                        }}
                      >
                        {isRegister
                          ? (isEnglish ? 'Already have an account? Sign in here.' : '¿Ya tienes una cuenta registrada? Inicia sesión aquí.')
                          : (isEnglish ? 'Do not have an account yet? Sign up for free.' : '¿Aún no tienes cuenta? Regístrate gratis aquí.')}
                      </button>
                    </div>
                  )}


                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
