import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Coffee } from 'lucide-react'; // si tienes lucide-react instalado

export function LoginPage() {
  const { login } = useAuth();
  const [nombre_usuario, setUser] = useState('');
  const [contrasena, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(nombre_usuario, contrasena);
    } catch (err: any) {
      setError(err.message || 'Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E5D7C4]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-96 space-y-6 border border-[#CFBB99]"
      >
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10 bg-[#4C3D19] rounded-full flex items-center justify-center">
            <Coffee className="w-6 h-6 text-[#E5D7C4]" />
          </div>
          <h1 className="text-2xl font-bold text-[#4C3D19]">Aroma Café</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#4C3D19] mb-1">
            Usuario
          </label>
          <input
            type="text"
            value={nombre_usuario}
            onChange={(e) => setUser(e.target.value)}
            className="w-full px-3 py-2 border border-[#CFBB99] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4C3D19]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4C3D19] mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-[#CFBB99] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4C3D19]"
            required
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-[#4C3D19] text-[#E5D7C4] py-2 rounded-md hover:bg-[#354024] transition-colors disabled:opacity-50"
        >
          {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}
