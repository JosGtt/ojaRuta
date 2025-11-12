export interface Usuario {
  id: number;
  usuario: string;
  password: string;
  nombre_completo: string;
  email?: string;
  rol: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface HojaRuta {
  id: number;
  numero_hr: string;
  referencia: string;
  procedencia: string;
  nombre_solicitante?: string;
  telefono_celular?: string;
  fecha_documento?: Date;
  fecha_ingreso: Date;
  cite?: string;
  numero_fojas?: number;
  prioridad: string;
  estado: string;
  observaciones?: string;
  usuario_creador_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: {
    id: number;
    usuario: string;
    nombre_completo: string;
    rol: string;
  };
}