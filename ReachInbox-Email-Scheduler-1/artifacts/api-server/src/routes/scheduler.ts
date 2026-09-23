import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  activitiesTable,
  campaignsTable,
  prospectsTable,
  sequenceStepsTable,
} from "@workspace/db";
import {
  CreateCampaignBody,
  CreateCampaignResponse,
  CreateCampaignStepBody,
  CreateCampaignStepParams,
  CreateCampaignStepResponse,
  CreateProspectBody,
  CreateProspectResponse,
  DeleteCampaignParams,
  DeleteCampaignStepParams,
  DeleteProspectParams,
  GetCampaignParams,
  GetCampaignResponse,
  GetDashboardSummaryResponse,
  ListActivitiesQueryParams,
  ListActivitiesResponse,
  ListCampaignsQueryParams,
  ListCampaignsResponse,
  ListCampaignStepsParams,
  ListCampaignStepsResponse,
  ListProspectsQueryParams,
  ListProspectsResponse,
  UpdateCampaignBody,
  UpdateCampaignParams,
  UpdateCampaignResponse,
  UpdateCampaignStatusBody,
  UpdateCampaignStatusParams,
  UpdateCampaignStatusResponse,
  UpdateCampaignStepBody,
  UpdateCampaignStepParams,
  UpdateCampaignStepResponse,
  UpdateProspectBody,
  UpdateProspectParams,
  UpdateProspectResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const notFound = (res: Parameters<Parameters<IRouter["get"]>[1]>[1]) => {
  res.status(404).json({ error: "Resource not found" });
};

async function findCampaignView(id: number) {
  const [row] = await db
    .select({
      campaign: campaignsTable,
      stepCount: count(sequenceStepsTable.id),
    })
    .from(campaignsTable)
    .leftJoin(
      sequenceStepsTable,
      eq(sequenceStepsTable.campaignId, campaignsTable.id),
    )
    .where(eq(campaignsTable.id, id))
    .groupBy(campaignsTable.id);

  if (!row) return undefined;
  return { ...row.campaign, stepCount: Number(row.stepCount) };
}

async function listCampaignViews() {
  const rows = await db
    .select({
      campaign: campaignsTable,
      stepCount: count(sequenceStepsTable.id),
    })
    .from(campaignsTable)
    .leftJoin(
      sequenceStepsTable,
      eq(sequenceStepsTable.campaignId, campaignsTable.id),
    )
    .groupBy(campaignsTable.id)
    .orderBy(desc(campaignsTable.createdAt));

  return rows.map((row) => ({
    ...row.campaign,
    stepCount: Number(row.stepCount),
  }));
}

function getId(rawId: string | string[]) {
  return typeof rawId === "string" ? rawId : rawId[0];
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [prospectCount] = await db
    .select({ value: count() })
    .from(prospectsTable);
  const [activeCampaignCount] = await db
    .select({ value: count() })
    .from(campaignsTable)
    .where(eq(campaignsTable.status, "running"));
  const [sentTotal] = await db
    .select({ value: sql<number>`coalesce(sum(${campaignsTable.sentCount}), 0)` })
    .from(campaignsTable);
  const [scheduledToday] = await db
    .select({ value: count() })
    .from(campaignsTable)
    .where(gte(campaignsTable.nextSendAt, new Date(new Date().setHours(0, 0, 0, 0))));
  const [rates] = await db
    .select({
      openRate: sql<number>`coalesce(avg(${campaignsTable.openRate}), 0)`,
      replyRate: sql<number>`coalesce(avg(${campaignsTable.replyRate}), 0)`,
    })
    .from(campaignsTable);

  const recentActivities = await db
    .select()
    .from(activitiesTable)
    .orderBy(desc(activitiesTable.occurredAt))
    .limit(100);
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const dayActivities = recentActivities.filter(
      (activity) =>
        activity.occurredAt >= date && activity.occurredAt < next,
    );
    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      sent: dayActivities.filter((activity) => activity.type === "sent").length,
      opened: dayActivities.filter((activity) => activity.type === "opened").length,
      replied: dayActivities.filter((activity) => activity.type === "replied").length,
    };
  });

  res.json(
    GetDashboardSummaryResponse.parse({
      totalProspects: Number(prospectCount.value),
      activeCampaigns: Number(activeCampaignCount.value),
      emailsSent: Number(sentTotal.value),
      openRate: Number(rates?.openRate ?? 0),
      replyRate: Number(rates?.replyRate ?? 0),
      scheduledToday: Number(scheduledToday.value),
      trend,
    }),
  );
});

router.get("/activities", async (req, res): Promise<void> => {
  const query = ListActivitiesQueryParams.parse(req.query);
  const activities = await db
    .select()
    .from(activitiesTable)
    .orderBy(desc(activitiesTable.occurredAt))
    .limit(query.limit);
  res.json(ListActivitiesResponse.parse(activities));
});

router.get("/campaigns", async (req, res): Promise<void> => {
  const query = ListCampaignsQueryParams.parse(req.query);
  let campaigns = await listCampaignViews();
  if (query.status) {
    campaigns = campaigns.filter((campaign) => campaign.status === query.status);
  }
  if (query.search) {
    const search = query.search.toLowerCase();
    campaigns = campaigns.filter(
      (campaign) =>
        campaign.name.toLowerCase().includes(search) ||
        campaign.audience.toLowerCase().includes(search),
    );
  }
  res.json(ListCampaignsResponse.parse(campaigns));
});

router.post("/campaigns", async (req, res): Promise<void> => {
  const body = CreateCampaignBody.parse(req.body);
  const [campaign] = await db
    .insert(campaignsTable)
    .values({ ...body, status: "draft" })
    .returning();
  res.status(201).json(
    CreateCampaignResponse.parse({
      ...campaign,
      stepCount: 0,
    }),
  );
});

router.get("/campaigns/:id", async (req, res): Promise<void> => {
  const params = GetCampaignParams.parse({ id: getId(req.params.id) });
  const campaign = await findCampaignView(params.id);
  if (!campaign) {
    notFound(res);
    return;
  }
  const steps = await db
    .select()
    .from(sequenceStepsTable)
    .where(eq(sequenceStepsTable.campaignId, params.id))
    .orderBy(asc(sequenceStepsTable.position));
  res.json(GetCampaignResponse.parse({ campaign, steps }));
});

router.patch("/campaigns/:id", async (req, res): Promise<void> => {
  const params = UpdateCampaignParams.parse({ id: getId(req.params.id) });
  const body = UpdateCampaignBody.parse(req.body);
  const [updated] = await db
    .update(campaignsTable)
    .set(body)
    .where(eq(campaignsTable.id, params.id))
    .returning();
  if (!updated) {
    notFound(res);
    return;
  }
  const campaign = await findCampaignView(params.id);
  res.json(UpdateCampaignResponse.parse(campaign));
});

router.delete("/campaigns/:id", async (req, res): Promise<void> => {
  const params = DeleteCampaignParams.parse({ id: getId(req.params.id) });
  const [deleted] = await db
    .delete(campaignsTable)
    .where(eq(campaignsTable.id, params.id))
    .returning();
  if (!deleted) {
    notFound(res);
    return;
  }
  res.sendStatus(204);
});

router.patch("/campaigns/:id/status", async (req, res): Promise<void> => {
  const params = UpdateCampaignStatusParams.parse({ id: getId(req.params.id) });
  const body = UpdateCampaignStatusBody.parse(req.body);
  const [updated] = await db
    .update(campaignsTable)
    .set({ status: body.status })
    .where(eq(campaignsTable.id, params.id))
    .returning();
  if (!updated) {
    notFound(res);
    return;
  }
  const campaign = await findCampaignView(params.id);
  res.json(UpdateCampaignStatusResponse.parse(campaign));
});

router.get("/campaigns/:id/steps", async (req, res): Promise<void> => {
  const params = ListCampaignStepsParams.parse({ id: getId(req.params.id) });
  const campaign = await findCampaignView(params.id);
  if (!campaign) {
    notFound(res);
    return;
  }
  const steps = await db
    .select()
    .from(sequenceStepsTable)
    .where(eq(sequenceStepsTable.campaignId, params.id))
    .orderBy(asc(sequenceStepsTable.position));
  res.json(ListCampaignStepsResponse.parse(steps));
});

router.post("/campaigns/:id/steps", async (req, res): Promise<void> => {
  const params = CreateCampaignStepParams.parse({ id: getId(req.params.id) });
  const body = CreateCampaignStepBody.parse(req.body);
  const campaign = await findCampaignView(params.id);
  if (!campaign) {
    notFound(res);
    return;
  }
  const [last] = await db
    .select({ position: sequenceStepsTable.position })
    .from(sequenceStepsTable)
    .where(eq(sequenceStepsTable.campaignId, params.id))
    .orderBy(desc(sequenceStepsTable.position))
    .limit(1);
  const [step] = await db
    .insert(sequenceStepsTable)
    .values({
      campaignId: params.id,
      position: (last?.position ?? 0) + 1,
      ...body,
    })
    .returning();
  res.status(201).json(CreateCampaignStepResponse.parse(step));
});

router.patch(
  "/campaigns/:id/steps/:stepId",
  async (req, res): Promise<void> => {
    const params = UpdateCampaignStepParams.parse({
      id: getId(req.params.id),
      stepId: getId(req.params.stepId),
    });
    const body = UpdateCampaignStepBody.parse(req.body);
    const [updated] = await db
      .update(sequenceStepsTable)
      .set(body)
      .where(
        and(
          eq(sequenceStepsTable.id, params.stepId),
          eq(sequenceStepsTable.campaignId, params.id),
        ),
      )
      .returning();
    if (!updated) {
      notFound(res);
      return;
    }
    res.json(UpdateCampaignStepResponse.parse(updated));
  },
);

router.delete(
  "/campaigns/:id/steps/:stepId",
  async (req, res): Promise<void> => {
    const params = DeleteCampaignStepParams.parse({
      id: getId(req.params.id),
      stepId: getId(req.params.stepId),
    });
    const [deleted] = await db
      .delete(sequenceStepsTable)
      .where(
        and(
          eq(sequenceStepsTable.id, params.stepId),
          eq(sequenceStepsTable.campaignId, params.id),
        ),
      )
      .returning();
    if (!deleted) {
      notFound(res);
      return;
    }
    res.sendStatus(204);
  },
);

router.get("/prospects", async (req, res): Promise<void> => {
  const query = ListProspectsQueryParams.parse(req.query);
  const filters = [];
  if (query.status) filters.push(eq(prospectsTable.status, query.status));
  if (query.campaignId) filters.push(eq(prospectsTable.campaignId, query.campaignId));
  if (query.search) {
    const term = `%${query.search}%`;
    filters.push(
      or(
        ilike(prospectsTable.name, term),
        ilike(prospectsTable.email, term),
        ilike(prospectsTable.company, term),
      ),
    );
  }
  const prospects = await db
    .select()
    .from(prospectsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(prospectsTable.createdAt));
  res.json(ListProspectsResponse.parse(prospects));
});

router.post("/prospects", async (req, res): Promise<void> => {
  const body = CreateProspectBody.parse(req.body);
  const [prospect] = await db
    .insert(prospectsTable)
    .values({ ...body, campaignId: body.campaignId ?? null })
    .returning();
  res.status(201).json(CreateProspectResponse.parse(prospect));
});

router.patch("/prospects/:id", async (req, res): Promise<void> => {
  const params = UpdateProspectParams.parse({ id: getId(req.params.id) });
  const body = UpdateProspectBody.parse(req.body);
  const [updated] = await db
    .update(prospectsTable)
    .set({ ...body, campaignId: body.campaignId ?? undefined })
    .where(eq(prospectsTable.id, params.id))
    .returning();
  if (!updated) {
    notFound(res);
    return;
  }
  res.json(UpdateProspectResponse.parse(updated));
});

router.delete("/prospects/:id", async (req, res): Promise<void> => {
  const params = DeleteProspectParams.parse({ id: getId(req.params.id) });
  const [deleted] = await db
    .delete(prospectsTable)
    .where(eq(prospectsTable.id, params.id))
    .returning();
  if (!deleted) {
    notFound(res);
    return;
  }
  res.sendStatus(204);
});

export default router;