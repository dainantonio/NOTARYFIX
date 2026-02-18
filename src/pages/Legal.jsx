import React from 'react';

export const LegalContent = ({ type }) => {
    const titles = { privacy: "Privacy Policy", terms: "Terms of Service", security: "Security Overview" };
    return (
        <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
            <p className="text-sm text-slate-400">Last Updated: October 24, 2026</p>
            <p>Welcome to NotaryPro. This document outlines the {titles[type]?.toLowerCase()} for our platform.</p>
            
            <h3 className="text-xl font-bold text-slate-800 mt-8">1. Overview</h3>
            <p>We take your data and compliance seriously. By using NotaryPro, you agree to adhere to all local state laws regarding notarization.</p>
            
            <h3 className="text-xl font-bold text-slate-800 mt-8">2. Data Protection</h3>
            <p>All data is encrypted using AES-256 standards. We do not sell your data to third parties. We utilize SOC 2 Type II compliant infrastructure to ensure the highest level of security for your client's PII.</p>
            
            <h3 className="text-xl font-bold text-slate-800 mt-8">3. User Responsibilities</h3>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must ensure that your digital journal entries comply with your specific state's Secretary of State regulations.</p>
            
            <h3 className="text-xl font-bold text-slate-800 mt-8">4. Service Availability</h3>
            <p>While we strive for 99.9% uptime, we are not liable for business interruptions caused by server outages or third-party service failures.</p>
        </div>
    );
};
