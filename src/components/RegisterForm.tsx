import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft } from "lucide-react";
import type { RegisterClienteRequest, AuthResponse } from "@/types/auth";

interface RegisterFormProps {
  onRegisterSuccess: (auth: AuthResponse) => void;
  onCancel: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess, onCancel }) => {
  const [formData, setFormData] = useState<RegisterClienteRequest>({
    username: "",
    password: "",
    nombres: "",
    apellidos: "",
    rucDni: "",
    email: "",
    telefono: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validar username
    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es obligatorio";
    } else if (formData.username.length > 100) {
      newErrors.username = "El nombre de usuario no debe exceder 100 caracteres";
    }
    
    // Validar password
    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (formData.password.length < 6 || formData.password.length > 72) {
      newErrors.password = "La contraseña debe tener entre 6 y 72 caracteres";
    }
    
    // Validar nombres
    if (!formData.nombres.trim()) {
      newErrors.nombres = "El nombre es obligatorio";
    } else if (formData.nombres.length > 50) {
      newErrors.nombres = "El nombre no debe exceder 50 caracteres";
    }
    
    // Validar apellidos
    if (!formData.apellidos.trim()) {
      newErrors.apellidos = "Los apellidos son obligatorios";
    } else if (formData.apellidos.length > 50) {
      newErrors.apellidos = "Los apellidos no deben exceder 50 caracteres";
    }
    
    // Validar rucDni
    if (!formData.rucDni) {
      newErrors.rucDni = "El DNI/RUC es obligatorio";
    } else if (formData.rucDni.length !== 8) {
      newErrors.rucDni = "El DNI/RUC debe tener 8 dígitos";
    }
    
    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (formData.email.length > 50) {
      newErrors.email = "El email no debe exceder 50 caracteres";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }
    
    // Validar teléfono
    if (!formData.telefono) {
      newErrors.telefono = "El teléfono es obligatorio";
    } else if (formData.telefono.length !== 9) {
      newErrors.telefono = "El teléfono debe tener 9 dígitos";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Validación para campos numéricos
    if ((name === 'rucDni' || name === 'telefono') && !/^\d*$/.test(value)) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setGeneralError("");
    
    try {
      const response = await fetch("http://localhost:8099/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setGeneralError(errorData.message || "Error al registrar usuario");
        setLoading(false);
        return;
      }
      
      const data: AuthResponse = await response.json();
      
      // Guardar token en localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("rol", data.rol);
      
      // Notificar al componente padre del éxito
      onRegisterSuccess(data);
      
    } catch (error) {
      setGeneralError("Error de conexión al servidor");
      console.error("Error al registrar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Registro de Cliente</h1>
        <p className="mt-2 text-gray-600">Ingrese sus datos para crear una cuenta</p>
      </div>
      
      {generalError && (
        <div className="p-3 text-sm text-white bg-red-500 rounded-md">
          {generalError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Usuario</Label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="Ingrese un nombre de usuario"
            value={formData.username}
            onChange={handleChange}
            className={errors.username ? "border-red-500" : ""}
          />
          {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Ingrese una contraseña"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? "border-red-500" : ""}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombres">Nombres</Label>
            <Input
              id="nombres"
              name="nombres"
              type="text"
              placeholder="Ingrese sus nombres"
              value={formData.nombres}
              onChange={handleChange}
              className={errors.nombres ? "border-red-500" : ""}
            />
            {errors.nombres && <p className="text-xs text-red-500">{errors.nombres}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input
              id="apellidos"
              name="apellidos"
              type="text"
              placeholder="Ingrese sus apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              className={errors.apellidos ? "border-red-500" : ""}
            />
            {errors.apellidos && <p className="text-xs text-red-500">{errors.apellidos}</p>}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="rucDni">DNI</Label>
          <Input
            id="rucDni"
            name="rucDni"
            type="text"
            placeholder="Ingrese su DNI (8 dígitos)"
            value={formData.rucDni}
            onChange={handleChange}
            maxLength={8}
            className={errors.rucDni ? "border-red-500" : ""}
          />
          {errors.rucDni && <p className="text-xs text-red-500">{errors.rucDni}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Ingrese su correo electrónico"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            name="telefono"
            type="text"
            placeholder="Ingrese su número de teléfono (9 dígitos)"
            value={formData.telefono}
            onChange={handleChange}
            maxLength={9}
            className={errors.telefono ? "border-red-500" : ""}
          />
          {errors.telefono && <p className="text-xs text-red-500">{errors.telefono}</p>}
        </div>
        
        <div className="pt-2">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrarse"}
          </Button>
        </div>
        
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={onCancel}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio de sesión
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
