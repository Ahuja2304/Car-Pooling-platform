import React, { useState } from "react";
import { Form, Button, Container, Card, Row, Col, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import './SignUp.css';

export default function SignUp({ setToken, setActiveTrip }) {
    const [name, setName] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmpassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSuccess = (sessionUserDetails) => {
        if (sessionUserDetails && sessionUserDetails.token) {
            setToken({ token: sessionUserDetails.token, name: sessionUserDetails.user.name });
            if (sessionUserDetails.user.active_trip) {
                setActiveTrip(sessionUserDetails.user.active_trip);
            }
            window.location.reload();
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (password !== confirmpassword) return alert("Passwords do not match");
        
        setLoading(true);
        try {
            const response = await fetch(import.meta.env.VITE_END_POINT + '/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, lastname, email, password })
            });
            const data = await response.json();
            if (response.ok) {
                handleSuccess(data);
            } else {
                alert(data.error || "Signup failed");
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
                handleSuccess(data);
            } else {
                alert(data.error || "Google login failed");
            }
        } catch (error) {
            alert("Google authentication error.");
        }
    };

    return (
        <Container className="auth-container d-flex align-items-center justify-content-center py-5 responsive-container">
            <Card className="auth-card p-4">
                <div className="auth-header mb-4">
                    <h2 className="title-text">TACS</h2>
                    <p className="subtitle-text text-muted">Create your account</p>
                </div>
                
                <Form onSubmit={handleSubmit} className="auth-form">
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>First Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Pranav"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Ahuja"
                                    value={lastname}
                                    onChange={(e) => setLastname(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

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

                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label>Confirm Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="••••••••"
                            value={confirmpassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Button variant="teal" type="submit" className="w-100 py-2 mb-3 auth-btn" disabled={loading}>
                        {loading ? (
                            <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Creating Account...</>
                        ) : 'Sign Up'}
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
                        text="signup_with"
                        width="100%"
                    />
                </div>

                <div className="auth-footer text-center">
                    <p>Already have an account? <Link to="/login" className="teal-link">Log In</Link></p>
                </div>
            </Card>
        </Container>
    );
}
