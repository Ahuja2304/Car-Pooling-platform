const User = require("../Models/user.js");
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const dotenv = require("dotenv");
const { OAuth2Client } = require('google-auth-library');

dotenv.config()
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.signout = (req, res) => {
    if (Object.keys(req.cookies) != 'tokken') {
        res.statusMessage = "user already signedout";
        return res.status(400).end();
    }
    res.clearCookie("tokken")
    res.status(200).json({
        message: "user signout"
    });
}

exports.signup = (req, res) => {
    const error = validationResult(req)
    if (!error.isEmpty()) {
        res.statusMessage = error.array()[0].msg;
        return res.status(422).end();
    }
    const new_user = new User(req.body);
    new_user.save((err, user) => {
        if (err) {
            res.statusMessage = "User with this email already exists";
            return res.status(400).end();
        }
        const token = jwt.sign({ _id: user._id }, process.env.SECRET)
        res.cookie("tokken", token, { expire: new Date() + 9999 });
        const { _id, name, lastname, email, role, active_trip } = user;
        res.status(200);
        res.json({
            token,
            user: { _id, name: name + ' ' + lastname, email, role, active_trip },
        });
        return res
    })
}

exports.delete_user =(req,res)=>{
    User.findById(req.auth._id,(err,user)=>{
        if((err)||(user==null)){
            res.status(400).json({error:"user cannot be found"})
            return res;
        }
        user.deleteOne((err)=>{
            return res.status(200).end();
        })
    })
}

exports.googleSignin = (req, res) => {
    const { idToken } = req.body;
    if (!idToken) {
        return res.status(400).json({ error: "No Google ID token provided" });
    }

    client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
        .then(response => {
            const { email_verified, family_name, given_name, email, sub } = response.getPayload();
            if (email_verified) {
                User.findOne({ email }).exec((err, user) => {
                    if (err) return res.status(500).json({ error: "Database error" });

                    if (user) {
                        if (!user.googleId) {
                            user.googleId = sub;
                            user.save();
                        }
                        const token = jwt.sign({ _id: user._id }, process.env.SECRET);
                        res.cookie("tokken", token, { expire: new Date() + 9999 });
                        const { _id, name, lastname, email, role, active_trip } = user;
                        return res.json({
                            token,
                            user: { _id, name: name + ' ' + lastname, email, role, active_trip }
                        });
                    } else {
                        const newUser = new User({ 
                            name: given_name, 
                            lastname: family_name || "", 
                            email, 
                            googleId: sub 
                        });
                        newUser.save((err, data) => {
                            if (err) {
                                return res.status(400).json({ error: "Google signup failed" });
                            }
                            const token = jwt.sign({ _id: data._id }, process.env.SECRET);
                            res.cookie("tokken", token, { expire: new Date() + 9999 });
                            const { _id, name, lastname, email, role, active_trip } = data;
                            return res.json({
                                token,
                                user: { _id, name: name + ' ' + lastname, email, role, active_trip }
                            });
                        });
                    }
                });
            } else {
                return res.status(400).json({ error: "Google email not verified" });
            }
        })
        .catch(err => {
            console.error(err);
            return res.status(400).json({ error: "Invalid Google ID token" });
        });
};

exports.signin = (req, res) => {
    const { email, password } = req.body;
    const error = validationResult(req)
    if (!error.isEmpty()) {
        res.statusMessage = error.array()[0].msg;
        return res.status(422).end();
    }

    User.findOne({ email }, (err, user) => {
        if (err || !user) {
            res.statusMessage = "User email does not exist";
            return res.status(400).end();
        }
        if (!user.authenticate(password)) {
            res.statusMessage = "Email and Password does not match"
            return res.status(401).end();
        }
        const token = jwt.sign({ _id: user._id }, process.env.SECRET)
        res.cookie("tokken", token, { expire: new Date() + 9999 });
        const { _id, name, lastname, email, role, active_trip } = user;
        res.status(200);
        res.json({
            token,
            user: { _id, name: name + ' ' + lastname, email, role, active_trip },
        });
        return res
    })
}

exports.isSignedin = (req, res, next) => {
    let token = req.get('coookie')
    if (!token && req.headers['authorization']) {
        const bearerHeader = req.headers['authorization'];
        if (bearerHeader) {
            const bearer = bearerHeader.split(' ');
            token = bearer[1];
        }
    }
    if (token && token != 'undefined') {
        jwt.verify(token, process.env.SECRET, (err, decodestring) => {
            if (err) {
                res.statusMessage = "User authentication expired";
                return res.status(401).end();
            }
            else {
                req.auth = decodestring
                next()
            }
        })
    }
    else {
        res.statusMessage = "User not signed in";
        return res.status(401).end();
    }
}