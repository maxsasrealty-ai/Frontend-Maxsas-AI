# PROJECT DIRECTORY TREE

C:\Users\anubh\Desktop\Dev - Codes
├── backend
│   ├── prisma
│   │   └── schema.prisma
│   ├── docs
│   │   ├── DB_MIGRATION_NOTES.md
│   │   └── IMPLEMENTATION_STATUS.md
│   ├── src
│   │   ├── index.ts
│   │   ├── middleware
│   │   │   ├── requireTenant.ts
│   │   │   ├── requireCapability.ts
│   │   │   ├── requireAdminAccess.ts
│   │   │   ├── verifyWebhookAuth.ts
│   │   │   ├── lexusGuard.ts
│   │   │   └── enterpriseGuard.ts
│   │   ├── services
│   │   │   ├── telephonyService.ts
│   │   │   ├── callService.ts
│   │   │   ├── voiceEventService.ts
│   │   │   ├── paymentService.ts
│   │   │   ├── adminService.ts
│   │   │   ├── realtimeService.ts
│   │   │   └── accessService.ts
│   │   ├── repositories
│   │   │   ├── callRepository.ts
│   │   │   ├── eventRepository.ts
│   │   │   ├── transcriptRepository.ts
│   │   │   ├── leadRepository.ts
│   │   │   ├── tenantRepository.ts
│   │   │   ├── campaignRepository.ts
│   │   │   └── walletRepository.ts
│   │   ├── routes
│   │   │   ├── calls.ts
│   │   │   ├── campaigns.ts
│   │   │   ├── payment.ts
│   │   │   ├── realtime.ts
│   │   │   ├── webhooks.ts
│   │   │   └── admin.ts
│   │   └── models
│   │       ├── Lead.ts
│   │       ├── Subscription.ts
│   │       └── User.ts
│   └── package.json
│
├── frontend
│   ├── app
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── (public)
│   │   │   ├── login.tsx
│   │   │   └── signup.tsx
│   │   ├── (protected)
│   │   │   ├── _layout.tsx
│   │   │   ├── admin
│   │   │   │   ├── index.tsx
│   │   │   │   └── tenants
│   │   │   │       ├── index.tsx
│   │   │   │       └── [id].tsx
│   │   │   ├── enterprise
│   │   │   │   ├── index.tsx
│   │   │   │   ├── dashboard.tsx
│   │   │   │   ├── billing.tsx
│   │   │   │   └── campaigns.tsx
│   │   │   └── lexus
│   │   │       ├── index.tsx
│   │   │       ├── calls.tsx
│   │   │       ├── wallet.tsx
│   │   │       ├── profile.tsx
│   │   │       ├── leads-upload.tsx
│   │   │       ├── completed.tsx
│   │   │       └── batches
│   │   │           └── index.tsx
│   │   └── _not-found.tsx
│   │
│   ├── components
│   │   ├── landing
│   │   │   └── WebinarLandingScreen.tsx
│   │   ├── enterprise
│   │   │   └── EnterpriseSidebar.tsx
│   │   └── ui
│   │       ├── GlassCard.tsx
│   │       ├── PillButton.tsx
│   │       ├── SectionHeader.tsx
│   │       └── StatusPill.tsx
│   │
│   ├── context
│   │   └── CallsContext.tsx
│   │
│   ├── hooks
│   │   ├── useCalls.ts
│   │   ├── useCallDetail.ts
│   │   ├── useCapabilities.ts
│   │   └── useWorkspaceProfile.ts
│   │
│   ├── lib
│   │   ├── api
│   │   │   ├── client.ts
│   │   │   ├── calls.ts
│   │   │   ├── admin.ts
│   │   │   └── payment.ts
│   │   └── realtime
│   │       └── client.ts
│   │
│   ├── assets
│   │   ├── images
│   │   │   ├── maxsas-logo.png
│   │   │   └── anubhav.png
│   │   └── fonts
│   │       └── (project fonts if any)
│   │
│   ├── themes
│   │   └── (theme files if any)
│   │
│   ├── public
│   │   └── anubhav.png
│   │
│   ├── package.json
│   └── tsconfig.json
│
└── voice-agent
    ├── (external worker / separate deployment)
    ├── python
    │   └── (LiveKit voice worker code)
    ├── services
    │   └── (agent dispatch / SIP / transcription logic)
    ├── requirements.txt
    ├── Dockerfile
    └── README.md