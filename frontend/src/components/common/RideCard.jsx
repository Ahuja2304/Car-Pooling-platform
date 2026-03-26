import React from 'react';

export default function RideCard({ ride, onJoin }) {
  // Use distanceKm from the ride object, fallback to calculating if needed
  const distance = ride.distanceKm || ride.distance;
  const farePerPerson = ride.perPerson || (distance ? Math.round((distance * 1.2) / (ride.riders?.length + 1)) : null);

  const formatLoc = (loc, text) => {
    if (text && typeof text === 'string') return text;
    if (loc && typeof loc === 'string') return loc;
    if (loc && typeof loc === 'object' && loc.display_name) return loc.display_name;
    if (text && typeof text === 'object' && text.display_name) return text.display_name;
    return 'Unknown Location';
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 16,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      marginBottom: '12px'
    }}>
      {/* Route row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
            {formatLoc(ride.source, ride.sourceName)}
          </p>
          <p style={{ fontSize: 18, fontFamily: 'Syne', fontWeight: 700, color: '#fff' }}>
            → {formatLoc(ride.destination, ride.destinationName)}
          </p>
        </div>
        {farePerPerson && (
          <div style={{
            background: 'var(--teal)', color: 'var(--teal-light)',
            padding: '6px 14px', borderRadius: 99,
            fontSize: 13, fontWeight: 500
          }}>
            ₹{farePerPerson} each
          </div>
        )}
      </div>

      {/* Info pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { val: new Date(ride.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), lbl: 'Departs' },
          { val: distance ? `${Math.round(distance)} km` : '—', lbl: 'Distance' },
          { val: `${ride.max_riders - (ride.riders?.length || 0)} left`, lbl: 'Seats' },
          { val: ride.vehicleDetails?.split(' ')[0] ?? '—', lbl: 'Vehicle' }
        ].map(({ val, lbl }) => (
          <div key={lbl} style={{
            background: 'var(--bg-elevated)',
            border: '0.5px solid var(--border)',
            borderRadius: 10, padding: '8px 6px', textAlign: 'center'
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#fff', display: 'block' }}>{val}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{lbl}</span>
          </div>
        ))}
      </div>

      {/* Driver row + join button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--teal)', color: 'var(--teal-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, fontFamily: 'Syne'
        }}>
          {ride.driverName?.[0]?.toUpperCase() ?? 'D'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{ride.driverName ?? 'Driver'}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Driver · {ride.vehicleDetails}</p>
        </div>
        <button
          onClick={() => onJoin(ride._id)}
          style={{
            background: 'var(--teal)', color: 'var(--teal-light)',
            border: 'none', borderRadius: 10,
            padding: '9px 20px', fontSize: 13,
            fontFamily: 'DM Sans', fontWeight: 500, cursor: 'pointer'
          }}
        >
          Join ride
        </button>
      </div>
    </div>
  );
}
