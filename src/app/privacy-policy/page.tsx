'use client'

import { useRouter } from 'next/navigation'

export default function PrivacyPolicyPage() {
  const router = useRouter()

  return (
    <main className="privacy-container">
      {/* Header with Back Button */}
      <header className="chat-header" style={{ position: 'sticky', top: 0 }}>
        <h2>Privacy Policy</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="button secondary" onClick={() => router.push('/chat')}>
            Back
          </button>
        </div>
      </header>

      {/* Content */}
      <section className="privacy-content">
        <p><strong>Last Updated:</strong> December 2025</p>

        <p>
          At <strong>TrustAI</strong>, we are committed to protecting your privacy and the confidentiality
          of your personal information. This policy explains how we collect, use, store, and protect
          your data when using our system.
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li><strong>Personal Information:</strong> name, email, and login credentials (via Supabase).</li>
          <li><strong>Usage Data:</strong> chat history, mode preferences, and survey responses.</li>
          <li><strong>Technical Data:</strong> device details, browser info, and IP address for performance and security.</li>
        </ul>

        <h2>2. How We Use Your Data</h2>
        <ul>
          <li>To provide and improve chatbot functionality and user experience.</li>
          <li>To analyze performance and enhance model trust and transparency.</li>
          <li>To ensure compliance with data protection and security requirements.</li>
        </ul>

        <h2>3. Data Security</h2>
        <p>
          All data is encrypted and securely stored. Access is restricted to authorized personnel only.
          We actively monitor and maintain our systems to prevent misuse or unauthorized access.
        </p>

        <h2>4. Data Retention</h2>
        <p>
          Data is retained only as long as necessary for operational or legal purposes. You can request deletion
          of your data at any time by contacting our support team.
        </p>

        <h2>5. Third-Party Services</h2>
        <p>
          We use trusted services like <strong>Supabase</strong> for authentication and secure storage.
          These providers comply with industry-standard privacy practices.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          You may access, correct, or delete your personal data and withdraw consent for processing at any time.
        </p>

        <h2>7. Updates to This Policy</h2>
        <p>
          We may update this policy periodically. Any significant changes will be communicated via the app or email.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          For any questions or concerns about this Privacy Policy, please contact us at
          <strong> support@trustai.app</strong>.
        </p>
      </section>
    </main>
  )
}
