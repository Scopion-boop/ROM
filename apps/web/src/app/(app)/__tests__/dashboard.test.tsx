import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  usePathname: () => '/dashboard',
}));

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement('a', { href, ...props }, children),
}));

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    login: vi.fn(),
    logout: vi.fn(),
    getToken: vi.fn().mockReturnValue('cookie-auth'),
    getAuthHeaders: vi.fn().mockReturnValue({ 'X-Requested-With': 'XMLHttpRequest' }),
    isAuthenticated: vi.fn().mockReturnValue(true),
    apiUrl: 'http://localhost:4000',
  },
}));

// Mock plan-context so tests don't need a full PlanProvider tree
vi.mock('@/lib/plan-context', () => ({
  usePlan: vi.fn().mockReturnValue({
    plan: 'free',
    status: 'active',
    sessionsThisMonth: 3,
    sessionLimit: 10,
    loading: false,
    refresh: vi.fn(),
  }),
}));

// Mock RomTrendChart — recharts uses ResizeObserver which is unavailable in jsdom
vi.mock('@/components/charts/RomTrendChart', () => ({
  default: ({ data }: { data: { date: string; avgRom: number }[] }) =>
    React.createElement('div', { 'data-testid': 'rom-trend-chart' }, `chart:${data.length}`),
}));

import DashboardPage from '../dashboard/page';
import { usePlan } from '@/lib/plan-context';

// Helpers to build minimal API responses
const makeStatsResponse = (overrides = {}) => ({
  totalSessions: 12,
  totalMeasurements: 48,
  avgConfidenceScore: 87,
  sessionsThisMonth: 3,
  sessionLimit: 10,
  ...overrides,
});

const makeSessionsResponse = (count = 2) =>
  Array.from({ length: count }, (_, i) => ({
    id: `session-${i + 1}`,
    patientId: `P00${i + 1}`,
    createdAt: new Date(2025, 0, i + 1).toISOString(),
    joint: i % 2 === 0 ? 'shoulder' : 'knee',
    status: 'finalized',
  }));

// Helper: mock all three parallel fetch calls in the order the component fires them
function mockDashboardFetches(
  statsBody: object | null,
  trendBody: object | null,
  sessionsBody: object | null,
) {
  const mockFetch = vi.fn();

  const makeResponse = (body: object | null, ok = true) => ({
    ok: body !== null && ok,
    json: async () => body ?? {},
  });

  mockFetch
    .mockResolvedValueOnce(makeResponse(statsBody)) // /api/dashboard/stats
    .mockResolvedValueOnce(makeResponse(trendBody)) // /api/dashboard/rom-trend
    .mockResolvedValueOnce(makeResponse(sessionsBody)); // /api/sessions

  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

describe('DashboardPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(usePlan).mockReturnValue({
      plan: 'free',
      status: 'active',
      sessionsThisMonth: 3,
      sessionLimit: 10,
      loading: false,
      refresh: vi.fn(),
    });
  });

  describe('header and navigation', () => {
    beforeEach(() => {
      mockDashboardFetches(makeStatsResponse(), { dates: [], avgRom: [] }, []);
    });

    it('renders the Dashboard heading', async () => {
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText('Dashboard')).toBeDefined());
    });

    it('renders the welcome subtitle', async () => {
      render(<DashboardPage />);
      await waitFor(() =>
        expect(screen.getByText("Welcome back. Here's your clinical overview.")).toBeDefined(),
      );
    });

    it('renders a New Session link pointing to /sessions/new', async () => {
      render(<DashboardPage />);
      await waitFor(() => {
        const links = screen.getAllByRole('link', { name: '+ New Session' });
        expect(links.length).toBeGreaterThan(0);
        expect((links[0] as HTMLAnchorElement).href).toContain('/sessions/new');
      });
    });

    it('renders a Refresh button', async () => {
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByRole('button', { name: /refresh/i })).toBeDefined());
    });

    it('does not render Export CSV link on the free plan', async () => {
      render(<DashboardPage />);
      await waitFor(() => expect(screen.queryByRole('link', { name: /export csv/i })).toBeNull());
    });
  });

  describe('stat cards after data loads', () => {
    beforeEach(() => {
      mockDashboardFetches(makeStatsResponse(), { dates: [], avgRom: [] }, []);
    });

    it('renders Total Sessions label', async () => {
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText('Total Sessions')).toBeDefined());
    });

    it('renders Measurements label', async () => {
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText('Measurements')).toBeDefined());
    });

    it('renders Avg Confidence label', async () => {
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText('Avg Confidence')).toBeDefined());
    });

    it('renders This Month label', async () => {
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText('This Month')).toBeDefined());
    });

    it('displays the correct total sessions value', async () => {
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText('12')).toBeDefined());
    });

    it('displays the correct measurements value', async () => {
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText('48')).toBeDefined());
    });

    it('displays the avg confidence percentage', async () => {
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText('87%')).toBeDefined());
    });
  });

  describe('loading state', () => {
    it('shows skeleton cards while data is loading', () => {
      // Return a fetch that never resolves so the loading state persists
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
      render(<DashboardPage />);
      // Stat card labels are not rendered during loading; the page should
      // not yet contain them.
      expect(screen.queryByText('Total Sessions')).toBeNull();
      expect(screen.queryByText('Measurements')).toBeNull();
    });

    it('shows loading placeholder for ROM trend chart', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
      render(<DashboardPage />);
      // The chart is replaced by a skeleton div, so the chart testid is absent.
      expect(screen.queryByTestId('rom-trend-chart')).toBeNull();
    });
  });

  describe('recent sessions section', () => {
    it('renders the Recent Sessions heading', async () => {
      mockDashboardFetches(makeStatsResponse(), { dates: [], avgRom: [] }, makeSessionsResponse(2));
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText('Recent Sessions')).toBeDefined());
    });

    it('renders a View all link pointing to /sessions', async () => {
      mockDashboardFetches(makeStatsResponse(), { dates: [], avgRom: [] }, makeSessionsResponse(1));
      render(<DashboardPage />);
      await waitFor(() => {
        const link = screen.getByRole('link', { name: 'View all' });
        expect((link as HTMLAnchorElement).href).toContain('/sessions');
      });
    });

    it('shows empty-state prompt when no sessions exist', async () => {
      mockDashboardFetches(makeStatsResponse(), { dates: [], avgRom: [] }, []);
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText(/start your first session/i)).toBeDefined());
    });

    it('renders session rows when sessions are returned', async () => {
      mockDashboardFetches(makeStatsResponse(), { dates: [], avgRom: [] }, makeSessionsResponse(2));
      render(<DashboardPage />);
      await waitFor(() => {
        // Each session has a joint label rendered
        expect(screen.getByText('shoulder')).toBeDefined();
        expect(screen.getByText('knee')).toBeDefined();
      });
    });
  });

  describe('ROM trend chart section', () => {
    it('renders the ROM Trend heading', async () => {
      mockDashboardFetches(makeStatsResponse(), { dates: [], avgRom: [] }, []);
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText('ROM Trend (30 Days)')).toBeDefined());
    });

    it('renders the chart component after data loads', async () => {
      mockDashboardFetches(
        makeStatsResponse(),
        { dates: ['2025-01-01', '2025-01-02'], avgRom: [130, 140] },
        [],
      );
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByTestId('rom-trend-chart')).toBeDefined());
    });

    it('passes transformed trend data to the chart', async () => {
      mockDashboardFetches(
        makeStatsResponse(),
        { dates: ['2025-01-01', '2025-01-02'], avgRom: [130, 140] },
        [],
      );
      render(<DashboardPage />);
      await waitFor(() => {
        const chart = screen.getByTestId('rom-trend-chart');
        expect(chart.textContent).toBe('chart:2');
      });
    });
  });

  describe('error state', () => {
    it('shows an error banner when all fetches fail', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText('Failed to load dashboard data.')).toBeDefined());
    });

    it('renders a Retry button inside the error banner', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined());
    });

    it('re-fetches when Retry is clicked', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined());

      // After clicking Retry, fetch should be called again
      const callCountBeforeRetry = mockFetch.mock.calls.length;
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      await waitFor(() => {
        expect(mockFetch.mock.calls.length).toBeGreaterThan(callCountBeforeRetry);
      });
    });
  });

  describe('free plan usage bar', () => {
    it('renders the session usage bar on the free plan after loading', async () => {
      mockDashboardFetches(makeStatsResponse(), { dates: [], avgRom: [] }, []);
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText(/free plan.*session usage/i)).toBeDefined());
    });

    it('shows the sessions used out of the limit', async () => {
      mockDashboardFetches(makeStatsResponse(), { dates: [], avgRom: [] }, []);
      render(<DashboardPage />);
      await waitFor(() => expect(screen.getByText('3 / 10 this month')).toBeDefined());
    });

    it('does not render the usage bar on the pro plan', async () => {
      vi.mocked(usePlan).mockReturnValue({
        plan: 'pro',
        status: 'active',
        sessionsThisMonth: 5,
        sessionLimit: 999,
        loading: false,
        refresh: vi.fn(),
      });
      mockDashboardFetches(makeStatsResponse(), { dates: [], avgRom: [] }, []);
      render(<DashboardPage />);
      await waitFor(() => expect(screen.queryByText(/free plan.*session usage/i)).toBeNull());
    });

    it('shows upgrade link when monthly limit is reached', async () => {
      vi.mocked(usePlan).mockReturnValue({
        plan: 'free',
        status: 'active',
        sessionsThisMonth: 10,
        sessionLimit: 10,
        loading: false,
        refresh: vi.fn(),
      });
      mockDashboardFetches(makeStatsResponse(), { dates: [], avgRom: [] }, []);
      render(<DashboardPage />);
      await waitFor(() =>
        expect(screen.getByRole('link', { name: /upgrade to continue/i })).toBeDefined(),
      );
    });
  });

  describe('pro plan — Export CSV link', () => {
    it('renders Export CSV link for pro plan users', async () => {
      vi.mocked(usePlan).mockReturnValue({
        plan: 'pro',
        status: 'active',
        sessionsThisMonth: 5,
        sessionLimit: 999,
        loading: false,
        refresh: vi.fn(),
      });
      mockDashboardFetches(makeStatsResponse(), { dates: [], avgRom: [] }, []);
      render(<DashboardPage />);
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /export csv/i });
        expect(link).toBeDefined();
        expect((link as HTMLAnchorElement).href).toContain('/api/sessions/export/csv');
      });
    });
  });
});
