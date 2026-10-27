import React from 'react';

export const activityTime = value => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Not recorded';
};

export function PlayerPresence({ presence }) {
    const measuredAt = presence?.measuredAt ? new Date(presence.measuredAt).getTime() : NaN;
    const stale = !Number.isFinite(measuredAt) || Date.now() - measuredAt > 90000;
    const status = stale ? 'unknown' : presence?.status || 'unknown';
    const labels = { online: 'Online', recent_activity: 'Recently active', offline: 'Offline', unknown: 'Status unavailable' };
    const hint = status === 'online' ? `${presence.connectionCount} authenticated live connection(s)` : status === 'recent_activity' ? 'Recent authenticated activity; no confirmed live socket' : status === 'offline' ? 'No current authenticated connection or recent activity' : 'Waiting for fresh connection data';
    return <span className={`player-presence is-${status}`} title={hint}><i aria-hidden="true" />{labels[status] || labels.unknown}</span>;
}

export default function PlayerActivity({ activity, refreshFailed }) {
    if (!activity) return null;
    return <section className="profile-panel player-activity-panel">
        <h5>Login & connection activity</h5>
        <div className="player-activity-summary">
            <div><small>Current presence</small><PlayerPresence presence={refreshFailed ? null : activity.presence} /></div>
            <div><small>Last login</small><strong>{activityTime(activity.lastLoginAt)}</strong></div>
            <div><small>Logins · last 90 days</small><strong>{Number(activity.loginsLast90Days || 0).toLocaleString()}</strong></div>
            <div><small>Connection sessions · last 90 days</small><strong>{Number(activity.connectionSessionsLast90Days || 0).toLocaleString()}</strong></div>
        </div>
        <p className="player-activity-note">{activity.trackingStartedAt ? `Login tracking since ${activityTime(activity.trackingStartedAt)}.` : 'No logins recorded since tracking was enabled.'} Reconnecting opens a new connection session. Times use your local timezone. Updates every 30 seconds.</p>
        {refreshFailed && <p role="status" className="player-activity-note">Activity could not be refreshed. Trying again shortly.</p>}
        {!!activity.recentLogins?.length && <div className="player-login-history"><table><thead><tr><th>Login time</th><th>Method</th><th>Client</th></tr></thead><tbody>{activity.recentLogins.map((entry, index) => <tr key={`${entry.at}-${index}`}><td>{activityTime(entry.at)}</td><td>{entry.provider === 'wallet' ? 'Wallet' : entry.provider}</td><td>{entry.client === 'unknown' ? 'Unspecified client' : entry.client}</td></tr>)}</tbody></table></div>}
    </section>;
}
