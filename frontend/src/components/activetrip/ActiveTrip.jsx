import { React, useState, useEffect, useCallback } from 'react';
import { Button, Col, Container, Row, Badge, Spinner } from 'react-bootstrap';
import Cookies from 'js-cookie';
import { io } from 'socket.io-client';
import RideMap from '../RideMap';

import './ActiveTrip.css'

export default function ActiveTrip({ setActiveTrip }) {
    const [routeInfo, setRouteInfo] = useState(null)
    const [tripData, setTripData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isDriver, setIsDriver] = useState(false);

    const getDateandTime = (dtString) => {
        const d = new Date(dtString);
        let date = d.toDateString();
        dtString = d.toTimeString();
        let time = dtString.split(' ')[0].split(':')
        return date + ' @ ' + time[0] + ':' + time[1]
    }

    const fetchData = useCallback(() => {
        const url = (import.meta.env.VITE_END_POINT || "") + '/trip/activetrip';
        console.log("Fetching active trip from:", url);
        fetch(url, {
            method: 'GET',
            headers: { 'Coookie': Cookies.get('tokken') }
        }).then((response) => {
            if (response.ok) return response.json();
            throw new Error("Failed to fetch active trip");
        }).then((responseJson) => {
            setTripData(responseJson)
            setLoading(false)
        }).catch((error) => {
            console.error(error)
            setLoading(false)
        });
    }, []);

    useEffect(() => {
        fetch(import.meta.env.VITE_END_POINT + '/trip/isdriver', {
            method: 'GET',
            headers: { 'Coookie': Cookies.get('tokken') }
        }).then((response) => {
            if (response.ok) return response.json();
        }).then((responseJson) => {
            if (responseJson.isdriver) setIsDriver(true)
        }).catch((error) => console.error(error));

        fetchData();
    }, [fetchData]);

    // Socket.io for real-time updates
    useEffect(() => {
        if (!tripData?._id) return;

        const socket = io(import.meta.env.VITE_END_POINT.replace('/api', ''));
        
        socket.on('connect', () => {
            console.log('Connected to socket server');
            socket.emit('joinTrip', String(tripData._id));
        });

        socket.on('riderJoined', (data) => {
            console.log('New rider joined:', data.riderName);
            // Re-fetch data to update riders list and route
            fetchData();
        });

        socket.on('tripUpdated', (data) => {
            console.log('Trip updated:', data.message);
            alert(data.message);
            if (data.type === 'cancel' || data.type === 'done') {
                setActiveTrip(null);
                window.location.reload();
            } else {
                fetchData();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [tripData?._id, fetchData, setActiveTrip]);

    const handleCancel = (e) => {
        e.preventDefault();
        const url = (import.meta.env.VITE_END_POINT || "") + '/trip';
        console.log("Cancelling trip via:", url);
        return fetch(url, {
            method: 'DELETE',
            headers: { 'Coookie': Cookies.get('tokken') },
        }).then((response) => {
            if (response.ok) {
                setActiveTrip(null);
                alert("Trip cancelled successfully");
                window.location.reload();
            }
        }).catch((error) => alert(error));
    }

    const handleDone = (e) => {
        e.preventDefault();
        const url = (import.meta.env.VITE_END_POINT || "") + '/trip/done';
        console.log("Marking trip as done via:", url);
        return fetch(url, {
            method: 'POST',
            headers: { 'Coookie': Cookies.get('tokken') },
        }).then((response) => {
            if (response.ok) {
                setActiveTrip(null);
                alert("Trip marked completed");
                window.location.reload();
            }
        }).catch((error) => alert(error));
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
            <Spinner style={{ color: 'var(--teal)' }} />
        </div>
    );

    return (
        <div style={{ background: 'var(--bg-base)', minHeight: 'calc(100vh - 64px)' }}>
            <Container className="responsive-container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
                <Row className="gy-4">
                    <Col lg={7} md={12}>
                        <div className="active-trip-map-container" style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                            <RideMap
                                origin={tripData?.source}
                                destination={tripData?.destination}
                                passengerCount={tripData?.riders?.length + 1}
                                onRouteLoaded={setRouteInfo}
                            />
                        </div>
                    </Col>

                    {/* Right Column: Details */}
                    <Col lg={5} md={12}>
                        <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border)', borderRadius: 24, padding: 32 }}>
                             <div className="d-flex justify-content-between align-items-start mb-4">
                                <div>
                                    <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>My Ride</h1>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Trip ID: {tripData?._id?.slice(-6).toUpperCase()}</p>
                                </div>
                                <div style={{ background: 'var(--teal)', color: 'var(--teal-light)', padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                                    Active
                                </div>
                             </div>

                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
                                <div style={{ background: 'var(--bg-elevated)', padding: '12px 8px', borderRadius: 12, textAlign: 'center', border: '0.5px solid var(--border)' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{routeInfo?.distanceKm ?? '—'} km</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dist</div>
                                </div>
                                <div style={{ background: 'var(--bg-elevated)', padding: '12px 8px', borderRadius: 12, textAlign: 'center', border: '0.5px solid var(--border)' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{routeInfo?.durationMin ?? '—'} min</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</div>
                                </div>
                                <div style={{ background: 'var(--bg-elevated)', padding: '12px 8px', borderRadius: 12, textAlign: 'center', border: '0.5px solid var(--border)' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal-mid)' }}>₹{tripData?.perPerson}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fare</div>
                                </div>
                             </div>

                             <div style={{ display: 'grid', gap: 20, marginBottom: 32 }}>
                                <div>
                                    <label className="form-label">Route</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal-mid)' }} />
                                            <div style={{ fontSize: 14, fontWeight: 500 }}>{tripData?.sourceName}</div>
                                        </div>
                                        <div style={{ width: 1, height: 20, background: 'var(--border)', marginLeft: 3.5 }} />
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)' }} />
                                            <div style={{ fontSize: 14, fontWeight: 500 }}>{tripData?.destinationName}</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Departure</label>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{getDateandTime(tripData?.dateTime)}</div>
                                </div>

                                <div>
                                    <label className="form-label">Driver {isDriver && '(You)'}</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div className="avatar-circle-sm" style={{ width: 32, height: 32, fontSize: 12 }}>
                                            {tripData?.driver?.[0]?.toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 500 }}>{tripData?.driver || "Loading..."}</div>
                                    </div>
                                    {tripData?.vehicleDetails && (
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, paddingLeft: 42 }}>
                                            {tripData.vehicleDetails}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="form-label">Joined Riders</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {tripData?.riders?.length > 0 ? tripData.riders.map((r, i) => (
                                            <div key={i} style={{ background: 'var(--bg-elevated)', padding: '4px 12px', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', border: '0.5px solid var(--border)' }}>
                                                {r}
                                            </div>
                                        )) : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No one joined yet</span>}
                                    </div>
                                </div>
                             </div>

                             <div style={{ display: 'grid', gap: 12 }}>
                                {isDriver && (
                                    <button className="btn-primary w-100" onClick={handleDone}>
                                        Complete Trip
                                    </button>
                                )}
                                <button className="btn-secondary w-100" onClick={handleCancel} style={{ color: 'var(--danger)', borderColor: 'rgba(226,75,74,0.3)' }}>
                                    {isDriver ? 'Cancel Trip' : 'Leave Ride'}
                                </button>
                             </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
