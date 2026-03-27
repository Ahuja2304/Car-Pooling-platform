import React, { useState } from "react";
import { Form, Button, Container, Card, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

export default function Login({ setToken, setActiveTrip }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLoginSuccess = (sessionUserDetails) => {
        if (sessionUserDetails) {
            if (sessionUserDetails.user.active_trip)
                setActiveTrip(sessionUserDetails.user.active_trip);
            if (sessionUserDetails.token)
                setToken({ token: sessionUserDetails.token, name: sessionUserDetails.user.name });
            window.location.reload();
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(import.meta.env.VITE_END_POINT + '/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                handleLoginSuccess(data);
            } else {
                alert(data.error || "Login failed");
            }
        } catch (error) {
            alert("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await fetch(import.meta.env.VITE_END_POINT + '/google-signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: credentialResponse.credential })
            });
            const data = await response.json();
            if (response.ok) {
                handleLoginSuccess(data);
            } else {
                alert(data.error || "Google login failed");
            }
        } catch (error) {
            alert("Google authentication error.");
        }
    };

    return (
        <Container className="auth-container d-flex align-items-center justify-content-center responsive-container">
            <Card className="auth-card p-4">
                <div className="auth-header mb-4">
                    <h2 className="title-text">TACS</h2>
                    <p className="subtitle-text text-muted">Sign in to your account</p>
                </div>
                
                <Form onSubmit={handleSubmit} className="auth-form">
                    <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="name@vitstudent.ac.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Button variant="teal" type="submit" className="w-100 py-2 mb-3 auth-btn" disabled={loading}>
                        {loading ? (
                            <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Signing in...</>
                        ) : 'Sign In'}
                    </Button>
                </Form>

                <div className="divider mb-3">
                    <span>or</span>
                </div>

                <div className="google-btn-wrapper d-flex justify-content-center mb-4">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => alert('Login Failed')}
                        theme="filled_black"
                        shape="pill"
                        text="continue_with"
                        width="100%"
                    />
                </div>

                <div className="auth-footer text-center">
                    <p>Don't have an account? <Link to="/signup" className="teal-link">Create Account</Link></p>
                </div>
            </Card>
        </Container>
    );
}

// Login.propTypes = {
//     setToken: PropTypes.func.isRequired
//   };
