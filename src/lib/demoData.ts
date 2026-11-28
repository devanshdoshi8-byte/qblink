// Centralized demo data for Qblink — cleared to preserve real data and admin access only.

export interface DemoBusiness {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  rating: number;
  total_reviews: number;
  is_recommended: boolean;
  waiting: number;
  est_time: number;
  status: "active" | "inactive" | "closed";
  owner_id: string;
  logo_url: null;
  created_at: string;
  updated_at: string;
  settings: null;
}

export const DEMO_BUSINESSES: DemoBusiness[] = [];

export interface DemoVisitor {
  id: string;
  token_number: number;
  visitor_name: string;
  phone: string;
  status: "waiting" | "called" | "served" | "skipped";
  joined_at: string;
  called_at: string | null;
  served_at: string | null;
  queue_id: string;
}

export const buildDemoVisitors = (_queueId = "demo-queue"): DemoVisitor[] => [];

export const DEMO_SETTINGS = {
  name: "",
  category: "",
  description: "",
  address: "",
};
