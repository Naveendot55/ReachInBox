// Custom React Query hooks for campaign and prospect workflows
// Provides reactive state, caching, and optimistic updates across views

import { useMutation, useQuery } from '@tanstack/react-query';
import * as store from './store';

// Core model types and status enums
export {
  CampaignStatus,
  ProspectStatus,
  type Campaign,
  type CampaignStatusType as CampaignStatus_Type,
  type SequenceStep,
  type Prospect,
  type ProspectStatusType as ProspectStatus_Type,
  type Activity,
  type DashboardSummary,
} from './store';

// Type aliases for component ergonomics
export type CampaignStatusType = store.CampaignStatusType;
export type ProspectStatusType = store.ProspectStatusType;
export type Campaign = store.Campaign;
export type Prospect = store.Prospect;
export type SequenceStep = store.SequenceStep;

// ── Query Keys ──

export const getGetDashboardSummaryQueryKey = () => ['dashboard', 'summary'] as const;
export const getListActivitiesQueryKey = () => ['activities'] as const;
export const getListCampaignsQueryKey = () => ['campaigns'] as const;
export const getGetCampaignQueryKey = (id: number) => ['campaigns', id] as const;
export const getListCampaignStepsQueryKey = (id: number) => ['campaigns', id, 'steps'] as const;
export const getListProspectsQueryKey = () => ['prospects'] as const;

// ── Query Hooks ──

export function useGetDashboardSummary() {
  return useQuery({
    queryKey: getGetDashboardSummaryQueryKey(),
    queryFn: () => store.getDashboardSummary(),
  });
}

export function useListActivities(params?: { limit?: number }) {
  return useQuery({
    queryKey: getListActivitiesQueryKey(),
    queryFn: () => store.listActivities(params?.limit),
  });
}

export function useListCampaigns(params?: { search?: string; status?: store.CampaignStatusType }) {
  return useQuery({
    queryKey: [...getListCampaignsQueryKey(), params],
    queryFn: () => store.listCampaigns(params),
  });
}

export function useGetCampaign(id: number, _options?: { query?: { queryKey?: readonly unknown[] } }) {
  return useQuery({
    queryKey: getGetCampaignQueryKey(id),
    queryFn: () => store.getCampaign(id),
  });
}

export function useListCampaignSteps(id: number, _options?: { query?: { queryKey?: readonly unknown[] } }) {
  return useQuery({
    queryKey: getListCampaignStepsQueryKey(id),
    queryFn: () => store.listCampaignSteps(id),
  });
}

export function useListProspects(params?: { search?: string; status?: store.ProspectStatusType; campaignId?: number }) {
  return useQuery({
    queryKey: [...getListProspectsQueryKey(), params],
    queryFn: () => store.listProspects(params),
  });
}

// ── Mutation Hooks ──

export function useCreateCampaign() {
  return useMutation({
    mutationFn: ({ data }: { data: { name: string; audience: string } }) => {
      return Promise.resolve(store.createCampaign(data));
    },
  });
}

export function useUpdateCampaign() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; audience?: string } }) => {
      const result = store.updateCampaign(id, data);
      if (!result) throw new Error('Campaign not found');
      return Promise.resolve(result);
    },
  });
}

export function useDeleteCampaign() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => {
      store.deleteCampaign(id);
      return Promise.resolve();
    },
  });
}

export function useUpdateCampaignStatus() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: store.CampaignStatusType } }) => {
      const result = store.updateCampaignStatus(id, data.status);
      if (!result) throw new Error('Campaign not found');
      return Promise.resolve(result);
    },
  });
}

export function useCreateCampaignStep() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { subject: string; body: string; delayDays: number } }) => {
      return Promise.resolve(store.createCampaignStep(id, data));
    },
  });
}

export function useUpdateCampaignStep() {
  return useMutation({
    mutationFn: ({ id, stepId, data }: { id: number; stepId: number; data: { subject?: string; body?: string; delayDays?: number } }) => {
      const result = store.updateCampaignStep(id, stepId, data);
      if (!result) throw new Error('Step not found');
      return Promise.resolve(result);
    },
  });
}

export function useDeleteCampaignStep() {
  return useMutation({
    mutationFn: ({ id, stepId }: { id: number; stepId: number }) => {
      store.deleteCampaignStep(id, stepId);
      return Promise.resolve();
    },
  });
}

export function useCreateProspect() {
  return useMutation({
    mutationFn: ({ data }: { data: { name: string; email: string; company: string; role: string; campaignId?: number | null } }) => {
      return Promise.resolve(store.createProspect(data));
    },
  });
}

export function useUpdateProspect() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; email?: string; company?: string; role?: string; campaignId?: number | null } }) => {
      const result = store.updateProspect(id, data);
      if (!result) throw new Error('Prospect not found');
      return Promise.resolve(result);
    },
  });
}

export function useDeleteProspect() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => {
      store.deleteProspect(id);
      return Promise.resolve();
    },
  });
}
