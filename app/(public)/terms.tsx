import React from "react";
import LegalPageShell, { LegalH2, LegalP, LegalBullet } from "../../components/LegalPageShell";

export default function TermsAndConditions() {
  return (
    <LegalPageShell title="Terms and Conditions">
      <LegalP><strong style={{ color: '#fff' }}>Effective date:</strong> 09 March 2026</LegalP>
      <LegalP>These Terms govern the use of Maxsas Realty AI platform, including lead imports, automated calling workflows, analytics, and wallet-based recharge services. By using the platform, you agree to these terms.</LegalP>
      
      <LegalH2>Service Scope</LegalH2>
      <LegalBullet>Maxsas Realty AI provides software tools for lead management and AI-assisted communication workflows for real estate teams.</LegalBullet>
      <LegalBullet>You are responsible for how you use calls, scripts, and outreach features within applicable law and platform rules.</LegalBullet>

      <LegalH2>Account Responsibility</LegalH2>
      <LegalBullet>You must provide accurate account details and keep credentials secure.</LegalBullet>
      <LegalBullet>Any activity from your account is treated as authorized by your organization unless reported otherwise.</LegalBullet>

      <LegalH2>Wallet and Payments</LegalH2>
      <LegalBullet>Recharge amounts are credited to your in-app wallet and consumed based on actual platform usage.</LegalBullet>
      <LegalBullet>Payment processing may be handled by approved third-party gateways such as PhonePe.</LegalBullet>
      <LegalBullet>Failed transactions are not charged; if charged accidentally, reconciliation is processed as per refund policy.</LegalBullet>

      <LegalH2>Acceptable Use</LegalH2>
      <LegalBullet>You must not use the platform for fraud, spam, harassment, or unlawful telemarketing activities.</LegalBullet>
      <LegalBullet>You must obtain required user consent and follow Do Not Disturb and calling-time regulations wherever applicable.</LegalBullet>

      <LegalH2>Suspension and Termination</LegalH2>
      <LegalBullet>Access may be suspended for policy breaches, payment abuse, or security risks.</LegalBullet>
      <LegalBullet>On termination, active services stop and data retention follows privacy and legal requirements.</LegalBullet>
    </LegalPageShell>
  );
}
