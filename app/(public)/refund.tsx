import React from "react";
import LegalPageShell, { LegalH2, LegalP, LegalBullet } from "../../components/LegalPageShell";

export default function RefundPolicy() {
  return (
    <LegalPageShell title="Refund Policy">
      <LegalP><strong style={{ color: '#fff' }}>Effective date:</strong> 09 March 2026</LegalP>
      <LegalP>This policy explains refund handling for wallet recharge and payment transactions on Maxsas Realty AI.</LegalP>
      
      <LegalH2>Recharge Credits</LegalH2>
      <LegalBullet>Wallet recharges are intended for consumption of AI calling and related platform services.</LegalBullet>
      <LegalBullet>After successful credit to wallet, recharge amounts are generally non-refundable.</LegalBullet>

      <LegalH2>Failed or Duplicate Transactions</LegalH2>
      <LegalBullet>If a payment fails but amount is debited from your bank/card/UPI, we initiate verification with the payment gateway.</LegalBullet>
      <LegalBullet>Verified failed or duplicate debits are refunded back to original payment source as per gateway/bank timelines.</LegalBullet>

      <LegalH2>Incorrect Debit Resolution</LegalH2>
      <LegalBullet>If you see an unexpected wallet deduction, report it with transaction reference and timestamp.</LegalBullet>
      <LegalBullet>After validation, adjustment is made either as wallet credit reversal or source refund, depending on case type.</LegalBullet>

      <LegalH2>Processing Timelines</LegalH2>
      <LegalBullet>Initial acknowledgement is usually within 2 business days.</LegalBullet>
      <LegalBullet>Approved reversals typically reflect within 5-10 business days, subject to bank and gateway SLA.</LegalBullet>
    </LegalPageShell>
  );
}
