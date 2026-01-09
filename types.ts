
export interface FootballGame {
  fixture: { id: number; date: string; status: { short: string; long: string }; };
  league: { name: string; country: string; logo: string; };
  teams: { home: { name: string; logo: string }; away: { name: string; logo: string }; };
  broadcast?: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
}

export interface TMDBSeries {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  first_air_date: string;
  vote_average: number;
}

export interface Server { id: string; name: string; url: string; apiKey: string; }
export interface Plan { id: string; name: string; price: number; durationValue: number; durationUnit: 'months' | 'days'; }
export interface Client { id: string; username: string; password?: string; name: string; phone: string; serverId: string; planId: string; expirationDate: string; status: 'active' | 'expired' | 'near_expiry'; url_m3u?: string; }

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'reseller';
  credits: number;
  parent_id?: string;
}

export interface ResaleCustomer {
  id: string;
  name: string;
  expiration_date: string;
  reseller_id: string;
  created_at: string;
}

export type ViewType = 
  | 'dashboard' | 'football' | 'movie' | 'series' | 'pricing' | 'editor' | 'logo' | 'ad-analyzer' | 'sales-copy'
  | 'tutorial-owner' | 'dns-setup' | 'gestor-dashboard' | 'gestor-servidores' | 'gestor-clientes' | 'gestor-calendario'
  | 'gestor-planos' | 'gestor-template-ai';
