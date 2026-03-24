// src/types/team.ts

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  cpf: string;
  role: UserRole;
  status: UserStatus;
  userType: UserType;
  phone?: string;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
  lastAccess?: string;
}

export interface TeamMemberRequest {
  name: string;
  email: string;
  cpf: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  byRole: {
    [key in UserRole]?: number;
  };
}

export enum UserRole {
  ADMIN = 'ADMIN',
  DIRECTOR = 'DIRECTOR',
  MANAGER = 'MANAGER',
  ANALYST = 'ANALYST',
  CLIENT = 'CLIENT'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED'
}

export enum UserType {
  OWNER = 'OWNER',
  CLIENT = 'CLIENT',
  DEVELOPER = 'DEVELOPER'
}

export interface InviteMemberRequest {
  email: string;
  role: UserRole;
  message?: string;
}