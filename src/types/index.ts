// export interface Ticket {
//   id: string;
//   ticket_number: string;
//   subject: string;
//   description: string;
//   priority: 'low' | 'medium' | 'high';
//   status: 'open' | 'in-progress' | 'resolved' | 'closed';
//   customer_name: string;
//   customer_email: string;
//   customer_company: string;
//   assigned_to?: string;
//   assigned_by?: string;
//   created_at: string;
//   updated_at: string;
//   resolved_at?: string;
//   closed_at?: string;
//   last_reopened_at?: string;
//   sla_deadline: string;
//   sla_status: 'within' | 'approaching' | 'breached';
//   tags: string[];
//   attachments: TicketAttachment[];
//   responses: TicketResponse[];
//   time_spent: number; // in minutes
//   customer_satisfaction?: number; // 1-5 rating
//   feedback_comment?: string;
//   is_merged?: boolean;
//   merged_into_ticket_id?: string;
//   reopen_count?: number;
//   merged_tickets?: string[]; // IDs of tickets merged into this one
// }

export interface TicketResponse {
  id: string;
  ticket_id: string;
  message: string;
  author: string;
  author_type: "customer" | "agent";
  created_at: string;
  is_internal: boolean;
  attachments?: TicketAttachment[];
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  response_id?: string;
  file_name: string;
  original_file_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  file_hash: string;
  uploaded_by: string;
  uploaded_by_type: "user" | "customer" | "system";
  is_public: boolean;
  virus_scanned: boolean;
  scan_result?: "clean" | "infected" | "pending";
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  role_id: number;
  department_id: string;
  phone: string;
  avatar: string;
  is_active: boolean;
  last_login_at: string;
  created_at: string;
  updated_at: string;
  user_role: {
    id: string;
    name: string;
  };
  user_department: {
    id: string;
    department_name: string;
  };
  tickets?: Ticket[];
}

export interface TicketMerge {
  id: string;
  parent_ticket_id: string;
  child_ticket_id: string;
  merged_by: string;
  merge_reason: string;
  merged_at: string;
  parent_ticket_number: string;
  child_ticket_number: string;
}

export interface TicketReopen {
  id: string;
  ticket_id: string;
  reopened_by: string;
  reopen_reason: string;
  previous_status: string;
  reopened_at: string;
}

export interface TicketAllocation {
  id: string;
  ticket_id: string;
  from_user_id?: string;
  to_user_id: string;
  allocated_by: string;
  allocation_reason?: string;
  allocated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "agent";
  avatar?: string;
  is_active: boolean;
  performance: AgentPerformance;
}

export interface AgentPerformance {
  total_tickets: number;
  resolved_tickets: number;
  avg_resolution_time: number; // in hours
  sla_compliance: number; // percentage
  customer_satisfaction: number; // average rating
  response_time: number; // average in minutes
}

export interface SLAConfig {
  high: number; // hours
  medium: number; // hours
  low: number; // hours
}

export interface DashboardStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  sla_breached: number;
  avg_resolution_time: number;
  customer_satisfaction: number;
  first_response_time: number;
  avg_response_time: number;
  escalated_tickets: number;
}

export interface EscalationRule {
  id: string;
  name: string;
  priority: "high" | "medium" | "low";
  time_threshold_hours: number;
  escalate_to_role: "manager" | "admin";
  is_active: boolean;
  notification_channels: ("email" | "slack" | "sms")[];
}

export interface NotificationAlert {
  id: string;
  ticket_id: string;
  type: "sla_warning" | "escalation" | "urgent_ticket" | "overdue";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  created_at: string;
  is_read: boolean;
  recipient_id: string;
}

export interface TeamView {
  id: string;
  name: string;
  description: string;
  filters: {
    priority?: ("high" | "medium" | "low")[];
    status?: string[];
    assigned_to?: string[];
    tags?: string[];
  };
  is_shared: boolean;
  created_by: string;
  team_members: string[];
}

export interface RequestParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export interface DeleteRequestData {
  ids: number[];
}
//
export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  data_type: "string" | "number" | "boolean" | "json";
  description?: string;
}

export interface EmailConfiguration {
  id: number;
  smtp_server: string;
  smtp_port: number;
  username: string;
  password: string;
  enable_tls?: boolean;
  from_email: string;
  from_name: string;
  auto_reply_enabled?: boolean;
  auto_reply_message?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SLAConfiguration {
  id: number;
  priority: "Low" | "Medium" | "High" | "Critical";
  response_time_hours: number;
  resolution_time_hours: number;
  business_hours_only?: boolean;
  business_start_time?: string;
  include_weekends?: boolean;
  business_end_time?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  assigned_agent_id: number;
  category_id: number;
  subject: string;
  description: string;
  priority: number;
  // priority: 'Low' | 'Medium' | 'High';
  status: "Open" | "In Progress" | "Closed" | "Resolved" | "Merged";
  source?: string;
  sla_deadline?: string | null;
  sla_status?: "Within" | "Breached" | "Met" | null;
  first_response_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  assigned_by?: number;
  is_merged?: boolean;
  attachment_urls: any;
  reopen_count?: number;
  time_spent_minutes?: number;
  last_reopened_at?: string | null;
  customer_satisfaction_rating?: number | null;
  customer_feedback?: string | null;
  tags?: any;
  merged_into_ticket_id?: number | null;
  created_at: string;
  updated_at: string;
  users?: Record<string, any>; // you can expand this if you have a proper User type
  customers?: {
    id: number;
    [key: string]: any;
  };
  agents_user?: {
    id: number;
    [key: string]: any;
  };
  sla_priority?: {
    id: number;
    [key: string]: any;
  };
  ticket_attachments: any[];
}
export interface TicketsResponse {
  data: Ticket[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface TicketType {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "Pending" | "Resolved" | "Closed";
  customer_id?: number;
  assigned_agent_id?: number;
  category_id?: number;
  tags?: string;

  // Optional nested objects if you’re using them
  customers?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  assigned_agent?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  category?: {
    id: number;
    category_name: string;
  };
}
