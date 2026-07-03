export type AnalyticsSourceState =
	| { status: "connected"; label: string }
	| { status: "disconnected"; reason: string }
	| { status: "error"; reason: string };

export type AnalyticsKpi = {
	sessions: number | null;
	users: number | null;
	pageviews: number | null;
	purchases: number | null;
	/** Przychód w groszach (integer). */
	revenueMinor: number | null;
	conversionRate: number | null;
};

export type DailyPoint = {
	date: string;
	label: string;
	value: number;
};

export type FunnelStep = {
	event: string;
	label: string;
	count: number;
	rateFromTop: number;
};

export type ChannelRow = {
	channel: string;
	sessions: number;
	share: number;
};

export type TopPageRow = {
	path: string;
	views: number;
	share: number;
};

export type TopEventRow = {
	event: string;
	count: number;
};

export type Ga4AnalyticsSlice = AnalyticsSourceState & {
	kpi?: AnalyticsKpi;
	traffic?: DailyPoint[];
	channels?: ChannelRow[];
	/** Kampanie UTM / nazwy kampanii sesji (GA4 sessionCampaignName). */
	campaigns?: ChannelRow[];
	topPages?: TopPageRow[];
};

export type PosthogAnalyticsSlice = AnalyticsSourceState & {
	kpi?: AnalyticsKpi;
	traffic?: DailyPoint[];
	channels?: ChannelRow[];
	topPages?: TopPageRow[];
	funnel?: FunnelStep[];
};

export type AnalyticsDashboardData = {
	fetchedAt: string;
	rangeFrom: string;
	rangeTo: string;
	ga4: Ga4AnalyticsSlice;
	posthog: PosthogAnalyticsSlice;
};

export type RawHitsDailyPoint = {
	date: string;
	label: string;
	hits: number;
};

export type RawHitsTopPath = {
	path: string;
	hits: number;
};

/**
 * Surowe, anonimowe wejścia na stronę — niezależne od zgody na cookies.
 * Nie rozróżnia osób (jedna osoba może liczyć się kilka razy) i nie zawiera
 * żadnych identyfikatorów (IP, distinct_id) — patrz backend store/custom/track-hit.
 */
export type RawHitsData =
	| {
			status: "connected";
			fetchedAt: string;
			rangeFrom: string;
			rangeTo: string;
			/** Pierwszy dzień z danymi w bazie (wdrożenie licznika). */
			trackingSince: string | null;
			totalHits: number;
			daily: RawHitsDailyPoint[];
			topPaths: RawHitsTopPath[];
	  }
	| { status: "error"; reason: string };
