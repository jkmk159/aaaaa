export interface Server {
  id: string;
  name: string;
  url: string;
  api_key?: string; // Usando snake_case para bater com o banco
  user_id?: string;
  created_at?: string;
}

export interface Client {
  id: string;
  name: string;
  username: string;
  password?: string;
  phone?: string;
  server_id: string; // Snake_case
  plan_id: string;   // Snake_case
  expiration_date: string; // Snake_case
  status?: 'active' | 'expired' | 'near_expiry';
  user_id?: string;
  created_at?: string;
}

export interface Plan {
  id: string;
  name: string;
  duration_value: number;
  duration_unit: 'days' | 'months';
  price: number;
}

export type ViewType = 'dashboard' | 'gestor-servidores' | 'gestor-clientes' | 'gestor-planos';
