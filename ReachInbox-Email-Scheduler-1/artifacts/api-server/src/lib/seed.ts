import { count } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  activitiesTable,
  campaignsTable,
  prospectsTable,
  sequenceStepsTable,
} from "@workspace/db";

function daysFromNow(days: number, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

export async function ensureSeedData(): Promise<void> {
  const [existing] = await db
    .select({ value: count() })
    .from(campaignsTable);
  if (Number(existing.value) > 0) return;

  const [launchCampaign, founderCampaign, reengageCampaign] = await db
    .insert(campaignsTable)
    .values([
      {
        name: "Product-led teams",
        audience: "SaaS founders & growth leads",
        status: "running",
        sentCount: 284,
        openRate: 0.48,
        replyRate: 0.12,
        nextSendAt: daysFromNow(0, 14),
      },
      {
        name: "Founder network",
        audience: "Early-stage founders",
        status: "paused",
        sentCount: 156,
        openRate: 0.41,
        replyRate: 0.09,
        nextSendAt: daysFromNow(1, 10),
      },
      {
        name: "Q4 re-engagement",
        audience: "Warm leads from Q3",
        status: "draft",
        sentCount: 0,
        openRate: 0,
        replyRate: 0,
        nextSendAt: null,
      },
    ])
    .returning();

  await db.insert(sequenceStepsTable).values([
    {
      campaignId: launchCampaign.id,
      position: 1,
      subject: "A faster way to keep your pipeline moving",
      body: "Hi {{firstName}},\n\nNoticed the work your team is doing at {{company}}. We help small growth teams keep thoughtful follow-ups moving without adding more busywork.\n\nWould it be useful to compare notes?",
      delayDays: 0,
      sentCount: 142,
      openRate: 0.52,
      replyRate: 0.11,
    },
    {
      campaignId: launchCampaign.id,
      position: 2,
      subject: "Worth a closer look?",
      body: "Hi {{firstName}},\n\nSharing a little more context in case this is on your roadmap. The teams we work with usually save a few hours each week while their replies stay personal.\n\nOpen to a quick look?",
      delayDays: 3,
      sentCount: 96,
      openRate: 0.44,
      replyRate: 0.1,
    },
    {
      campaignId: launchCampaign.id,
      position: 3,
      subject: "Closing the loop",
      body: "Hi {{firstName}},\n\nI’ll close the loop here for now. If improving outbound follow-up becomes a priority, I’d be glad to pick this back up.\n\nEither way, wishing you a strong quarter.",
      delayDays: 5,
      sentCount: 46,
      openRate: 0.39,
      replyRate: 0.15,
    },
    {
      campaignId: founderCampaign.id,
      position: 1,
      subject: "A note on building repeatable outbound",
      body: "Hi {{firstName}},\n\nI’m speaking with a few founders about the systems behind repeatable outbound. Your work at {{company}} caught my eye.\n\nWould a short exchange be useful?",
      delayDays: 0,
      sentCount: 156,
      openRate: 0.41,
      replyRate: 0.09,
    },
    {
      campaignId: reengageCampaign.id,
      position: 1,
      subject: "Still on your radar?",
      body: "Hi {{firstName}},\n\nIt’s been a little while since we last connected. I wanted to see if this is still relevant for your team this quarter.\n\nNo pressure either way.",
      delayDays: 0,
      sentCount: 0,
      openRate: 0,
      replyRate: 0,
    },
  ]);

  await db.insert(prospectsTable).values([
    {
      name: "Maya Chen",
      email: "maya@northstar.dev",
      company: "Northstar",
      role: "VP Growth",
      status: "replied",
      campaignId: launchCampaign.id,
      lastContactedAt: daysFromNow(-1, 11),
    },
    {
      name: "Noah Williams",
      email: "noah@orbitlabs.co",
      company: "Orbit Labs",
      role: "Founder",
      status: "active",
      campaignId: launchCampaign.id,
      lastContactedAt: daysFromNow(-2, 15),
    },
    {
      name: "Sofia Patel",
      email: "sofia@joinatlas.com",
      company: "Atlas",
      role: "Head of Sales",
      status: "active",
      campaignId: founderCampaign.id,
      lastContactedAt: daysFromNow(-3, 9),
    },
    {
      name: "Liam Foster",
      email: "liam@latticework.io",
      company: "Latticework",
      role: "Co-founder",
      status: "bounced",
      campaignId: launchCampaign.id,
      lastContactedAt: daysFromNow(-4, 13),
    },
    {
      name: "Amara Okafor",
      email: "amara@threadline.ai",
      company: "Threadline",
      role: "Revenue Lead",
      status: "active",
      campaignId: reengageCampaign.id,
      lastContactedAt: null,
    },
  ]);

  await db.insert(activitiesTable).values([
    {
      type: "replied",
      message: "replied to step 2",
      prospectName: "Maya Chen",
      campaignName: "Product-led teams",
      occurredAt: daysFromNow(0, 9),
    },
    {
      type: "opened",
      message: "opened email 3 times",
      prospectName: "Noah Williams",
      campaignName: "Product-led teams",
      occurredAt: daysFromNow(0, 8),
    },
    {
      type: "sent",
      message: "received step 1",
      prospectName: "Sofia Patel",
      campaignName: "Founder network",
      occurredAt: daysFromNow(-1, 16),
    },
    {
      type: "opened",
      message: "opened email",
      prospectName: "Amara Okafor",
      campaignName: "Q4 re-engagement",
      occurredAt: daysFromNow(-2, 12),
    },
    {
      type: "bounced",
      message: "email bounced",
      prospectName: "Liam Foster",
      campaignName: "Product-led teams",
      occurredAt: daysFromNow(-3, 14),
    },
    {
      type: "sent",
      message: "received step 2",
      prospectName: "Maya Chen",
      campaignName: "Product-led teams",
      occurredAt: daysFromNow(-4, 10),
    },
    {
      type: "replied",
      message: "replied to step 1",
      prospectName: "Sofia Patel",
      campaignName: "Founder network",
      occurredAt: daysFromNow(-5, 15),
    },
  ]);
}