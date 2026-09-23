import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity as ActivityIcon,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CirclePause,
  CirclePlay,
  Clock3,
  Command,
  Edit3,
  Filter,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  ListFilter,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  CampaignStatus,
  ProspectStatus,
  getGetCampaignQueryKey,
  getGetDashboardSummaryQueryKey,
  getListActivitiesQueryKey,
  getListCampaignStepsQueryKey,
  getListCampaignsQueryKey,
  getListProspectsQueryKey,
  useCreateCampaign,
  useCreateCampaignStep,
  useCreateProspect,
  useDeleteCampaign,
  useDeleteCampaignStep,
  useDeleteProspect,
  useGetCampaign,
  useGetDashboardSummary,
  useListActivities,
  useListCampaignSteps,
  useListCampaigns,
  useListProspects,
  useUpdateCampaign,
  useUpdateCampaignStatus,
  useUpdateCampaignStep,
  useUpdateProspect,
  type Campaign,
  type CampaignStatusType,
  type Prospect,
  type ProspectStatusType,
  type SequenceStep,
} from './hooks';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';

const queryClient = new QueryClient();

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
const fmtNumber = (value: number | undefined) => new Intl.NumberFormat('en-US').format(value ?? 0);
const fmtPct = (value: number | undefined) => `${(value ?? 0).toFixed(1)}%`;
const initials = (name: string) => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const relativeTime = (date: string | null | undefined) => {
  if (!date) return 'Not scheduled';
  const diff = Math.round((new Date(date).getTime() - Date.now()) / 60000);
  if (Math.abs(diff) < 60) return diff <= 0 ? 'Just now' : `In ${diff}m`;
  const hours = Math.round(diff / 60);
  if (Math.abs(hours) < 24) return hours <= 0 ? `${Math.abs(hours)}h ago` : `In ${hours}h`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const formatDate = (date: string | null | undefined) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function StatusPill({ status }: { status: CampaignStatusType | ProspectStatusType }) {
  const labels: Record<string, string> = { running: 'Running', paused: 'Paused', draft: 'Draft', completed: 'Completed', active: 'Active', replied: 'Replied', bounced: 'Bounced', unsubscribed: 'Unsubscribed' };
  return <span data-testid={`status-${status}`} className={cx('status-pill', `status-${status}`)}><span className="status-dot" />{labels[status] ?? status}</span>;
}

function LoadingRows({ count = 5 }: { count?: number }) {
  return <div className="space-y-3" data-testid="loading-state">{Array.from({ length: count }, (_, index) => <div className="panel p-4 flex items-center gap-4" key={index}><div className="skeleton h-9 w-9 rounded-full" /><div className="flex-1 space-y-2"><div className="skeleton h-3 w-2/5 rounded" /><div className="skeleton h-3 w-1/4 rounded" /></div><div className="skeleton h-5 w-20 rounded" /></div>)}</div>;
}

function EmptyState({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state" data-testid="empty-state"><div className="empty-mark"><Inbox size={22} /></div><h3>{title}</h3><p>{description}</p>{action && onAction && <button data-testid="button-empty-action" className="button button-primary mt-4" onClick={onAction}><Plus size={16} />{action}</button>}</div>;
}

function QueryError({ onRetry }: { onRetry?: () => void }) {
  return <div className="empty-state border border-destructive/25" data-testid="error-state"><div className="empty-mark error"><RefreshCw size={21} /></div><h3>Could not load this view</h3><p>Something interrupted the connection. Your workspace is safe.</p>{onRetry && <button data-testid="button-retry" className="button button-secondary mt-4" onClick={onRetry}>Try again</button>}</div>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/campaigns', label: 'Campaigns', icon: Send },
    { href: '/prospects', label: 'Prospects', icon: Users },
  ];
  return <div className="app-shell">
    <aside className={cx('sidebar', mobileOpen && 'mobile-open')}>
      <div className="brand"><div className="brand-glyph"><Zap size={17} fill="currentColor" /></div><span>reach<span>inbox</span></span></div>
      <div className="workspace-switcher"><div className="workspace-avatar">NR</div><div className="workspace-copy"><strong>Northstar RevOps</strong><small>Sales workspace</small></div><ChevronDown size={15} /></div>
      <div className="sidebar-label">Workspace</div>
      <nav className="side-nav">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-${label.toLowerCase()}`} className={cx('side-link', (href === '/' ? location === '/' : location.startsWith(href)) && 'active')} onClick={() => setMobileOpen(false)}><Icon size={18} /><span>{label}</span>{label === 'Campaigns' && <span className="nav-count">12</span>}</Link>)}</nav>
      <div className="sidebar-spacer" />
      <div className="signal-card"><div className="signal-top"><span className="signal-live" />Delivery health</div><strong>All systems steady</strong><div className="signal-bar"><span /></div><small>Last checked just now</small></div>
      <nav className="side-nav side-nav-bottom"><Link href="/settings" data-testid="link-settings" className="side-link"><Settings2 size={18} /><span>Settings</span></Link><button data-testid="button-support" className="side-link side-button"><LifeBuoy size={18} /><span>Support</span></button></nav>
      <div className="profile-row"><div className="profile-avatar">AR</div><div><strong>Alex Rivera</strong><small>Admin</small></div><MoreHorizontal size={16} className="ml-auto text-slate-400" /></div>
    </aside>
    <div className="main-wrap">
      <header className="topbar"><button data-testid="button-mobile-menu" className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)}><ListFilter size={18} /></button><div className="breadcrumb"><span>Northstar RevOps</span><ChevronRight size={14} /><strong>{location === '/' ? 'Overview' : location.startsWith('/campaigns') ? 'Campaigns' : 'Prospects'}</strong></div><div className="topbar-actions"><button data-testid="button-command" className="icon-button"><Command size={17} /></button><button data-testid="button-notifications" className="icon-button notification"><Bell size={17} /><i /></button><button data-testid="button-help" className="icon-button"><LifeBuoy size={17} /></button></div></header>
      <main className="page-content">{children}</main>
    </div>
  </div>;
}

function PageHeader({ eyebrow, title, description, action, onAction }: { eyebrow: string; title: string; description?: string; action?: string; onAction?: () => void }) {
  return <div className="page-header fade-up"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && onAction && <button data-testid="button-primary-action" className="button button-primary" onClick={onAction}><Plus size={17} />{action}</button>}</div>;
}

function MetricCard({ icon: Icon, label, value, detail, trend, tone = 'mint' }: { icon: typeof Send; label: string; value: string; detail: string; trend?: 'up' | 'down'; tone?: string }) {
  return <div className={cx('metric-card panel', `metric-${tone}`)}><div className="metric-icon"><Icon size={17} /></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className={cx('metric-detail', trend === 'up' ? 'trend-up' : trend === 'down' && 'trend-down')}>{trend === 'up' && <ArrowUpRight size={13} />}{trend === 'down' && <ArrowDownRight size={13} />}{detail}</div></div>;
}

function MiniChart({ trend }: { trend?: Array<{ label: string; sent: number; opened: number; replied: number }> }) {
  const points = trend?.length ? trend : [{ label: 'M', sent: 24, opened: 10, replied: 4 }, { label: 'T', sent: 38, opened: 18, replied: 6 }, { label: 'W', sent: 30, opened: 13, replied: 5 }, { label: 'T', sent: 52, opened: 25, replied: 8 }, { label: 'F', sent: 45, opened: 21, replied: 7 }, { label: 'S', sent: 60, opened: 31, replied: 12 }, { label: 'S', sent: 54, opened: 26, replied: 9 }];
  const max = Math.max(...points.map((point) => point.sent), 1);
  return <div className="chart-wrap"><div className="chart-y"><span>{max}</span><span>{Math.round(max / 2)}</span><span>0</span></div><div className="chart-area"><div className="chart-grid-line one" /><div className="chart-grid-line two" /><div className="bars">{points.map((point, index) => <div className="bar-group" key={`${point.label}-${index}`}><div className="bar-stack"><span className="bar sent" style={{ height: `${(point.sent / max) * 100}%` }} /><span className="bar opened" style={{ height: `${(point.opened / max) * 100}%` }} /><span className="bar replied" style={{ height: `${(point.replied / max) * 100}%` }} /></div><small>{point.label}</small></div>)}</div></div></div>;
}

function Dashboard() {
  const summary = useGetDashboardSummary();
  const activities = useListActivities({ limit: 6 });
  const campaigns = useListCampaigns();
  return <Shell><PageHeader eyebrow="Monday, October 21 · 9:41 AM" title="Good morning, Alex." description="Here's the pulse of your outbound motion." action="New campaign" onAction={() => { window.history.pushState({}, '', '/campaigns/new'); window.dispatchEvent(new PopStateEvent('popstate')); }} /><div className="dashboard-grid dashboard-canvas">
    <section className="metric-grid fade-up-2">
      <MetricCard icon={Users} label="Total prospects" value={fmtNumber(summary.data?.totalProspects)} detail="+8.4% from last month" trend="up" tone="blue" />
      <MetricCard icon={Zap} label="Active campaigns" value={fmtNumber(summary.data?.activeCampaigns)} detail="2 launching this week" tone="mint" />
      <MetricCard icon={Send} label="Emails sent" value={fmtNumber(summary.data?.emailsSent)} detail="+14.2% from last month" trend="up" tone="orange" />
      <MetricCard icon={CircleCheck} label="Reply rate" value={fmtPct(summary.data?.replyRate)} detail="Healthy for your segment" trend="up" tone="violet" />
    </section>
    <section className="overview-grid fade-up-3">
      <div className="panel chart-panel"><div className="panel-heading"><div><div className="eyebrow">Outbound activity</div><h2>Momentum, in motion</h2></div><div className="chart-controls"><button className="period-button active" data-testid="button-period-week">7 days</button><button className="period-button" data-testid="button-period-month">30 days</button></div></div><div className="chart-legend"><span><i className="legend-swatch sent" />Sent</span><span><i className="legend-swatch opened" />Opened</span><span><i className="legend-swatch replied" />Replied</span></div><MiniChart trend={summary.data?.trend} /></div>
      <div className="panel scheduled-panel"><div className="panel-heading"><div><div className="eyebrow">Today</div><h2>On the runway</h2></div><Clock3 size={18} className="text-slate-400" /></div><div className="scheduled-number">{fmtNumber(summary.data?.scheduledToday)}<span>emails scheduled</span></div><div className="runway"><span style={{ width: `${Math.min(((summary.data?.scheduledToday ?? 0) / 150) * 100, 100)}%` }} /></div><div className="runway-copy"><span>Next send <strong>10:30 AM</strong></span><span>Capacity <strong>150</strong></span></div><div className="next-campaign"><div className="tiny-avatar">SA</div><div><strong>Signal & Story</strong><small>32 prospects · step 2 of 4</small></div><ChevronRight size={16} className="ml-auto text-slate-400" /></div></div>
    </section>
    <section className="lower-grid fade-up-3"><div className="panel activity-panel"><div className="panel-heading"><div><div className="eyebrow">Live feed</div><h2>Recent activity</h2></div><Link href="/campaigns" data-testid="link-view-all-activity" className="text-link">View all <ChevronRight size={14} /></Link></div>{activities.isLoading ? <LoadingRows count={4} /> : activities.isError ? <QueryError onRetry={() => void activities.refetch()} /> : !activities.data?.length ? <EmptyState title="Your feed is quiet" description="Campaign events will show up here as messages move." /> : <div className="activity-list">{activities.data.map((item) => <div className="activity-row" key={item.id} data-testid={`activity-row-${item.id}`}><div className={cx('activity-icon', `activity-${item.type}`)}>{item.type === 'sent' ? <Send size={15} /> : item.type === 'opened' ? <Inbox size={15} /> : item.type === 'replied' ? <ActivityIcon size={15} /> : <X size={15} />}</div><div className="activity-copy"><strong>{item.message}</strong><span>{item.prospectName} · {item.campaignName}</span></div><time>{relativeTime(item.occurredAt)}</time></div>)}</div>}</div>
      <div className="panel campaigns-panel"><div className="panel-heading"><div><div className="eyebrow">Keep moving</div><h2>Active campaigns</h2></div><Link href="/campaigns" data-testid="link-view-all-campaigns" className="text-link">Manage <ChevronRight size={14} /></Link></div>{campaigns.isLoading ? <LoadingRows count={3} /> : campaigns.isError ? <QueryError onRetry={() => void campaigns.refetch()} /> : !campaigns.data?.length ? <EmptyState title="No campaigns yet" description="Start a sequence to create your first motion." action="Create campaign" onAction={() => window.location.assign('/campaigns/new')} /> : <div className="campaign-mini-list">{campaigns.data.filter((campaign) => campaign.status === 'running' || campaign.status === 'paused').slice(0, 4).map((campaign) => <Link href={`/campaigns/${campaign.id}`} className="campaign-mini-row" data-testid={`campaign-mini-${campaign.id}`} key={campaign.id}><div className="campaign-mark">{initials(campaign.name)}</div><div className="campaign-mini-copy"><strong>{campaign.name}</strong><span>{fmtNumber(campaign.sentCount)} sent · {fmtPct(campaign.replyRate)} replies</span></div><StatusPill status={campaign.status} /></Link>)}</div>}</div></section>
  </div></Shell>;
}

function Modal({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className={cx('modal-card', wide && 'modal-wide')}><div className="modal-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button data-testid="button-close-modal" className="icon-button" onClick={onClose}><X size={17} /></button></div>{children}</div></div>;
}

function CampaignForm({ campaign, onClose }: { campaign?: Campaign; onClose: () => void }) {
  const qc = useQueryClient();
  const create = useCreateCampaign();
  const update = useUpdateCampaign();
  const [name, setName] = useState(campaign?.name ?? '');
  const [audience, setAudience] = useState(campaign?.audience ?? '');
  const save = (event: FormEvent) => { event.preventDefault(); if (!name.trim() || !audience.trim()) return; const onSuccess = () => { void qc.invalidateQueries({ queryKey: getListCampaignsQueryKey() }); onClose(); }; if (campaign) update.mutate({ id: campaign.id, data: { name, audience } }, { onSuccess }); else create.mutate({ data: { name, audience } }, { onSuccess }); };
  const pending = create.isPending || update.isPending;
  return <Modal title={campaign ? 'Edit campaign' : 'Start a campaign'} subtitle={campaign ? 'Tidy up the details without interrupting the sequence.' : 'A clear name now makes every follow-up easier to find.'} onClose={onClose}><form onSubmit={save} className="form-stack"><label>Campaign name<input data-testid="input-campaign-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Q4 product leaders" /></label><label>Audience<input data-testid="input-campaign-audience" value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="e.g. Product leaders · UK · 50–500 employees" /></label><div className="form-note"><Sparkles size={15} /> You can add sequence steps next.</div><div className="modal-actions"><button data-testid="button-cancel-form" type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button data-testid="button-submit-campaign" className="button button-primary" disabled={pending || !name.trim() || !audience.trim()}>{pending ? 'Saving…' : campaign ? 'Save changes' : 'Create campaign'}</button></div></form></Modal>;
}

function Campaigns() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | CampaignStatusType>('all');
  const [formCampaign, setFormCampaign] = useState<Campaign | null | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const params = useMemo(() => ({ ...(search ? { search } : {}), ...(status !== 'all' ? { status } : {}) }), [search, status]);
  const query = useListCampaigns(params);
  const deleteCampaign = useDeleteCampaign();
  const statusMutation = useUpdateCampaignStatus();
  const changeStatus = (campaign: Campaign, next: CampaignStatusType) => statusMutation.mutate({ id: campaign.id, data: { status: next } }, { onSuccess: () => { void qc.invalidateQueries({ queryKey: getListCampaignsQueryKey() }); void qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); } });
  const remove = () => { if (deleteId === null) return; deleteCampaign.mutate({ id: deleteId }, { onSuccess: () => { void qc.invalidateQueries({ queryKey: getListCampaignsQueryKey() }); setDeleteId(null); } }); };
  return <Shell><PageHeader eyebrow="Workspace / Campaigns" title="Campaigns" description="Sequences with a steady hand. Keep every follow-up moving." action="New campaign" onAction={() => setFormCampaign(null)} /><div className="toolbar fade-up-2"><div className="search-box"><Search size={17} /><input data-testid="input-campaign-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search campaigns" /></div><div className="filter-tabs">{(['all', 'running', 'paused', 'draft', 'completed'] as const).map((item) => <button key={item} data-testid={`filter-campaign-${item}`} className={cx('filter-tab', status === item && 'active')} onClick={() => setStatus(item)}>{item === 'all' ? 'All campaigns' : item[0].toUpperCase() + item.slice(1)}</button>)}</div><button data-testid="button-campaign-filter" className="button button-secondary filter-button"><Filter size={15} /> Filters</button></div><div className="table-shell panel fade-up-3">{query.isLoading ? <LoadingRows count={5} /> : query.isError ? <QueryError onRetry={() => void query.refetch()} /> : !query.data?.length ? <EmptyState title={search || status !== 'all' ? 'No campaigns match' : 'Your campaign runway is clear'} description={search || status !== 'all' ? 'Try another search or clear the filter.' : 'Build your first sequence and give your best prospects a thoughtful next step.'} action={!search && status === 'all' ? 'Create campaign' : undefined} onAction={() => setFormCampaign(null)} /> : <><div className="table-heading"><span>{query.data.length} campaigns</span><span className="table-meta"><span className="live-dot" />Data updates live</span></div><div className="data-table campaign-table"><div className="table-row table-header"><span>Campaign</span><span>Audience</span><span>Performance</span><span>Next send</span><span>Status</span><span /></div>{query.data.map((campaign) => <div className="table-row" key={campaign.id} data-testid={`campaign-row-${campaign.id}`}><Link href={`/campaigns/${campaign.id}`} className="campaign-name-cell"><div className="campaign-mark">{initials(campaign.name)}</div><div><strong>{campaign.name}</strong><small>Created {formatDate(campaign.createdAt)}</small></div></Link><div className="muted-cell">{campaign.audience}</div><div className="performance-cell"><strong>{fmtNumber(campaign.sentCount)} sent</strong><span>{fmtPct(campaign.openRate)} opens · {fmtPct(campaign.replyRate)} replies</span></div><div className="muted-cell">{relativeTime(campaign.nextSendAt)}</div><div><StatusPill status={campaign.status} /></div><div className="row-actions"><button data-testid={`button-campaign-edit-${campaign.id}`} className="icon-button small" title="Edit campaign" onClick={() => setFormCampaign(campaign)}><Pencil size={15} /></button>{campaign.status === 'running' ? <button data-testid={`button-campaign-pause-${campaign.id}`} className="icon-button small" title="Pause campaign" onClick={() => changeStatus(campaign, CampaignStatus.paused)}><CirclePause size={15} /></button> : campaign.status !== 'completed' ? <button data-testid={`button-campaign-run-${campaign.id}`} className="icon-button small accent" title="Run campaign" onClick={() => changeStatus(campaign, CampaignStatus.running)}><CirclePlay size={15} /></button> : null}<button data-testid={`button-campaign-delete-${campaign.id}`} className="icon-button small danger" title="Delete campaign" onClick={() => setDeleteId(campaign.id)}><Trash2 size={15} /></button></div></div>)}</div></>}</div>{formCampaign !== undefined && <CampaignForm campaign={formCampaign ?? undefined} onClose={() => setFormCampaign(undefined)} />}{deleteId !== null && <Modal title="Delete this campaign?" subtitle="This removes the campaign and its sequence. This action cannot be undone." onClose={() => setDeleteId(null)}><div className="modal-actions"><button data-testid="button-cancel-delete" className="button button-secondary" onClick={() => setDeleteId(null)}>Keep campaign</button><button data-testid="button-confirm-delete" className="button button-danger" onClick={remove} disabled={deleteCampaign.isPending}>{deleteCampaign.isPending ? 'Deleting…' : 'Delete campaign'}</button></div></Modal>}</Shell>;
}

function NewCampaign() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const createCampaign = useCreateCampaign();
  const createStep = useCreateCampaignStep();
  const [name, setName] = useState('');
  const [audience, setAudience] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [delayDays, setDelayDays] = useState(0);
  const [stepReady, setStepReady] = useState(false);
  const submit = (event: FormEvent) => { event.preventDefault(); if (!name || !audience || !subject || !body) return; createCampaign.mutate({ data: { name, audience } }, { onSuccess: (campaign) => { createStep.mutate({ id: campaign.id, data: { subject, body, delayDays: Number(delayDays) } }, { onSuccess: () => { void qc.invalidateQueries({ queryKey: getListCampaignsQueryKey() }); setLocation(`/campaigns/${campaign.id}`); } }); } }); };
  return <Shell><div className="composer-page"><div className="back-line"><Link href="/campaigns" data-testid="link-back-campaigns"><ChevronLeft size={16} /> Campaigns</Link><span>New campaign</span></div><div className="composer-head"><div><div className="eyebrow">New sequence</div><h1>Make the first touch count.</h1><p>Set the intention now. The rest of the sequence can follow.</p></div><div className="composer-progress"><span className="done">01</span><i /><span className={stepReady ? 'done' : 'current'}>02</span><i /><span>03</span></div></div><form className="composer-grid" onSubmit={submit}><div className="composer-main panel"><div className="step-kicker"><span>01</span><div><strong>Campaign foundations</strong><small>Give your team the context they need.</small></div></div><div className="form-grid"><label>Campaign name<input data-testid="input-new-campaign-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Fintech founders · London" /></label><label>Audience<input data-testid="input-new-campaign-audience" value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="Who is this sequence for?" /></label></div><div className="step-divider" /><div className="step-kicker"><span>02</span><div><strong>Your opening email</strong><small>Specific beats clever. Write like a person.</small></div></div><label>Subject line<input data-testid="input-new-step-subject" value={subject} onChange={(event) => { setSubject(event.target.value); setStepReady(Boolean(event.target.value && body)); }} placeholder="A thought on {{company}}'s next chapter" /></label><label>Message<textarea data-testid="input-new-step-body" value={body} onChange={(event) => { setBody(event.target.value); setStepReady(Boolean(event.target.value && subject)); }} rows={9} placeholder={'Hi {{firstName}},\\n\\nI noticed {{company}} is…'} /><small className="field-hint">Use <code>{'{{firstName}}'}</code> and <code>{'{{company}}'}</code> to make each note feel personal.</small></label><div className="delay-row"><label>Send this step <select data-testid="select-new-step-delay" value={delayDays} onChange={(event) => setDelayDays(Number(event.target.value))}><option value={0}>Immediately</option><option value={1}>1 day after previous</option><option value={2}>2 days after previous</option><option value={3}>3 days after previous</option><option value={5}>5 days after previous</option></select></label><div className="preview-note"><Clock3 size={16} /><span>Suggested send window<br /><strong>Weekdays · 9:00–11:00 AM</strong></span></div></div></div><aside className="composer-aside"><div className="panel launch-card"><div className="launch-icon"><Sparkles size={19} /></div><h2>Ready when you are.</h2><p>Your campaign starts as a draft. You'll have a chance to review the sequence before anything sends.</p><button data-testid="button-create-and-start" className="button button-primary full" disabled={createCampaign.isPending || createStep.isPending || !name || !audience || !subject || !body}>{createCampaign.isPending || createStep.isPending ? 'Building sequence…' : 'Create campaign'}</button><Link href="/campaigns" data-testid="link-cancel-new" className="button button-ghost full">Save for later</Link></div><div className="aside-trust"><CircleCheck size={16} /><span>Nothing sends without your approval.</span></div></aside></form></div></Shell>;
}

function StepEditor({ step, campaignId, onClose }: { step?: SequenceStep; campaignId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const create = useCreateCampaignStep();
  const update = useUpdateCampaignStep();
  const [subject, setSubject] = useState(step?.subject ?? '');
  const [body, setBody] = useState(step?.body ?? '');
  const [delayDays, setDelayDays] = useState(step?.delayDays ?? 1);
  const save = (event: FormEvent) => { event.preventDefault(); if (!subject || !body) return; const onSuccess = () => { void qc.invalidateQueries({ queryKey: getListCampaignStepsQueryKey(campaignId) }); void qc.invalidateQueries({ queryKey: getGetCampaignQueryKey(campaignId) }); onClose(); }; if (step) update.mutate({ id: campaignId, stepId: step.id, data: { subject, body, delayDays: Number(delayDays) } }, { onSuccess }); else create.mutate({ id: campaignId, data: { subject, body, delayDays: Number(delayDays) } }, { onSuccess }); };
  return <Modal wide title={step ? `Edit step ${String(step.position).padStart(2, '0')}` : 'Add sequence step'} subtitle="Keep it clear, useful, and easy to reply to." onClose={onClose}><form onSubmit={save} className="form-stack"><label>Subject line<input data-testid="input-step-subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="A useful reason to reply" /></label><label>Message<textarea data-testid="input-step-body" value={body} onChange={(event) => setBody(event.target.value)} rows={10} placeholder="Write the note your prospect should receive…" /></label><label>Wait before sending<select data-testid="select-step-delay" value={delayDays} onChange={(event) => setDelayDays(Number(event.target.value))}><option value={0}>Immediately</option><option value={1}>1 day</option><option value={2}>2 days</option><option value={3}>3 days</option><option value={5}>5 days</option><option value={7}>7 days</option></select></label><div className="modal-actions"><button data-testid="button-cancel-step" type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button data-testid="button-save-step" className="button button-primary" disabled={!subject || !body || create.isPending || update.isPending}>{create.isPending || update.isPending ? 'Saving…' : step ? 'Save step' : 'Add step'}</button></div></form></Modal>;
}

function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const id = Number(params.id);
  const campaignQuery = useGetCampaign(id, { query: { queryKey: getGetCampaignQueryKey(id) } });
  const stepsQuery = useListCampaignSteps(id, { query: { queryKey: getListCampaignStepsQueryKey(id) } });
  const statusMutation = useUpdateCampaignStatus();
  const deleteStep = useDeleteCampaignStep();
  const [editor, setEditor] = useState<SequenceStep | null | undefined>(undefined);
  const campaign = campaignQuery.data?.campaign;
  const steps = stepsQuery.data ?? campaignQuery.data?.steps ?? [];
  const changeStatus = (status: CampaignStatusType) => statusMutation.mutate({ id, data: { status } }, { onSuccess: () => { void qc.invalidateQueries({ queryKey: getGetCampaignQueryKey(id) }); void qc.invalidateQueries({ queryKey: getListCampaignsQueryKey() }); void qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); } });
  const removeStep = (stepId: number) => { if (window.confirm('Delete this sequence step?')) deleteStep.mutate({ id, stepId }, { onSuccess: () => { void qc.invalidateQueries({ queryKey: getListCampaignStepsQueryKey(id) }); void qc.invalidateQueries({ queryKey: getGetCampaignQueryKey(id) }); } }); };
  if (campaignQuery.isLoading) return <Shell><LoadingRows count={4} /></Shell>;
  if (campaignQuery.isError || !campaign) return <Shell><QueryError onRetry={() => void campaignQuery.refetch()} /></Shell>;
  return <Shell><div className="detail-page"><div className="back-line"><Link href="/campaigns" data-testid="link-back-campaigns-detail"><ChevronLeft size={16} /> Campaigns</Link><span>Campaign detail</span></div><div className="detail-header"><div className="detail-title"><div className="campaign-mark large">{initials(campaign.name)}</div><div><div className="eyebrow">Campaign / {campaign.id.toString().padStart(3, '0')}</div><h1>{campaign.name}</h1><p>{campaign.audience}</p></div></div><div className="detail-actions"><StatusPill status={campaign.status} />{campaign.status === 'running' ? <button data-testid="button-detail-pause" className="button button-secondary" onClick={() => changeStatus(CampaignStatus.paused)}><CirclePause size={16} /> Pause</button> : campaign.status !== 'completed' ? <button data-testid="button-detail-start" className="button button-primary" onClick={() => changeStatus(CampaignStatus.running)}><CirclePlay size={16} /> {campaign.status === 'paused' ? 'Resume' : 'Start campaign'}</button> : null}<button data-testid="button-detail-edit" className="button button-secondary" onClick={() => setLocation(`/campaigns`)}><Edit3 size={15} /> Edit details</button></div></div><div className="detail-stats"><div><span>Prospects reached</span><strong>{fmtNumber(campaign.sentCount)}</strong></div><div><span>Open rate</span><strong>{fmtPct(campaign.openRate)}</strong></div><div><span>Reply rate</span><strong>{fmtPct(campaign.replyRate)}</strong></div><div><span>Next send</span><strong>{relativeTime(campaign.nextSendAt)}</strong></div></div><div className="sequence-layout"><div><div className="section-heading"><div><div className="eyebrow">The sequence</div><h2>Follow-up rhythm</h2></div><button data-testid="button-add-step" className="button button-primary" onClick={() => setEditor(null)}><Plus size={16} /> Add step</button></div>{stepsQuery.isLoading ? <LoadingRows count={3} /> : stepsQuery.isError ? <QueryError onRetry={() => void stepsQuery.refetch()} /> : !steps.length ? <EmptyState title="No steps yet" description="Add an opening note to give this campaign its first move." action="Add first step" onAction={() => setEditor(null)} /> : <div className="sequence-list">{steps.sort((a, b) => a.position - b.position).map((step, index) => <div className="sequence-step panel" key={step.id} data-testid={`sequence-step-${step.id}`}><div className="step-number">{String(index + 1).padStart(2, '0')}</div><div className="step-body"><div className="step-topline"><span className="step-delay">{index === 0 ? 'Opening note' : `After ${step.delayDays} ${step.delayDays === 1 ? 'day' : 'days'}`}</span><div className="row-actions"><button data-testid={`button-edit-step-${step.id}`} className="icon-button small" onClick={() => setEditor(step)}><Pencil size={15} /></button><button data-testid={`button-delete-step-${step.id}`} className="icon-button small danger" onClick={() => removeStep(step.id)}><Trash2 size={15} /></button></div></div><h3>{step.subject}</h3><p>{step.body}</p><div className="step-metrics"><span><Send size={13} /> {fmtNumber(step.sentCount)} sent</span><span><Inbox size={13} /> {fmtPct(step.openRate)} open</span><span><ActivityIcon size={13} /> {fmtPct(step.replyRate)} reply</span></div></div></div>)}</div>}</div><aside className="detail-aside"><div className="panel insight-card"><div className="eyebrow">Sequence notes</div><h3>Small signal, good momentum.</h3><p>Campaigns with a pause between steps give prospects room to respond. Your current rhythm is set up thoughtfully.</p><div className="insight-rule" /><div className="insight-row"><CircleCheck size={15} /><span>Approval gate on</span></div><div className="insight-row"><Clock3 size={15} /><span>Weekday delivery window</span></div></div><div className="panel activity-card"><div className="eyebrow">Campaign health</div><div className="health-ring"><div><strong>{fmtPct(campaign.replyRate)}</strong><span>reply rate</span></div></div><p>Above your workspace average of 2.8%</p></div></aside></div></div>{editor !== undefined && <StepEditor step={editor ?? undefined} campaignId={id} onClose={() => setEditor(undefined)} />}</Shell>;
}

function ProspectForm({ prospect, campaigns, onClose }: { prospect?: Prospect; campaigns: Campaign[]; onClose: () => void }) {
  const qc = useQueryClient();
  const create = useCreateProspect();
  const update = useUpdateProspect();
  const [form, setForm] = useState({ name: prospect?.name ?? '', email: prospect?.email ?? '', company: prospect?.company ?? '', role: prospect?.role ?? '', campaignId: prospect?.campaignId?.toString() ?? '' });
  const save = (event: FormEvent) => { event.preventDefault(); if (!form.name || !form.email || !form.company || !form.role) return; const data = { name: form.name, email: form.email, company: form.company, role: form.role, campaignId: form.campaignId ? Number(form.campaignId) : null }; const onSuccess = () => { void qc.invalidateQueries({ queryKey: getListProspectsQueryKey() }); onClose(); }; if (prospect) update.mutate({ id: prospect.id, data }, { onSuccess }); else create.mutate({ data }, { onSuccess }); };
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <Modal title={prospect ? 'Edit prospect' : 'Add prospect'} subtitle="Keep the human details close to the follow-up." onClose={onClose}><form onSubmit={save} className="form-stack"><div className="form-grid"><label>Full name<input data-testid="input-prospect-name" value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="Maya Chen" /></label><label>Work email<input data-testid="input-prospect-email" type="email" value={form.email} onChange={(event) => set('email', event.target.value)} placeholder="maya@company.com" /></label><label>Company<input data-testid="input-prospect-company" value={form.company} onChange={(event) => set('company', event.target.value)} placeholder="Company name" /></label><label>Role<input data-testid="input-prospect-role" value={form.role} onChange={(event) => set('role', event.target.value)} placeholder="VP of Growth" /></label></div><label>Assign to campaign<select data-testid="select-prospect-campaign" value={form.campaignId} onChange={(event) => set('campaignId', event.target.value)}><option value="">No campaign yet</option>{campaigns.map((campaign) => <option value={campaign.id} key={campaign.id}>{campaign.name}</option>)}</select></label><div className="modal-actions"><button data-testid="button-cancel-prospect" type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button data-testid="button-submit-prospect" className="button button-primary" disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? 'Saving…' : prospect ? 'Save changes' : 'Add prospect'}</button></div></form></Modal>;
}

function Prospects() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | ProspectStatusType>('all');
  const [formProspect, setFormProspect] = useState<Prospect | null | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const campaignsQuery = useListCampaigns();
  const params = useMemo(() => ({ ...(search ? { search } : {}), ...(status !== 'all' ? { status } : {}) }), [search, status]);
  const query = useListProspects(params);
  const deleteProspect = useDeleteProspect();
  const remove = () => { if (deleteId === null) return; deleteProspect.mutate({ id: deleteId }, { onSuccess: () => { void qc.invalidateQueries({ queryKey: getListProspectsQueryKey() }); setDeleteId(null); } }); };
  return <Shell><PageHeader eyebrow="Workspace / Prospects" title="Prospects" description="The people behind the numbers. Keep context attached to every touch." action="Add prospect" onAction={() => setFormProspect(null)} /><div className="toolbar fade-up-2"><div className="search-box"><Search size={17} /><input data-testid="input-prospect-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, company, or email" /></div><div className="filter-tabs">{(['all', 'active', 'replied', 'bounced', 'unsubscribed'] as const).map((item) => <button key={item} data-testid={`filter-prospect-${item}`} className={cx('filter-tab', status === item && 'active')} onClick={() => setStatus(item)}>{item === 'all' ? 'All prospects' : item[0].toUpperCase() + item.slice(1)}</button>)}</div><button data-testid="button-prospect-filter" className="button button-secondary filter-button"><Filter size={15} /> Filters</button></div><div className="table-shell panel fade-up-3">{query.isLoading ? <LoadingRows count={6} /> : query.isError ? <QueryError onRetry={() => void query.refetch()} /> : !query.data?.length ? <EmptyState title={search || status !== 'all' ? 'No prospects match' : 'Your prospect list is empty'} description={search || status !== 'all' ? 'Try another search or clear the filter.' : 'Bring your first person into the workspace and give the sequence someone to reach.'} action={!search && status === 'all' ? 'Add prospect' : undefined} onAction={() => setFormProspect(null)} /> : <><div className="table-heading"><span>{query.data.length} prospects</span><span className="table-meta"><span className="live-dot" />Synced just now</span></div><div className="data-table prospect-table"><div className="table-row table-header"><span>Prospect</span><span>Company</span><span>Campaign</span><span>Last contacted</span><span>Status</span><span /></div>{query.data.map((prospect) => <div className="table-row" key={prospect.id} data-testid={`prospect-row-${prospect.id}`}><div className="prospect-cell"><div className="person-avatar">{initials(prospect.name)}</div><div><strong>{prospect.name}</strong><small>{prospect.email}</small></div></div><div className="company-cell"><strong>{prospect.company}</strong><small>{prospect.role}</small></div><div className="muted-cell">{campaignsQuery.data?.find((campaign) => campaign.id === prospect.campaignId)?.name ?? 'Unassigned'}</div><div className="muted-cell">{relativeTime(prospect.lastContactedAt)}</div><div><StatusPill status={prospect.status} /></div><div className="row-actions"><button data-testid={`button-prospect-edit-${prospect.id}`} className="icon-button small" onClick={() => setFormProspect(prospect)}><Pencil size={15} /></button><button data-testid={`button-prospect-delete-${prospect.id}`} className="icon-button small danger" onClick={() => setDeleteId(prospect.id)}><Trash2 size={15} /></button></div></div>)}</div></>}</div>{formProspect !== undefined && <ProspectForm prospect={formProspect ?? undefined} campaigns={campaignsQuery.data ?? []} onClose={() => setFormProspect(undefined)} />}{deleteId !== null && <Modal title="Remove this prospect?" subtitle="They will be removed from your workspace, but no message will be sent." onClose={() => setDeleteId(null)}><div className="modal-actions"><button data-testid="button-cancel-delete-prospect" className="button button-secondary" onClick={() => setDeleteId(null)}>Keep prospect</button><button data-testid="button-confirm-delete-prospect" className="button button-danger" onClick={remove} disabled={deleteProspect.isPending}>{deleteProspect.isPending ? 'Removing…' : 'Remove prospect'}</button></div></Modal>}</Shell>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Dashboard} /><Route path="/campaigns/new" component={NewCampaign} /><Route path="/campaigns/:id" component={CampaignDetailPage} /><Route path="/campaigns" component={Campaigns} /><Route path="/prospects" component={Prospects} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter><Router /></WouterRouter></QueryClientProvider>;
}

export default App;
