export interface AuthResponse {
  token: string;
  username: string;
  rol: string;
}

export interface RegisterClienteRequest {
  username: string;
  password: string;
  nombres: string;
  apellidos: string;
  rucDni: string;
  email: string;
  telefono: string;
}
