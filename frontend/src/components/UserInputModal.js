import React, { useState, useEffect } from 'react';
import { X, Play, Users } from 'lucide-react';

const UserInputModal = ({ isOpen, onClose, onSubmit, nodeData, workflowName }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const fields = nodeData?.fields || [];
    const title = nodeData?.title || 'User Input Required';
    const description = nodeData?.description || '';

    useEffect(() => {
        if (isOpen) {
            // Initialize form data with default values
            const initialData = {};
            fields.forEach(field => {
                initialData[field.name] = field.defaultValue || '';
            });
            setFormData(initialData);
            setErrors({});
        }
    }, [isOpen, fields]);

    const validateForm = () => {
        const newErrors = {};
        
        fields.forEach(field => {
            if (field.required && (!formData[field.name] || formData[field.name].trim() === '')) {
                newErrors[field.name] = `${field.label} is required`;
            }
            
            if (field.type === 'email' && formData[field.name]) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData[field.name])) {
                    newErrors[field.name] = 'Please enter a valid email address';
                }
            }
            
            if (field.type === 'number' && formData[field.name]) {
                const numValue = parseFloat(formData[field.name]);
                if (isNaN(numValue)) {
                    newErrors[field.name] = 'Please enter a valid number';
                }
                if (field.min !== undefined && numValue < field.min) {
                    newErrors[field.name] = `Value must be at least ${field.min}`;
                }
                if (field.max !== undefined && numValue > field.max) {
                    newErrors[field.name] = `Value must be at most ${field.max}`;
                }
            }
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
        
        // Clear error for this field if it was previously invalid
        if (errors[fieldName]) {
            setErrors(prev => ({
                ...prev,
                [fieldName]: undefined
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderField = (field) => {
        const value = formData[field.name] || '';
        const hasError = errors[field.name];
        
        const baseInputStyle = {
            width: '100%',
            padding: '8px 12px',
            background: '#2a2a2a',
            border: `1px solid ${hasError ? '#ef4444' : '#404040'}`,
            borderRadius: '4px',
            color: '#ffffff',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease'
        };

        const focusStyle = {
            ...baseInputStyle,
            borderColor: hasError ? '#ef4444' : '#8b5cf6'
        };

        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        rows={field.rows || 3}
                        style={baseInputStyle}
                        onFocus={(e) => e.target.style.borderColor = hasError ? '#ef4444' : '#8b5cf6'}
                        onBlur={(e) => e.target.style.borderColor = hasError ? '#ef4444' : '#404040'}
                    />
                );
            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        style={baseInputStyle}
                        onFocus={(e) => e.target.style.borderColor = hasError ? '#ef4444' : '#8b5cf6'}
                        onBlur={(e) => e.target.style.borderColor = hasError ? '#ef4444' : '#404040'}
                    >
                        <option value="">{field.placeholder || 'Select an option'}</option>
                        {(field.options || []).map((option, index) => (
                            <option key={index} value={option.value || option}>
                                {option.label || option}
                            </option>
                        ))}
                    </select>
                );
            default:
                return (
                    <input
                        type={field.type || 'text'}
                        value={value}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        style={baseInputStyle}
                        onFocus={(e) => e.target.style.borderColor = hasError ? '#ef4444' : '#8b5cf6'}
                        onBlur={(e) => e.target.style.borderColor = hasError ? '#ef4444' : '#404040'}
                    />
                );
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: '#1a1a1a',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                border: '1px solid #404040',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: '#8b5cf6',
                            borderRadius: '8px',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Users size={20} color="white" />
                        </div>
                        <div>
                            <h2 style={{
                                margin: 0,
                                color: '#ffffff',
                                fontSize: '18px',
                                fontWeight: '600'
                            }}>{title}</h2>
                            {workflowName && (
                                <p style={{
                                    margin: 0,
                                    color: '#888888',
                                    fontSize: '14px'
                                }}>Workflow: {workflowName}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#888888',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#333333'}
                        onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                        <X size={20} />
                    </button>
                </div>

                {description && (
                    <p style={{
                        color: '#cccccc',
                        fontSize: '14px',
                        marginBottom: '20px',
                        lineHeight: '1.5'
                    }}>{description}</p>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {fields.map((field, index) => (
                            <div key={index}>
                                <label style={{
                                    display: 'block',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    marginBottom: '6px'
                                }}>
                                    {field.label}
                                    {field.required && (
                                        <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                    )}
                                </label>
                                {renderField(field)}
                                {errors[field.name] && (
                                    <p style={{
                                        color: '#ef4444',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        margin: '4px 0 0 0'
                                    }}>{errors[field.name]}</p>
                                )}
                                {field.helpText && (
                                    <p style={{
                                        color: '#888888',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        margin: '4px 0 0 0'
                                    }}>{field.helpText}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '24px',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: '#333333',
                                border: 'none',
                                color: '#ffffff',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#444444'}
                            onMouseLeave={(e) => e.target.style.background = '#333333'}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: loading ? '#666666' : '#8b5cf6',
                                border: 'none',
                                color: '#ffffff',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) e.target.style.background = '#7c3aed';
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) e.target.style.background = '#8b5cf6';
                            }}
                        >
                            <Play size={16} />
                            {loading ? 'Submitting...' : 'Continue Workflow'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserInputModal;