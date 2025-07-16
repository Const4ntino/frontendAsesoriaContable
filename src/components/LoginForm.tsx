import React, { useState } from "react";
import AuthInfo from "./AuthInfo";

interface AuthResponse {
    token: string;
    username: string;
    rol: string;
}

const LoginForm: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [auth, setAuth] = useState<AuthResponse | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await fetch("http://localhost:8099/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            if (!response.ok) {
                setError("Usuario o contraseña incorrectos");
                setLoading(false);
                return;
            }
            const data = await response.json();
            setAuth(data);
            localStorage.setItem('token', data.token);
        } catch (err) {
            setError("Error de red o del servidor");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setAuth(null);
        setUsername("");
        setPassword("");
        setError("");
        localStorage.removeItem('token');
    };

    if (auth) {
        return <AuthInfo token={auth.token} username={auth.username} rol={auth.rol} onLogout={handleLogout} />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">Iniciar Sesión</h2>
                <p className="text-center text-gray-500 mb-6 text-sm">Ingrese sus credenciales para acceder al sistema</p>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2 text-sm text-center">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="usuario">Usuario</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </span>
                            <input
                                id="usuario"
                                type="text"
                                placeholder="Ingrese su usuario"
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="contrasena">Contraseña</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </span>
                            <input
                                id="contrasena"
                                type="password"
                                placeholder="Ingrese su contraseña"
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2 rounded-md shadow mt-2 transition-colors flex items-center justify-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                        ) : null}
                        {loading ? "Iniciando..." : "Iniciar Sesión"}
                    </button>
                </form>
                <div className="text-center mt-4">
                    <a href="#" className="text-sm text-blue-700 hover:underline">¿Olvidó su contraseña?</a>
                </div>
            </div>
            <div className="absolute bottom-4 left-0 w-full text-center text-xs text-gray-400">
                © 2024 Sistema Contable. Todos los derechos reservados.
            </div>
        </div>
    );
};

export default LoginForm;
