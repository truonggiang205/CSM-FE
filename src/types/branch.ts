export interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  distance_km?: number | null;
}

