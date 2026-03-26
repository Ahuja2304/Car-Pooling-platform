import React, { useState, useEffect } from 'react';
import { Col, Container, Form, Row, Card, Spinner } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import './DriveRide.css';
import "react-datepicker/dist/react-datepicker.css";
import Cookies from 'js-cookie';
import RideMap from '../RideMap';
import { geocode } from '../../utils/getRoute';
import RideCard from '../common/RideCard';
import * as AiIcons from 'react-icons/ai';

export default function DriveRide({ type, setToken, setActiveTrip }) {
    const [srcText, setSrcText] = useState("");
    const [dstText, setDstText] = useState("");
    const [originCoords, setOriginCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);
    
    const [availableRides, setAvailableRides] = useState([]);
    const [loadingRides, setLoadingRides] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    
    const [routeInfo, setRouteInfo] = useState(null);
    const [dateTime, setDateTime] = useState(new Date(new Date().getTime() + (60 * 60 * 1000)));
    const [riders, setRiders] = useState(1);
    const [vehicleDetails, setVehicleDetails] = useState("");
    const [totalTripPrice, setTotalTripPrice] = useState(0);
    const [customPerPerson, setCustomPerPerson] = useState(0);
    const [useCustomFare, setUseCustomFare] = useState(false);

    useEffect(() => {
        if (type === 'ride') {
            fetchAvailableRides();
        }
    }, [type]);

    useEffect(() => {
        if (totalTripPrice > 0 && riders > 0) {
            setCustomPerPerson(Math.round(totalTripPrice / riders));
        } else {
            setCustomPerPerson(0);
        }
    }, [totalTripPrice, riders]);

    useEffect(() => {
        if (routeInfo && !useCustomFare) {
            setTotalTripPrice(routeInfo.total);
        }
    }, [routeInfo, useCustomFare]);

    // Auto-plot logic with 1.5s debounce to avoid over-calling geocode
    useEffect(() => {
        if (!srcText || !dstText) {
            setOriginCoords(null);
            setDestCoords(null);
            return;
        }
        const timer = setTimeout(async () => {
            setGeocoding(true);
            try {
                const src = await geocode(srcText);
                const dst = await geocode(dstText);
                setOriginCoords(src);
                setDestCoords(dst);
            } catch (err) {
                console.error("Geocoding failed:", err);
            } finally {
                setGeocoding(false);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [srcText, dstText]);

    const fetchAvailableRides = () => {
        setLoadingRides(true);
        fetch(import.meta.env.VITE_END_POINT + '/trip/available', {
            headers: { 'Coookie': Cookies.get('tokken') }
        })
        .then(res => res.json())
        .then(data => {
            setAvailableRides(data);
            setLoadingRides(false);
        })
        .catch(err => {
            console.error(err);
            setLoadingRides(false);
        });
    }

    const handleDriveSubmit = (event) => {
        event.preventDefault();
        if (!originCoords || !destCoords) return alert("Please clarify your route first");
        
        const data = {
            src: originCoords,
            dst: destCoords,
            sourceName: srcText,
            destinationName: dstText,
            distanceKm: routeInfo?.distanceKm,
            durationMin: routeInfo?.durationMin,
            route: routeInfo?.polyline,
            perPerson: customPerPerson,
            totalFare: totalTripPrice,
            vehicleDetails: vehicleDetails,
            dateTime: dateTime,
            max_riders: riders
        }
        fetch(import.meta.env.VITE_END_POINT + '/trip/drive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Coookie': Cookies.get('tokken')
            },
            body: JSON.stringify(data)
        })
        .then(async (response) => {
            if (response.ok) return response.json();
            if (response.status === 401) {
                setToken(null);
                throw new Error("Session expired. Please login again.");
            }
            const err = await response.json();
            throw new Error(err.message || "Failed to post ride");
        })
        .then((res) => {
            setActiveTrip(res._id);
            window.location.reload();
        })
        .catch((error) => alert(error.message));
    }

    const handleJoinTrip = (tripId) => {
        fetch(import.meta.env.VITE_END_POINT + `/trip/join/${tripId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Coookie': Cookies.get('tokken') 
            },
            body: JSON.stringify({
                src: originCoords,
                dst: destCoords
            })
        })
        .then(res => {
            if (res.ok) return res.json();
            throw new Error("Failed to join trip");
        })
        .then(data => {
            setActiveTrip(data._id);
            window.location.reload();
        })
        .catch(err => alert(err.message));
    }

    const InfoPill = ({ val, lbl }) => (
        <div style={{
            background: 'var(--bg-elevated)',
            border: '0.5px solid var(--border)',
            borderRadius: 10, padding: '10px 8px', textAlign: 'center'
        }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'block' }}>{val}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{lbl}</span>
        </div>
    );

    return (
        <Container fluid style={{ padding: '0 40px', background: 'var(--bg-base)', minHeight: 'calc(100vh - 64px)' }}>
            <Row className="gy-4 gx-5" style={{ paddingTop: '32px' }}>
                {/* Form Column */}
                <Col md={5} lg={4} xl={4}>
                    <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border)', borderRadius: 20, padding: 32, position: 'sticky', top: '32px' }}>
                        <h2 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 24, color: '#fff' }}>
                            {type === 'drive' ? 'Post a New Ride' : 'Find a Ride'}
                        </h2>

                        <div style={{ display: 'grid', gap: 16 }}>
                            <div>
                                <label className="form-label">Pick-up Point</label>
                                <input 
                                    className="form-input"
                                    type="text" 
                                    placeholder="Source address..." 
                                    value={srcText} 
                                    onChange={e => setSrcText(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="form-label">Drop-off Point</label>
                                <input 
                                    className="form-input"
                                    type="text" 
                                    placeholder="Destination address..." 
                                    value={dstText}
                                    onChange={e => setDstText(e.target.value)}
                                />
                                {geocoding && <div style={{ fontSize: 11, color: 'var(--teal-mid)', marginTop: 6 }}>Calculating route...</div>}
                            </div>

                            <Row>
                                <Col xs={7}>
                                    <label className="form-label">Date and Time</label>
                                    <DatePicker
                                        showTimeSelect
                                        selected={dateTime}
                                        onChange={(date) => setDateTime(date)}
                                        dateFormat="MMM d, h:mm aa"
                                        className="form-input"
                                    />
                                </Col>
                                {type === 'drive' && (
                                    <Col xs={5}>
                                        <label className="form-label">Seats</label>
                                        <select 
                                            className="form-input"
                                            value={riders} 
                                            onChange={e => setRiders(parseInt(e.target.value))}
                                        >
                                            {[1,2,3,4].map(n => <option key={n} value={n}>{n} {n===1?'Seat':'Seats'}</option>)}
                                        </select>
                                    </Col>
                                )}
                            </Row>

                            {type === 'drive' && (
                                <div>
                                    <label className="form-label">Vehicle Details</label>
                                    <input 
                                        className="form-input"
                                        type="text"
                                        placeholder="Car model, color, plate..." 
                                        value={vehicleDetails}
                                        onChange={e => setVehicleDetails(e.target.value)}
                                    />
                                </div>
                            )}


                            {type === 'drive' ? (
                                <button className="btn-primary w-100" onClick={handleDriveSubmit} style={{ marginTop: 8 }}>
                                    Post this ride
                                </button>
                            ) : null}
                        </div>
                    </div>
                </Col>

                {/* Main Content Column */}
                <Col md={7} lg={8} xl={8}>
                    {type === 'ride' ? (
                        <div>
                             <h3 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 24 }}>
                                Available Rides
                            </h3>
                            {loadingRides ? (
                                <div style={{ textAlign: 'center', padding: 100 }}><Spinner style={{ color: 'var(--teal)' }} /></div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                                    {availableRides.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: 40, borderRadius: 20, textAlign: 'center', border: '0.5px solid var(--border)' }}>
                                            No compatible rides found. Try different locations or check back later.
                                        </p>
                                    ) : (
                                        availableRides.map(ride => (
                                            <RideCard key={ride._id} ride={ride} onJoin={handleJoinTrip} />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ height: '500px', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
                                <RideMap 
                                    origin={originCoords}
                                    destination={destCoords}
                                    passengerCount={riders}
                                    onRouteLoaded={setRouteInfo}
                                />
                                 {!originCoords && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(13, 15, 30, 0.7)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        <div className="avatar-circle-sm" style={{ width: 60, height: 60, fontSize: 24, marginBottom: 16 }}>
                                            <AiIcons.AiOutlineCompass />
                                        </div>
                                        <p style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700 }}>Ready to plot your route?</p>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enter your source and destination to begin.</p>
                                    </div>
                                )}
                            </div>

                            {routeInfo && type === 'drive' && (
                                <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border)', borderRadius: 20, padding: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <div>
                                            <h4 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Fare Breakdown</h4>
                                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Adjust the total trip cost to split between passengers</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--teal-mid)' }}>₹{customPerPerson}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Per Seat</div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'center' }}>
                                         <div>
                                            <label className="form-label" style={{ fontSize: 11 }}>Total Trip Cost (₹)</label>
                                            <div className="d-flex align-items-center">
                                                <input 
                                                    className="form-input"
                                                    type="number"
                                                    value={totalTripPrice || ""}
                                                    placeholder="Total Price"
                                                    onChange={e => {
                                                        setTotalTripPrice(parseInt(e.target.value) || 0);
                                                        setUseCustomFare(true);
                                                    }}
                                                    style={{ fontSize: '1.25rem', fontWeight: 700, padding: '10px 16px' }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ background: 'var(--bg-base)', padding: '16px 20px', borderRadius: 12, border: '1px dashed var(--border)' }}>
                                            <p style={{ fontSize: 13, color: '#fff', marginBottom: 4 }}>
                                                ₹{totalTripPrice} split by {riders} {riders === 1 ? 'passenger' : 'passengers'}
                                            </p>
                                            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                                                Wait for passengers to join and pay their share.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Col>
            </Row>
        </Container>
    );
}