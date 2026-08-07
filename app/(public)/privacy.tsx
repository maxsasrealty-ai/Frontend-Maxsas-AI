import React from "react";
import LegalPageShell, { LegalH2, LegalP, LegalBullet } from "../../components/LegalPageShell";

export default function PrivacyPolicy() {
  return (
    <LegalPageShell title="Privacy Policy">
      <LegalP><strong style={{ color: '#fff' }}>Effective date:</strong> 09 March 2026</LegalP>
      <LegalP>Maxsas Realty AI respects your privacy and processes business and lead data only for service delivery, security, and legal compliance.</LegalP>
      
      <LegalH2>Information We Collect</LegalH2>
      <LegalBullet>Account details such as name, phone number, and email for authentication and support.</LegalBullet>
      <LegalBullet>Business workflow data such as imported leads, call outcomes, follow-ups, and wallet transactions.</LegalBullet>
      <LegalBullet>Technical metadata such as device/browser logs for security, diagnostics, and performance monitoring.</LegalBullet>

      <LegalH2>How We Use Data</LegalH2>
      <LegalBullet>To run platform features including lead workflows, calling automation, scheduling, and dashboards.</LegalBullet>
      <LegalBullet>To process payments and maintain transaction records through integrated payment partners.</LegalBullet>
      <LegalBullet>To improve reliability, detect misuse, and comply with legal obligations.</LegalBullet>

      <LegalH2>Data Sharing</LegalH2>
      <LegalBullet>We do not sell personal data.</LegalBullet>
      <LegalBullet>Data may be shared with trusted infrastructure or payment service providers only to deliver the requested service.</LegalBullet>
      <LegalBullet>Data may be disclosed when required by law, court order, or regulatory authority.</LegalBullet>

      <LegalH2>Retention and Security</LegalH2>
      <LegalBullet>Data is retained only as long as needed for active services, audit, or legal obligations.</LegalBullet>
      <LegalBullet>Reasonable technical and organizational controls are used to protect your data from unauthorized access.</LegalBullet>

      <LegalH2>Your Rights</LegalH2>
      <LegalBullet>You may request correction of inaccurate profile information.</LegalBullet>
      <LegalBullet>You may request account deletion, subject to settlement, audit, and legal retention requirements.</LegalBullet>
    </LegalPageShell>
  );
}
