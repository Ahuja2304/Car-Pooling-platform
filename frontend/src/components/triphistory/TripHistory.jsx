import { React, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col } from 'react-bootstrap'
import * as GrIcons from 'react-icons/gr'
import sourceImg from '../../start-location.svg';
import destinationImg from '../../pin-location.svg';
import dtImg from '../../date-and-time.svg';
import groupImg from '../../group.svg';
import './TripHistory.css';
import Cookies from 'js-cookie';
import Geocode from "react-geocode";

export default function TripHistory() {
    const getLocFromCoords = async (coords) => {
        let lat = coords['lat']
        let long = coords['lng']

        const res = await Geocode.fromLatLng(lat, long)
        const location = await res.results[0].formatted_address;
        return location
    }

    const getDateandTime = (dtString) => {
        const d = new Date(dtString);
        let date = d.toDateString();
        dtString = d.toTimeString();
        let time = dtString.split(' ')[0].split(':')
        return date + ' @ ' + time[0] + ':' + time[1]
    }

    const [tripDetails, setTripDetails] = useState([])
    const fetchData = async () => {
        const response = await fetch(import.meta.env.VITE_END_POINT + '/trip/history', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Coookie': Cookies.get('tokken')
            }
        })
        const data = await response.json()

        // Parse Data
        let tempArray = []
        for (let i = 0; i < data.length; i++) {
            let thisTrip = data[i]
            let newTrip = {}
            let loc;
            loc = await getLocFromCoords(thisTrip["source"])
            newTrip["source"] = loc
            loc = await getLocFromCoords(thisTrip["destination"])
            newTrip["destination"] = loc
            newTrip["tripDate"] = getDateandTime(thisTrip["dateTime"])
            newTrip["riderCount"] = thisTrip["riders"].length

            tempArray.push(newTrip)
        }
        setTripDetails(tempArray)
    }

    useEffect(() => {
        fetchData()
    }, [])


    const CardView = ({
        source = "Default Title",
        destination = "Default Text",
        tripDate = "defaultDate",
        riderCount = "defaultRider",

    }) => (
        <div className="card-body mb-4 mt-4 mx-4 text-black">
            <div className='detail-container'>
                <div className='detail-row'>
                    <img className='tripImage' src={sourceImg}></img>
                    <h6 className='detail-heading'>Source: </h6>
                    <h6 className='detail-heading'>{source}</h6>
                </div>
            </div>

            <div className='detail-container'>
                <div className='detail-row'>
                    <img className='tripImage' src={destinationImg}></img>
                    <h6 className='detail-heading'>Destiation: </h6>
                    <h6 className='detail-heading'>{destination}</h6>
                </div>
            </div>

            <hr></hr>

            <div className='detail-container'>
                <div className='detail-row'>
                    <img className='tripImage' src={dtImg}></img>
                    <h6 className='detail-heading'>Date and time: </h6>
                    <h6 className='detail-heading'>{tripDate}</h6>
                </div>
            </div>



            <div className='detail-container'>
                <div className='detail-row'>
                    <img className='tripImage' src={groupImg}></img>
                    <h6 className='detail-heading'>No. of riders: </h6>
                    <h6 className='detail-heading'>{riderCount}</h6>
                </div>
            </div>
        </div>

    );
    const EmptyState = () => {
        const navigate = useNavigate();
        return (
            <div style={{ textAlign: 'center', padding: '64px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <svg width="120" height="90" viewBox="0 0 80 60" fill="none">
                    <rect x="10" y="25" width="60" height="22" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth="1"/>
                    <rect x="18" y="18" width="35" height="14" rx="4" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1"/>
                    <circle cx="22" cy="47" r="6" fill="var(--teal)"/>
                    <circle cx="22" cy="47" r="3" fill="var(--teal-light)"/>
                    <circle cx="58" cy="47" r="6" fill="var(--teal)"/>
                    <circle cx="58" cy="47" r="3" fill="var(--teal-light)"/>
                    <line x1="0" y1="55" x2="80" y2="55" stroke="var(--border)" strokeWidth="1" strokeDasharray="6,4"/>
                </svg>
                <p style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 24, marginBottom: 8 }}>
                    No rides yet
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32, maxWidth: '240px', lineHeight: '1.5' }}>
                    You haven't taken any rides yet. Find one and split the fare.
                </p>
                <button 
                    onClick={() => window.location.href = '/ride'} 
                    className="btn-primary"
                >
                    Find a ride
                </button>
            </div>
        );
    };

    return (
        <div style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Syne', fontSize: '24px', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)' }}>Trip History</h2>
            {tripDetails.length === 0 ? <EmptyState /> :
                <div style={{ display: 'grid', gap: '16px' }}>
                    {tripDetails.map((data, index) => (
                        <div key={index} style={{ 
                            background: 'var(--bg-surface)', 
                            border: '0.5px solid var(--border)', 
                            borderRadius: '16px', 
                            padding: '20px' 
                        }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    {data.tripDate}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--teal-mid)', fontWeight: 600 }}>
                                    {data.riderCount} {data.riderCount === 1 ? 'Rider' : 'Riders'}
                                </div>
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>From</div>
                                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{data.source}</div>
                                </div>
                                <div style={{ color: 'var(--teal-mid)', paddingLeft: '4px' }}>↓</div>
                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>To</div>
                                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{data.destination}</div>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            }
        </div>
    );
}

