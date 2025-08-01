import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(null);

    // Check if token is expired
    const isTokenExpired = (token) => {
        if (!token) return true;
        
        try {
            // JWT tokens have 3 parts separated by dots
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            // Check if token expires within the next 5 minutes (300 seconds)
            return payload.exp < (currentTime + 300);
        } catch (error) {
            console.error('Error parsing token:', error);
            return true;
        }
    };

    const validateToken = async (token) => {
        try {
            // Check if token is expired before making API call
            if (isTokenExpired(token)) {
                console.log('🔒 Token expired or expiring soon, attempting refresh...');
                await refreshToken();
                return;
            }

            const response = await userAPI.getProfile();
            setUser(response.data);
        } catch (error) {
            console.error('Token validation failed:', error);
            // Token invalid, try refresh
            await refreshToken();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check for stored tokens on app load
        const storedToken = localStorage.getItem('accessToken');

        if (storedToken) {
            setAccessToken(storedToken);
            // Validate token and get user info
            validateToken(storedToken);
        } else {
            setLoading(false);
        }
    }, []);

    // Set up periodic token validation (every 10 minutes)
    useEffect(() => {
        if (!accessToken) return;

        const interval = setInterval(() => {
            const currentToken = localStorage.getItem('accessToken');
            if (currentToken && isTokenExpired(currentToken)) {
                console.log('🔄 Periodic check: Token expired, refreshing...');
                refreshToken();
            }
        }, 10 * 60 * 1000); // Check every 10 minutes

        return () => clearInterval(interval);
    }, [accessToken]);

    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            const { user, accessToken, refreshToken } = response.data;

            setUser(user);
            setAccessToken(accessToken);
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            return response.data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error.response?.data?.error || error.response?.data?.message || 'Registration failed';
        }
    };

    const login = async (credentials) => {
        try {
            console.log('🔐 AuthContext: Attempting login...');
            const response = await authAPI.login(credentials);
            console.log('🔐 AuthContext: Login response received:', response.status);
            const { user, accessToken, refreshToken } = response.data;

            setUser(user);
            setAccessToken(accessToken);
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            console.log('✅ AuthContext: User logged in successfully:', user.email);

            return response.data;
        } catch (error) {
            console.error('❌ AuthContext: Login error:', error);
            console.error('❌ AuthContext: Error response:', error.response?.data);
            console.error('❌ AuthContext: Error status:', error.response?.status);
            throw error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed';
        }
    };

    const logout = async (skipApiCall = false) => {
        try {
            if (!skipApiCall) {
                await authAPI.logout();
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            console.log('🔓 Logging out user...');
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            // Redirect to login if not already there
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                window.location.href = '/login';
            }
        }
    };

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
            logout();
            return;
        }

        try {
            const response = await authAPI.refreshToken(refreshToken);
            const { accessToken: newAccessToken, user } = response.data;
            
            setAccessToken(newAccessToken);
            setUser(user);
            localStorage.setItem('accessToken', newAccessToken);
            
            return newAccessToken;
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout(true); // Skip API call since refresh failed
        }
    };

    const updateProfile = async (updates) => {
        try {
            const response = await userAPI.updateProfile(updates);
            setUser(response.data.profile);
            return response.data.profile;
        } catch (error) {
            throw error.response?.data?.error || 'Profile update failed';
        }
    };

    const value = {
        user,
        accessToken,
        loading,
        login,
        register,
        logout,
        refreshToken,
        updateProfile,
        isAuthenticated: !!user,
        isTokenExpired,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};