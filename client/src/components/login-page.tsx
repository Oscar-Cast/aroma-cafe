import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import '@/styles/login.css';

export function LoginPage() {
  const { login } = useAuth();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(usuario, password);
    } catch (err: any) {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="container">
        <div className="header">
          <div className="logo">
            <img src="/logo_sin_fondo.png" alt="Logo" />
          </div>
          <div className="title">Aroma Café</div>
        </div>

        <form className="login-box" onSubmit={iniciarSesion}>
          {error && <div className="error">{error}</div>}

          <div className="input-group">
            <label>Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="login-input"
              required
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
          </div>

          <button type="submit" disabled={cargando} className="login-button">
            {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
