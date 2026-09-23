// In-memory data store replacing the PostgreSQL/Drizzle backend
// This allows the app to run standalone without any database

export type CampaignStatusType = 'running' | 'paused' | 'draft' | 'completed';
export type ProspectStatusType = 'active' | 'replied' | 'bounced' | 'unsubscribed';
export type ActivityType = 'sent' | 'opened' | 'replied' | 'bounced';

export const CampaignStatus = {
  running: 'running' as CampaignStatusType,
  paused: 'paused' as CampaignStatusType,
  draft: 'draft' as CampaignStatusType,
  completed: 'completed' as CampaignStatusType,
};

export const ProspectStatus = {
  active: 'active' as ProspectStatusType,
  replied: 'replied' as ProspectStatusType,
  bounced: 'bounced' as ProspectStatusType,
  unsubscribed: 'unsubscribed' as ProspectStatusType,
};

export interface Campaign {
  id: number;
  name: string;
  audience: string;
  status: CampaignStatusType;
  sentCount: number;
  openRate: number;
  replyRate: number;
  nextSendAt: string | null;
  createdAt: string;
  stepCount: number;
}

export interface SequenceStep {
  id: number;
  campaignId: number;
  position: number;
  subject: string;
  body: string;
  delayDays: number;
  sentCount: number;
  openRate: number;
  replyRate: number;
}

export interface Prospect {
  id: number;
  name: string;
  email: string;
  company: string;
  role: string;
  status: ProspectStatusType;
  campaignId: number | null;
  lastContactedAt: string | null;
  createdAt: string;
}

export interface Activity {
  id: number;
  type: ActivityType;
  message: string;
  prospectName: string;
  campaignName: string;
  occurredAt: string;
}

export interface DashboardSummary {
  totalProspects: number;
  activeCampaigns: number;
  emailsSent: number;
  openRate: number;
  replyRate: number;
  scheduledToday: number;
  trend: Array<{ label: string; sent: number; opened: number; replied: number }>;
}

function daysFromNow(days: number, hour = 10): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

let nextCampaignId = 4;
let nextStepId = 6;
let nextProspectId = 6;
let nextActivityId = 8;

const campaigns: Campaign[] = [
  {
    id: 1,
    name: 'Product-led teams',
    audience: 'SaaS founders & growth leads',
    status: 'running',
    sentCount: 284,
    openRate: 0.48,
    replyRate: 0.12,
    nextSendAt: daysFromNow(0, 14),
    createdAt: daysFromNow(-14),
    stepCount: 3,
  },
  {
    id: 2,
    name: 'Founder network',
    audience: 'Early-stage founders',
    status: 'paused',
    sentCount: 156,
    openRate: 0.41,
    replyRate: 0.09,
    nextSendAt: daysFromNow(1, 10),
    createdAt: daysFromNow(-10),
    stepCount: 1,
  },
  {
    id: 3,
    name: 'Q4 re-engagement',
    audience: 'Warm leads from Q3',
    status: 'draft',
    sentCount: 0,
    openRate: 0,
    replyRate: 0,
    nextSendAt: null,
    createdAt: daysFromNow(-3),
    stepCount: 1,
  },
];

const sequenceSteps: SequenceStep[] = [
  {
    id: 1,
    campaignId: 1,
    position: 1,
    subject: 'A faster way to keep your pipeline moving',
    body: 'Hi {{firstName}},\n\nNoticed the work your team is doing at {{company}}. We help small growth teams keep thoughtful follow-ups moving without adding more busywork.\n\nWould it be useful to compare notes?',
    delayDays: 0,
    sentCount: 142,
    openRate: 0.52,
    replyRate: 0.11,
  },
  {
    id: 2,
    campaignId: 1,
    position: 2,
    subject: 'Worth a closer look?',
    body: 'Hi {{firstName}},\n\nSharing a little more context in case this is on your roadmap. The teams we work with usually save a few hours each week while their replies stay personal.\n\nOpen to a quick look?',
    delayDays: 3,
    sentCount: 96,
    openRate: 0.44,
    replyRate: 0.1,
  },
  {
    id: 3,
    campaignId: 1,
    position: 3,
    subject: 'Closing the loop',
    body: "Hi {{firstName}},\n\nI'll close the loop here for now. If improving outbound follow-up becomes a priority, I'd be glad to pick this back up.\n\nEither way, wishing you a strong quarter.",
    delayDays: 5,
    sentCount: 46,
    openRate: 0.39,
    replyRate: 0.15,
  },
  {
    id: 4,
    campaignId: 2,
    position: 1,
    subject: 'A note on building repeatable outbound',
    body: "Hi {{firstName}},\n\nI'm speaking with a few founders about the systems behind repeatable outbound. Your work at {{company}} caught my eye.\n\nWould a short exchange be useful?",
    delayDays: 0,
    sentCount: 156,
    openRate: 0.41,
    replyRate: 0.09,
  },
  {
    id: 5,
    campaignId: 3,
    position: 1,
    subject: 'Still on your radar?',
    body: "Hi {{firstName}},\n\nIt's been a little while since we last connected. I wanted to see if this is still relevant for your team this quarter.\n\nNo pressure either way.",
    delayDays: 0,
    sentCount: 0,
    openRate: 0,
    replyRate: 0,
  },
];

const prospects: Prospect[] = [
  {
    id: 1,
    name: 'Maya Chen',
    email: 'maya@northstar.dev',
    company: 'Northstar',
    role: 'VP Growth',
    status: 'replied',
    campaignId: 1,
    lastContactedAt: daysFromNow(-1, 11),
    createdAt: daysFromNow(-14),
  },
  {
    id: 2,
    name: 'Noah Williams',
    email: 'noah@orbitlabs.co',
    company: 'Orbit Labs',
    role: 'Founder',
    status: 'active',
    campaignId: 1,
    lastContactedAt: daysFromNow(-2, 15),
    createdAt: daysFromNow(-12),
  },
  {
    id: 3,
    name: 'Sofia Patel',
    email: 'sofia@joinatlas.com',
    company: 'Atlas',
    role: 'Head of Sales',
    status: 'active',
    campaignId: 2,
    lastContactedAt: daysFromNow(-3, 9),
    createdAt: daysFromNow(-10),
  },
  {
    id: 4,
    name: 'Liam Foster',
    email: 'liam@latticework.io',
    company: 'Latticework',
    role: 'Co-founder',
    status: 'bounced',
    campaignId: 1,
    lastContactedAt: daysFromNow(-4, 13),
    createdAt: daysFromNow(-8),
  },
  {
    id: 5,
    name: 'Amara Okafor',
    email: 'amara@threadline.ai',
    company: 'Threadline',
    role: 'Revenue Lead',
    status: 'active',
    campaignId: 3,
    lastContactedAt: null,
    createdAt: daysFromNow(-5),
  },
];

const activities: Activity[] = [
  {
    id: 1,
    type: 'replied',
    message: 'replied to step 2',
    prospectName: 'Maya Chen',
    campaignName: 'Product-led teams',
    occurredAt: daysFromNow(0, 9),
  },
  {
    id: 2,
    type: 'opened',
    message: 'opened email 3 times',
    prospectName: 'Noah Williams',
    campaignName: 'Product-led teams',
    occurredAt: daysFromNow(0, 8),
  },
  {
    id: 3,
    type: 'sent',
    message: 'received step 1',
    prospectName: 'Sofia Patel',
    campaignName: 'Founder network',
    occurredAt: daysFromNow(-1, 16),
  },
  {
    id: 4,
    type: 'opened',
    message: 'opened email',
    prospectName: 'Amara Okafor',
    campaignName: 'Q4 re-engagement',
    occurredAt: daysFromNow(-2, 12),
  },
  {
    id: 5,
    type: 'bounced',
    message: 'email bounced',
    prospectName: 'Liam Foster',
    campaignName: 'Product-led teams',
    occurredAt: daysFromNow(-3, 14),
  },
  {
    id: 6,
    type: 'sent',
    message: 'received step 2',
    prospectName: 'Maya Chen',
    campaignName: 'Product-led teams',
    occurredAt: daysFromNow(-4, 10),
  },
  {
    id: 7,
    type: 'replied',
    message: 'replied to step 1',
    prospectName: 'Sofia Patel',
    campaignName: 'Founder network',
    occurredAt: daysFromNow(-5, 15),
  },
];

// ── Outbound Orchestration & Data Service Layer ──

export function getDashboardSummary(): DashboardSummary {
  const totalProspects = prospects.length;
  const activeCampaigns = campaigns.filter((c) => c.status === 'running').length;
  const emailsSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const rates = campaigns.length
    ? {
        openRate: campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length,
        replyRate: campaigns.reduce((sum, c) => sum + c.replyRate, 0) / campaigns.length,
      }
    : { openRate: 0, replyRate: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduledToday = campaigns.filter((c) => {
    if (!c.nextSendAt) return false;
    return new Date(c.nextSendAt) >= today;
  }).length;

  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const dayActivities = activities.filter((a) => {
      const d = new Date(a.occurredAt);
      return d >= date && d < next;
    });
    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      sent: dayActivities.filter((a) => a.type === 'sent').length,
      opened: dayActivities.filter((a) => a.type === 'opened').length,
      replied: dayActivities.filter((a) => a.type === 'replied').length,
    };
  });

  return { totalProspects, activeCampaigns, emailsSent, openRate: rates.openRate, replyRate: rates.replyRate, scheduledToday, trend };
}

export function listActivities(limit = 6): Activity[] {
  return [...activities].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, limit);
}

export function listCampaigns(params?: { search?: string; status?: CampaignStatusType }): Campaign[] {
  let result = [...campaigns];
  if (params?.status) result = result.filter((c) => c.status === params.status);
  if (params?.search) {
    const s = params.search.toLowerCase();
    result = result.filter((c) => c.name.toLowerCase().includes(s) || c.audience.toLowerCase().includes(s));
  }
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getCampaign(id: number): { campaign: Campaign; steps: SequenceStep[] } | undefined {
  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) return undefined;
  const steps = sequenceSteps.filter((s) => s.campaignId === id).sort((a, b) => a.position - b.position);
  return { campaign, steps };
}

export function createCampaign(data: { name: string; audience: string }): Campaign {
  const campaign: Campaign = {
    id: nextCampaignId++,
    name: data.name,
    audience: data.audience,
    status: 'draft',
    sentCount: 0,
    openRate: 0,
    replyRate: 0,
    nextSendAt: null,
    createdAt: new Date().toISOString(),
    stepCount: 0,
  };
  campaigns.push(campaign);
  return campaign;
}

export function updateCampaign(id: number, data: { name?: string; audience?: string }): Campaign | undefined {
  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) return undefined;
  if (data.name) campaign.name = data.name;
  if (data.audience) campaign.audience = data.audience;
  return campaign;
}

export function deleteCampaign(id: number): boolean {
  const index = campaigns.findIndex((c) => c.id === id);
  if (index === -1) return false;
  campaigns.splice(index, 1);
  // Delete related steps
  for (let i = sequenceSteps.length - 1; i >= 0; i--) {
    if (sequenceSteps[i].campaignId === id) sequenceSteps.splice(i, 1);
  }
  return true;
}

export function updateCampaignStatus(id: number, status: CampaignStatusType): Campaign | undefined {
  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) return undefined;
  campaign.status = status;
  return campaign;
}

export function listCampaignSteps(campaignId: number): SequenceStep[] {
  return sequenceSteps.filter((s) => s.campaignId === campaignId).sort((a, b) => a.position - b.position);
}

export function createCampaignStep(campaignId: number, data: { subject: string; body: string; delayDays: number }): SequenceStep {
  const existing = sequenceSteps.filter((s) => s.campaignId === campaignId);
  const maxPos = existing.length ? Math.max(...existing.map((s) => s.position)) : 0;
  const step: SequenceStep = {
    id: nextStepId++,
    campaignId,
    position: maxPos + 1,
    subject: data.subject,
    body: data.body,
    delayDays: data.delayDays,
    sentCount: 0,
    openRate: 0,
    replyRate: 0,
  };
  sequenceSteps.push(step);
  // Update campaign step count
  const campaign = campaigns.find((c) => c.id === campaignId);
  if (campaign) campaign.stepCount = sequenceSteps.filter((s) => s.campaignId === campaignId).length;
  return step;
}

export function updateCampaignStep(campaignId: number, stepId: number, data: { subject?: string; body?: string; delayDays?: number }): SequenceStep | undefined {
  const step = sequenceSteps.find((s) => s.id === stepId && s.campaignId === campaignId);
  if (!step) return undefined;
  if (data.subject !== undefined) step.subject = data.subject;
  if (data.body !== undefined) step.body = data.body;
  if (data.delayDays !== undefined) step.delayDays = data.delayDays;
  return step;
}

export function deleteCampaignStep(campaignId: number, stepId: number): boolean {
  const index = sequenceSteps.findIndex((s) => s.id === stepId && s.campaignId === campaignId);
  if (index === -1) return false;
  sequenceSteps.splice(index, 1);
  const campaign = campaigns.find((c) => c.id === campaignId);
  if (campaign) campaign.stepCount = sequenceSteps.filter((s) => s.campaignId === campaignId).length;
  return true;
}

export function listProspects(params?: { search?: string; status?: ProspectStatusType; campaignId?: number }): Prospect[] {
  let result = [...prospects];
  if (params?.status) result = result.filter((p) => p.status === params.status);
  if (params?.campaignId) result = result.filter((p) => p.campaignId === params.campaignId);
  if (params?.search) {
    const s = params.search.toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s) || p.company.toLowerCase().includes(s));
  }
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createProspect(data: { name: string; email: string; company: string; role: string; campaignId?: number | null }): Prospect {
  const prospect: Prospect = {
    id: nextProspectId++,
    name: data.name,
    email: data.email,
    company: data.company,
    role: data.role,
    status: 'active',
    campaignId: data.campaignId ?? null,
    lastContactedAt: null,
    createdAt: new Date().toISOString(),
  };
  prospects.push(prospect);
  return prospect;
}

export function updateProspect(id: number, data: { name?: string; email?: string; company?: string; role?: string; campaignId?: number | null }): Prospect | undefined {
  const prospect = prospects.find((p) => p.id === id);
  if (!prospect) return undefined;
  if (data.name !== undefined) prospect.name = data.name;
  if (data.email !== undefined) prospect.email = data.email;
  if (data.company !== undefined) prospect.company = data.company;
  if (data.role !== undefined) prospect.role = data.role;
  if (data.campaignId !== undefined) prospect.campaignId = data.campaignId;
  return prospect;
}

export function deleteProspect(id: number): boolean {
  const index = prospects.findIndex((p) => p.id === id);
  if (index === -1) return false;
  prospects.splice(index, 1);
  return true;
}
