import LegalLayout from '../components/LegalLayout'

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="June 23, 2026">
      <h2>Introduction</h2>
      <p>
        Clevio AI Staff ("we", "our", or "us") is operated by <strong>PT Clevio</strong>, located at{' '}
        <strong>
          Bukit Golf Cibubur, Riverside 1 Blok A7/25, Gunung Putri, Bojong Nangka, Kec. Gn. Putri,
          Kabupaten Bogor, Jawa Barat 16963, Indonesia
        </strong>
        . This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our
        service. If you have questions, contact us at{' '}
        <a href="mailto:aiagronomists@gmail.com">aiagronomists@gmail.com</a>.
      </p>

      <h2>Information We Collect</h2>
      <p>We collect the following categories of information:</p>
      <ul>
        <li>
          <strong>Account information:</strong> phone number, name, email address, and profile information you provide
          or connect to the Service.
        </li>
        <li>
          <strong>Contact details:</strong> WhatsApp number if provided for agent communication.
        </li>
        <li>
          <strong>Usage data:</strong> pages visited, features used, and interactions with AI agents within the
          dashboard.
        </li>
        <li>
          <strong>Google Workspace data:</strong> data accessed through Google APIs as described below.
        </li>
      </ul>

      <h2>Google User Data</h2>
      <p>
        When you connect your Google account, Clevio AI Staff requests access to the following Google services and
        scopes, strictly for the purposes listed:
      </p>
      <ul>
        <li>
          <strong>Identity (email, profile):</strong> account identification and connection status.
        </li>
        <li>
          <strong>Gmail (send, read):</strong> send and read emails on your instruction.
        </li>
        <li>
          <strong>Google Drive (file):</strong> create and access agent-created files.
        </li>
        <li>
          <strong>Google Calendar (events):</strong> create and manage calendar events.
        </li>
        <li>
          <strong>Google Docs:</strong> create and edit documents.
        </li>
        <li>
          <strong>Google Forms:</strong> create forms and read responses.
        </li>
      </ul>

      <h2>Google API Limited Use Disclosure</h2>
      <p>
        Clevio AI Staff's use and transfer of information received from Google APIs to any other app will adhere to
        the{' '}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>

      <h2>How We Use Data</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Authenticate you and maintain your session.</li>
        <li>Operate AI agents on your behalf within Google Workspace services.</li>
        <li>Improve the reliability and performance of our service.</li>
        <li>Communicate with you about your account or the service.</li>
        <li>Comply with legal obligations.</li>
      </ul>

      <h2>How We Store and Retain Data</h2>
      <p>
        Your data is stored on secure servers. We retain your data for as long as your account is active or as needed
        to provide the service. OAuth tokens are stored encrypted and are only used to fulfill your explicit
        instructions. We do not retain Google Workspace content beyond the time needed to complete each task unless
        you ask the Service to save an output or record for later use.
      </p>

      <h2>Data Deletion</h2>
      <p>
        You may request deletion of your account and associated data at any time by emailing{' '}
        <a href="mailto:aiagronomists@gmail.com">aiagronomists@gmail.com</a>. We will process your request within 30
        days. You may also revoke Google permissions at any time from your{' '}
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
          Google Account settings
        </a>
        .
      </p>

      <h2>We Do Not Sell Your Data</h2>
      <p>
        We do not sell, rent, or trade your personal information or Google user data to third parties for advertising
        or any commercial purpose.
      </p>

      <h2>Sharing &amp; Subprocessors</h2>
      <p>
        We may share your data with trusted subprocessors (e.g., cloud infrastructure providers) solely to operate
        the service. All subprocessors are contractually bound to protect your data and may not use it for any other
        purpose. We do not share Google user data with third parties except as necessary to provide the service you
        requested or as required by law.
      </p>

      <h2>Security</h2>
      <p>
        We implement industry-standard security measures including encryption in transit (TLS) and at rest, access
        controls, and regular security reviews. No method of transmission over the internet is 100% secure; we
        encourage you to use strong, unique credentials.
      </p>

      <h2>Your Rights</h2>
      <p>
        Depending on your jurisdiction, you may have rights to access, correct, or delete your personal data, object
        to or restrict processing, and data portability. To exercise these rights, contact us at{' '}
        <a href="mailto:aiagronomists@gmail.com">aiagronomists@gmail.com</a>.
      </p>

      <h2>Children's Privacy</h2>
      <p>
        Clevio AI Staff is not directed to children under 13. We do not knowingly collect personal information from
        children. If you believe we have collected information from a child, please contact us immediately.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material changes by posting the
        new policy on this page with an updated date. Your continued use of the service after changes constitutes
        acceptance of the revised policy.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy-related questions or requests, contact us at{' '}
        <a href="mailto:aiagronomists@gmail.com">aiagronomists@gmail.com</a>.
      </p>
    </LegalLayout>
  )
}
