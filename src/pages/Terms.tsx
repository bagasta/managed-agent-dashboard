import { Link } from 'react-router-dom'
import LegalLayout from '../components/LegalLayout'

export default function Terms() {
  return (
    <LegalLayout title="Terms & Conditions" lastUpdated="June 22, 2026">
      <h2>Acceptance of Terms</h2>
      <p>
        By accessing or using Clevio AI Staff (the "Service"), you agree to be bound by these Terms &amp; Conditions.
        If you do not agree, do not use the Service. These terms apply to all users, including individuals and
        organisations.
      </p>

      <h2>Description of Service</h2>
      <p>
        Clevio AI Staff is an AI-powered dashboard that enables you to manage and deploy AI agents that interact with
        Google Workspace services on your behalf. Features include agent creation, task automation, analytics, and
        integration with Google APIs.
      </p>

      <h2>Accounts &amp; Eligibility</h2>
      <p>
        You must be at least 13 years old to use the Service. By creating an account you represent that all
        information you provide is accurate. You are responsible for maintaining the security of your account
        credentials and for all activity that occurs under your account.
      </p>

      <h2>Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful or fraudulent purpose.</li>
        <li>Violate any applicable law or regulation, including data-protection laws.</li>
        <li>
          Use the Service to send unsolicited communications (spam) or to harass, abuse, or harm others.
        </li>
        <li>Attempt to gain unauthorised access to any part of the Service or its infrastructure.</li>
        <li>Reverse-engineer, decompile, or disassemble any part of the Service.</li>
        <li>Use the Service in a way that violates Google's Terms of Service or API policies.</li>
      </ul>

      <h2>Subscriptions &amp; Token Usage</h2>
      <p>
        Certain features of the Service may require a paid subscription or consume AI tokens. Pricing, billing
        cycles, and token quotas are described in your plan details. All fees are non-refundable unless otherwise
        stated. We reserve the right to change pricing with reasonable notice.
      </p>

      <h2>Third-Party &amp; Google Services</h2>
      <p>
        The Service integrates with Google APIs. Your use of Google services through Clevio AI Staff is also governed
        by Google's Terms of Service and Privacy Policy. Our handling of Google user data is described in our{' '}
        <Link to="/privacy">Privacy Policy</Link>. We are not responsible for the availability or accuracy of
        third-party services.
      </p>

      <h2>Intellectual Property</h2>
      <p>
        All content, branding, software, and technology that make up Clevio AI Staff are owned by or licensed to{' '}
        <strong>[Company legal name]</strong>. You are granted a limited, non-exclusive, non-transferable licence to
        use the Service for its intended purpose. You retain ownership of any content you create or upload.
      </p>

      <h2>Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
        INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
        NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL
        COMPONENTS.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, <strong>[Company legal name]</strong> AND ITS OFFICERS,
        EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
        DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
        DAMAGES. OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE TWELVE
        MONTHS PRECEDING THE CLAIM.
      </p>

      <h2>Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time, with or without cause, with reasonable
        notice where practicable. You may terminate your account at any time by contacting us at{' '}
        <a href="mailto:aiagronomists@gmail.com">aiagronomists@gmail.com</a>. Upon termination, your right to use
        the Service ceases immediately.
      </p>

      <h2>Governing Law</h2>
      <p>
        These Terms are governed by and construed in accordance with the laws of <strong>[jurisdiction]</strong>,
        without regard to conflict-of-law principles. Any disputes shall be resolved exclusively in the courts of{' '}
        <strong>[jurisdiction]</strong>.
      </p>

      <h2>Changes to Terms</h2>
      <p>
        We may update these Terms from time to time. We will notify you of material changes by posting the revised
        Terms on this page with an updated date. Your continued use of the Service after changes take effect
        constitutes your acceptance of the new Terms.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these Terms, contact us at{' '}
        <a href="mailto:aiagronomists@gmail.com">aiagronomists@gmail.com</a>.
      </p>
    </LegalLayout>
  )
}
