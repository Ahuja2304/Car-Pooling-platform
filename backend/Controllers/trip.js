const Trip = require("../Models/tripModel");
const User = require("../Models/user");
const dotenv = require("dotenv");
const { PolyUtil } = require("node-geometry-library");
const https = require('https');
dotenv.config()

// Helper to call OSRM
const getOSRMRoute = (points) => {
    return new Promise((resolve, reject) => {
        const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.code !== 'Ok') return reject(new Error('OSRM error: ' + json.code));
                    const route = json.routes[0];
                    const polyline = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
                    resolve({
                        polyline,
                        distance: route.distance,
                        duration: route.duration
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

const offsetDurationInMinutes = 15;
const pct = .3; 
const radiusOffset = 50; 

exports.activeTrip = (req, res) => {
    var riderArray = [];
    User.findById(req.auth._id, (err, user) => {
       if (!user || user.active_trip == undefined || user.active_trip == null) {
            res.statusMessage = "No active trip";
            return res.status(400).end();
        }
        Trip.findById(user.active_trip, (err, trip) => {
            if (!trip) return res.status(404).end();
            User.findById(trip.driver, (err, user_driver) => {
                const riders = trip.riders;
                if(riders.length === 0){
                    return res.status(200).json({
                        ...trip._doc,
                        riders: riderArray,
                        driver: user_driver ? user_driver.name + ' ' + user_driver.lastname : "Unknown"
                    })
                }
                var i = 0;
                riders.forEach(rider => {
                    User.findById(rider, (err, user_rider) => {
                        if (err) return res.status(500).end();
                        if (user_rider) riderArray.push(String(user_rider.name + ' ' + user_rider.lastname));
                        i++;
                        if (i == riders.length) {
                            return res.status(200).json({
                                ...trip._doc,
                                riders: riderArray,
                                driver: user_driver ? user_driver.name + ' ' + user_driver.lastname : "Unknown"
                            })
                        }
                    })
                })
            });
        });
    });
}

exports.drive = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        if (err) return res.status(500).end();
        if (user.active_trip == undefined || user.active_trip == null) {
            // Ensure route is in {lat, lng} format for PolyUtil
            const route = req.body.route ? req.body.route.map(p => 
                Array.isArray(p) ? { lat: p[0], lng: p[1] } : p
            ) : [];

            const tripObj = new Trip({
                driver: req.auth._id,
                source: req.body.src,
                destination: req.body.dst,
                sourceName: req.body.sourceName,
                destinationName: req.body.destinationName,
                vehicleDetails: req.body.vehicleDetails,
                route: route,
                dateTime: new Date(req.body.dateTime),
                max_riders: req.body.max_riders,
                perPerson: req.body.perPerson,
                totalFare: req.body.totalFare,
            });
            tripObj.save((err, trip) => {
                if (err) return res.status(500).end();
                
                user.active_trip = trip._id;
                user.trip_role_driver = true;
                user.save((err) => {
                    if (err) {
                        trip.deleteOne();
                        return res.status(500).end();
                    }
                    return res.status(200).json(trip);
                })
            })
        } else {
            res.statusMessage = "A trip is already active";
            return res.status(400).end();
        }
    })
}

exports.ride = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        if (user.active_trip == undefined || user.active_trip == null) {
            let startDateTime = new Date(req.body.dateTime);
            startDateTime.setMinutes(startDateTime.getMinutes() - offsetDurationInMinutes);
            let endDateTime = new Date(req.body.dateTime);
            endDateTime.setMinutes(endDateTime.getMinutes() + offsetDurationInMinutes);
            
            Trip.find({
                completed: false,
                available_riders: true,
                dateTime: {
                    $gte: startDateTime,
                    $lte: endDateTime
                },
            }, function (err, trips) {
                if (err || !trips.length) {
                    res.statusMessage = "No matches found.";
                    return res.status(400).end();
                }
                var matchedTrip;
                trips.forEach(tempTrip => {
                    if (!tempTrip.route || tempTrip.route.length < 2) return;
                    const pctLen = parseInt(tempTrip.route.length * pct);
                    let found = PolyUtil.isLocationOnPath(
                        req.body.src,
                        tempTrip.route.slice(0, pctLen),
                        radiusOffset
                    );
                    if (found) {
                        found = PolyUtil.isLocationOnPath(
                            req.body.dst,
                            tempTrip.route.slice(pctLen),
                            radiusOffset
                        );
                        if (found) matchedTrip = tempTrip;
                    }
                });

                if (!matchedTrip) {
                    res.statusMessage = "No match found";
                    return res.status(400).end();
                }

                // Recalculate route with new passenger waypoints
                const waypoints = [...matchedTrip.waypoints, req.body.src, req.body.dst];
                const pointsToRoute = [matchedTrip.source, ...waypoints, matchedTrip.destination];
                
                getOSRMRoute(pointsToRoute)
                    .then(({ polyline }) => {
                        matchedTrip.route = polyline;
                        matchedTrip.waypoints = waypoints;
                        matchedTrip.riders.push(user._id);
                        matchedTrip.available_riders = matchedTrip.riders.length < matchedTrip.max_riders;
                        
                        matchedTrip.save((err, savedTrip) => {
                            if (err) return res.status(500).end();
                            user.active_trip = savedTrip._id;
                            user.trip_role_driver = false;
                            user.save((err) => {
                                if (err) return res.status(500).end();
                                return res.status(200).json(savedTrip);
                            })
                        });
                    })
                    .catch(e => {
                        res.statusMessage = "Routing error: " + e.message;
                        return res.status(500).end();
                    });
            });
        } else {
            res.statusMessage = "A trip is already active";
            return res.status(400).end();
        }
    })
}

exports.cancelTrip = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        // if (err)
        //     return res.status(500).end();
        if (user.active_trip == undefined || user.active_trip == null) {
            res.statusMessage = "No active trip";
            return res.status(400).end();
        } else {
            Trip.findById(user.active_trip, (err, trip) => {
                // if (err)
                //     return res.status(500).end();
                if (trip) {
                    if (user.trip_role_driver) {
                        trip.riders.forEach(rider => {
                            User.findById(rider, (err, user_rider) => {
                                if (user_rider) {
                                    user_rider.active_trip = null;
                                    user_rider.trip_role_driver = null;
                                    user_rider.save();
                                }
                            })
                        });
                        trip.deleteOne();
                    } else {
                        const riderIndex = trip.riders.indexOf(user._id);
                        if (riderIndex > -1) {
                            trip.waypoints.splice(riderIndex * 2, 2);
                            trip.riders.splice(riderIndex, 1);
                            
                            const pointsToRoute = [trip.source, ...trip.waypoints, trip.destination];
                            getOSRMRoute(pointsToRoute)
                                .then(({ polyline }) => {
                                    trip.route = polyline;
                                    trip.available_riders = true;
                                    trip.save();
                                })
                                .catch(e => console.error("Cancel routing error:", e));
                        }
                    }
                }
                user.active_trip = null;
                user.trip_role_driver = null;
                user.save((err) => {
                    return res.status(200).end();
                });
            });
        }
    })
}

exports.tripHistory = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        if (!user) return res.status(404).end();
        Trip.find({ '_id': { $in: user.trips } }, (err, trips) => {
            res.status(200).json(trips);
        })
    })
}

exports.tripDone = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        if (!user || user.active_trip == undefined || user.active_trip == null) {
            res.statusMessage = "No active trip";
            return res.status(400).end();
        } else {
            Trip.findById(user.active_trip, (err, trip) => {
                if (!trip) return res.status(404).end();
                trip.completed = true;
                trip.save();
                
                user.trips.push(trip._id);
                user.active_trip = null;
                user.trip_role_driver = null;
                user.save();
                
                trip.riders.forEach(rider => {
                    User.findById(rider, (err, user_rider) => {
                        if (user_rider) {
                            user_rider.trips.push(trip._id);
                            user_rider.active_trip = null;
                            user_rider.trip_role_driver = null;
                            user_rider.save();
                        }
                    })
                });
                return res.status(200).end();
            })
        }
    })
}

exports.isDriver = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        if (!user || user.trip_role_driver == undefined || user.trip_role_driver == null) {
            res.statusMessage = "No active trip";
            return res.status(400).end();
        } else {
            res.status(200).json({ "isdriver": user.trip_role_driver })
        }
    })
}

exports.availableTrips = (req, res) => {
    Trip.find({ 
        completed: false, 
        available_riders: true,
        driver: { $ne: req.auth._id }
    }, (err, trips) => {
        if (err) return res.status(500).json({ error: "Failed to fetch trips" });
        if (trips.length === 0) return res.status(200).json([]);
        
        let results = [];
        let count = 0;
        trips.forEach(trip => {
            User.findById(trip.driver, (err, user_driver) => {
                results.push({
                    ...trip._doc,
                    driverName: user_driver ? `${user_driver.name} ${user_driver.lastname}` : "Unknown Driver"
                });
                count++;
                if (count === trips.length) {
                    return res.status(200).json(results);
                }
            });
        });
    });
}

exports.joinTrip = (req, res) => {
    const { tripId } = req.params;
    const { src, dst } = req.body;
    
    User.findById(req.auth._id, (err, user) => {
        if (!user) return res.status(404).end();
        if (user.active_trip) {
            return res.status(400).json({ error: "You already have an active trip" });
        }
        
        Trip.findById(tripId, (err, trip) => {
            if (err || !trip) return res.status(404).json({ error: "Trip not found" });
            if (!trip.available_riders) return res.status(400).json({ error: "Trip is full" });
            
            const performJoin = (updatedFields = {}) => {
                trip.riders.push(user._id);
                trip.available_riders = trip.riders.length < trip.max_riders;
                Object.assign(trip, updatedFields);
                
                trip.save((err, savedTrip) => {
                    if (err) return res.status(500).json({ error: "Failed to join trip" });
                    
                    user.active_trip = savedTrip._id;
                    user.trip_role_driver = false;
                    user.save((err) => {
                        if (err) return res.status(500).json({ error: "Failed to update user status" });
                        return res.status(200).json(savedTrip);
                    });
                });
            };

            if (src && dst) {
                const waypoints = [...trip.waypoints, src, dst];
                const pointsToRoute = [trip.source, ...waypoints, trip.destination];
                
                getOSRMRoute(pointsToRoute)
                    .then(({ polyline }) => {
                        performJoin({ waypoints, route: polyline });
                    })
                    .catch(e => {
                        console.error("Join routing error:", e);
                        // Fallback to joining without route update if OSRM fails
                        performJoin();
                    });
            } else {
                performJoin();
            }
        });
    });
}