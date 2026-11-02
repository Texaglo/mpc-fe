import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-redux', () => ({ useSelector: selector => selector({ Auth: { auth: 'fixture-admin-token' } }) }));
jest.mock('react-chartjs-2', () => ({ Line: props => <div role="img" aria-label={props['aria-label']} /> }));
process.env.REACT_APP_WEBSITE_ANALYTICS_API = 'https://analytics.example.test/report';
const WebsiteAnalytics = require('./index').default;
const report = {
  status: 'ready', startDate: '2026-10-04', endDate: '2026-11-02',
  latestEventAt: null, generatedAt: '2026-11-02T12:00:00Z',
  summary: { visitors: 0, sessions: 0, pageViews: 0, gameClicks: 0, averageEngagementSeconds: 0, gameClickRate: 0 },
  daily: [], pages: [], sources: [], devices: [], actions: [],
};
beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => report }); });

test('shows real zero counts and explains that no data has been received', async () => {
  render(<WebsiteAnalytics />);
  expect(await screen.findByText('Website visitor counter')).toBeInTheDocument();
  expect(screen.getByText('No website activity has been processed for this period yet.')).toBeInTheDocument();
  expect(screen.getByText('Visitors')).toBeInTheDocument();
  expect(fetch.mock.calls[0][0]).toBe('https://analytics.example.test/report?days=30');
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer fixture-admin-token');
});

test('date filter requests the matching period and refresh does not fake fresh events', async () => {
  render(<WebsiteAnalytics />);
  await screen.findByText('Website visitor counter');
  fireEvent.change(screen.getByRole('combobox', { name: 'Reporting period' }), { target: { value: '7' } });
  await waitFor(() => expect(fetch.mock.calls[1][0]).toBe('https://analytics.example.test/report?days=7'));
  await screen.findByText('Website visitor counter');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
  await screen.findByText('Website visitor counter');
});

test('API errors show an error state rather than zero metrics', async () => {
  fetch.mockResolvedValue({ ok: false, status: 403, json: async () => ({ message: 'Overview permission is required.' }) });
  render(<WebsiteAnalytics />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Overview permission is required.');
  expect(screen.queryByText('Visitors')).not.toBeInTheDocument();
});
