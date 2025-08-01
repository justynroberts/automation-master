import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, LogIn, Workflow, Zap } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        console.log('🔐 Login attempt with:', { email: formData.email });
        console.log('🔧 API Base URL:', process.env.REACT_APP_API_URL || 'http://localhost:3001/api');

        try {
            await login(formData);
            console.log('✅ Login successful, navigating to dashboard');
            navigate('/dashboard');
        } catch (err) {
            console.error('❌ Login failed:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>
                {`
                    @keyframes slideInUp {
                        from {
                            opacity: 0;
                            transform: translateY(60px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    @keyframes slideInLeft {
                        from {
                            opacity: 0;
                            transform: translateX(-40px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    @keyframes scaleIn {
                        from {
                            opacity: 0;
                            transform: scale(0.8);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }

                    @keyframes pulse {
                        0%, 100% {
                            transform: scale(1);
                            box-shadow: 0 8px 32px rgba(0, 212, 170, 0.3);
                        }
                        50% {
                            transform: scale(1.05);
                            box-shadow: 0 12px 40px rgba(0, 212, 170, 0.5);
                        }
                    }

                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }

                    @keyframes gradient {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }

                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                    }

                    @keyframes shimmer {
                        0% { background-position: -200% center; }
                        100% { background-position: 200% center; }
                    }

                    .login-container {
                        background: linear-gradient(-45deg, #0a0a0a, #1a1a1a, #0f0f0f, #121212);
                        background-size: 400% 400%;
                        animation: gradient 15s ease infinite;
                    }

                    .login-card {
                        backdrop-filter: blur(20px);
                        background: rgba(26, 26, 26, 0.8);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }

                    .icon-container {
                        animation: ${mounted ? 'pulse 3s ease-in-out infinite' : 'none'};
                    }

                    .form-container {
                        animation: ${mounted ? 'slideInUp 0.8s ease-out 0.2s both' : 'none'};
                    }

                    .header-container {
                        animation: ${mounted ? 'slideInLeft 0.6s ease-out both' : 'none'};
                    }

                    .loading-spinner {
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }

                    .btn-primary {
                        background: linear-gradient(135deg, #00d4aa 0%, #1fbad3 100%);
                        background-size: 200% 200%;
                        transition: all 0.3s ease;
                    }

                    .btn-primary:hover:not(:disabled) {
                        background-position: right center;
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(0, 212, 170, 0.4);
                    }

                    .btn-primary:active:not(:disabled) {
                        transform: translateY(0);
                    }

                    .floating-elements {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                        pointer-events: none;
                    }

                    .floating-element {
                        position: absolute;
                        opacity: 0.1;
                        animation: float 6s ease-in-out infinite;
                    }

                    .floating-element:nth-child(1) {
                        top: 10%;
                        left: 10%;
                        animation-delay: 0s;
                    }

                    .floating-element:nth-child(2) {
                        top: 20%;
                        right: 10%;
                        animation-delay: 2s;
                    }

                    .floating-element:nth-child(3) {
                        bottom: 20%;
                        left: 20%;
                        animation-delay: 4s;
                    }

                    .floating-element:nth-child(4) {
                        bottom: 10%;
                        right: 20%;
                        animation-delay: 1s;
                    }

                    .input-field {
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    .input-field:focus {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(0, 212, 170, 0.15);
                    }

                    .error-message {
                        animation: slideInUp 0.3s ease-out;
                    }

                    .shimmer-text {
                        background: linear-gradient(90deg, #ffffff 0%, #00d4aa 50%, #ffffff 100%);
                        background-size: 200% 100%;
                        background-clip: text;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        animation: shimmer 3s ease-in-out infinite;
                    }
                `}
            </style>

            <div className="login-container" style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 16px',
                fontFamily: '"Inter", sans-serif',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Floating Elements */}
                <div className="floating-elements">
                    <div className="floating-element">
                        <Workflow style={{ width: '60px', height: '60px', color: '#00d4aa' }} />
                    </div>
                    <div className="floating-element">
                        <Zap style={{ width: '40px', height: '40px', color: '#1fbad3' }} />
                    </div>
                    <div className="floating-element">
                        <Workflow style={{ width: '50px', height: '50px', color: '#00d4aa' }} />
                    </div>
                    <div className="floating-element">
                        <Zap style={{ width: '35px', height: '35px', color: '#1fbad3' }} />
                    </div>
                </div>

                <div style={{
                    maxWidth: '420px',
                    width: '100%',
                    zIndex: 1
                }}>
                    {/* Header */}
                    <div className="header-container" style={{ 
                        textAlign: 'center', 
                        marginBottom: '40px' 
                    }}>
                        <div className="icon-container" style={{
                            margin: '0 auto 32px',
                            width: '80px',
                            height: '80px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, #00d4aa 0%, #1fbad3 100%)',
                            boxShadow: '0 8px 32px rgba(0, 212, 170, 0.3)'
                        }}>
                            <Workflow style={{ width: '40px', height: '40px', color: '#000000' }} />
                        </div>
                        
                        <h1 className="shimmer-text" style={{
                            fontSize: '36px',
                            fontWeight: '800',
                            marginBottom: '12px',
                            letterSpacing: '-0.025em',
                            lineHeight: '1.1'
                        }}>
                            Welcome back
                        </h1>
                        
                        <p style={{
                            fontSize: '18px',
                            color: '#a0a0a0',
                            marginBottom: '0',
                            fontWeight: '400'
                        }}>
                            Sign in to Hooksley Platform Automation
                        </p>
                    </div>

                    {/* Form */}
                    <div className="form-container login-card" style={{
                        borderRadius: '24px',
                        padding: '40px',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    }}>
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="error-message" style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#fca5a5',
                                    padding: '16px 20px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    marginBottom: '28px',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ marginBottom: '28px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    marginBottom: '10px'
                                }}>
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input-field"
                                    style={{
                                        width: '100%',
                                        padding: '16px 20px',
                                        backgroundColor: 'rgba(18, 18, 18, 0.8)',
                                        border: '1px solid rgba(64, 64, 64, 0.5)',
                                        borderRadius: '12px',
                                        color: '#ffffff',
                                        fontSize: '16px',
                                        outline: 'none',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    placeholder="Enter your email"
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#00d4aa';
                                        e.target.style.backgroundColor = 'rgba(45, 45, 45, 0.8)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(64, 64, 64, 0.5)';
                                        e.target.style.backgroundColor = 'rgba(18, 18, 18, 0.8)';
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '36px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    marginBottom: '10px'
                                }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="input-field"
                                        style={{
                                            width: '100%',
                                            padding: '16px 60px 16px 20px',
                                            backgroundColor: 'rgba(18, 18, 18, 0.8)',
                                            border: '1px solid rgba(64, 64, 64, 0.5)',
                                            borderRadius: '12px',
                                            color: '#ffffff',
                                            fontSize: '16px',
                                            outline: 'none',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                        placeholder="Enter your password"
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#00d4aa';
                                            e.target.style.backgroundColor = 'rgba(45, 45, 45, 0.8)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'rgba(64, 64, 64, 0.5)';
                                            e.target.style.backgroundColor = 'rgba(18, 18, 18, 0.8)';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '20px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#8a8a8a',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.color = '#b3b3b3';
                                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.color = '#8a8a8a';
                                            e.target.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        {showPassword ? 
                                            <EyeOff style={{ width: '20px', height: '20px' }} /> : 
                                            <Eye style={{ width: '20px', height: '20px' }} />
                                        }
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    color: '#000000',
                                    border: 'none',
                                    padding: '18px 24px',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    opacity: loading ? 0.7 : 1,
                                    letterSpacing: '0.025em'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div className="loading-spinner" style={{ 
                                            width: '18px', 
                                            height: '18px',
                                            border: '2px solid rgba(0,0,0,0.3)',
                                            borderTop: '2px solid #000000'
                                        }} />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <LogIn style={{ width: '20px', height: '20px' }} />
                                        Sign in
                                    </>
                                )}
                            </button>
                        </form>

                        <div style={{
                            textAlign: 'center',
                            marginTop: '32px',
                            padding: '28px 0 0',
                            borderTop: '1px solid rgba(45, 45, 45, 0.5)'
                        }}>
                            <p style={{
                                color: '#9ca3af',
                                fontSize: '15px',
                                margin: '0',
                                fontWeight: '400'
                            }}>
                                Don't have an account?{' '}
                                <Link 
                                    to="/register" 
                                    style={{
                                        color: '#00d4aa',
                                        textDecoration: 'none',
                                        fontWeight: '600',
                                        transition: 'all 0.2s ease',
                                        borderRadius: '4px',
                                        padding: '2px 4px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.color = '#00c299';
                                        e.target.style.backgroundColor = 'rgba(0, 212, 170, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.color = '#00d4aa';
                                        e.target.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    Create account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;