export type UserRole = "admin" | "client";

export type ProjectStatus =
  | "planning"
  | "production"
  | "waiting_client"
  | "approved"
  | "published";

export type ServiceType =
  | "website"
  | "app"
  | "branding"
  | "social_media"
  | "seo";

export type ApprovalStatus = "pending" | "approved" | "revision";

export type Client = {
  id: string;
  contactName: string;
  businessName: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
};

export type Project = {
  id: string;
  clientId: string;
  name: string;
  serviceType: ServiceType | string;
  scope: string;
  startDate: string;
  status: ProjectStatus;
  brandColor: string;
  nextAction: string;
  lastActivity: string;
  createdAt: string;
};

export type ProjectWithClient = Project & {
  client: Client | null;
};

export type ProjectMessage = {
  id: string;
  projectId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
};

export type ProjectFile = {
  id: string;
  projectId: string;
  name: string;
  filePath: string;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
  previewUrl?: string;
};

export type ProjectApproval = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  previewUrl: string;
  status: ApprovalStatus;
  feedback: string;
  createdAt: string;
};
