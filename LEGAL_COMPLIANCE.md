# Legal & Compliance

This document outlines legal requirements, compliance considerations, and policies for SmartCart.

## License

This project is provided as-is for educational and demonstration purposes.

## Privacy Policy

### Data Collection

SmartCart collects and processes the following user data:

**Authentication Data**:
- Email address
- Display name
- Firebase UID
- Authentication provider (email/password or Google)

**Shopping Data**:
- Shopping session information
- Cart contents
- Purchase history
- Store location selection

**Location Data** (when GPS features are enabled):
- GPS coordinates for store selection
- Geofence validation data
- Location accuracy information

### Data Usage

User data is used for:
- Authentication and account management
- Shopping session management
- Order processing and verification
- Store location services
- Security and fraud prevention

### Data Storage

- **Authentication**: Managed by Firebase Authentication
- **Session Data**: Stored temporarily in backend (in-memory or database)
- **Order History**: Stored in backend database
- **Location Data**: Only collected during session start, not stored permanently

### Data Retention

- Active session data: Retained during shopping session
- Order history: Retained for 90 days (configurable)
- Location logs: Retained for 30 days for security auditing
- User accounts: Retained until user requests deletion

### User Rights

Users have the right to:
- Access their personal data
- Request data deletion
- Opt-out of location services (may limit functionality)
- Export their data
- Withdraw consent

### GDPR Compliance

For European users, SmartCart complies with GDPR requirements:
- Explicit consent for data collection
- Right to be forgotten
- Data portability
- Privacy by design
- Data breach notification

## Terms of Service

### Acceptable Use

Users agree to:
- Use the service only for legitimate shopping purposes
- Not attempt to manipulate prices or bypass security measures
- Not share account credentials
- Comply with store policies and local laws

### Prohibited Activities

The following activities are strictly prohibited:
- Fraudulent transactions
- Unauthorized access to other users' accounts
- Scanning products without intent to purchase
- Bypassing geofence or security measures
- Automated/bot usage

### Age Restrictions

- Users must be 18+ to create an account
- Age verification required for restricted products (alcohol, tobacco)
- Parental consent required for users under 18

## Security & Data Protection

### Security Measures

SmartCart implements:
- End-to-end encryption for sensitive data
- Firebase Authentication with secure token management
- Server-side price validation
- QR code security with unique identifiers
- Rate limiting and DDoS protection
- Regular security audits

### Data Breach Response

In the event of a data breach:
1. Immediate investigation and containment
2. Notification to affected users within 72 hours
3. Notification to relevant authorities as required
4. Remediation and security improvements
5. Post-incident review and documentation

## Payment Processing

### PCI DSS Compliance

When payment gateway is integrated:
- No credit card data stored on SmartCart servers
- All payment processing handled by PCI-compliant providers
- Secure payment tokenization
- Transaction logging for audit purposes

### Refund Policy

- Refunds processed according to store policy
- Refund requests must be made within 24 hours
- Original payment method used for refunds
- Processing time: 5-7 business days

## Age-Restricted Products

### Verification Requirements

For age-restricted products:
- Government-issued ID verification required
- Manual verification by store staff
- Age verification logged for compliance
- Blocked checkout if verification fails

### Compliance

- Compliance with local alcohol and tobacco laws
- Staff training on age verification procedures
- Regular audits of age verification processes

## Accessibility

SmartCart is committed to accessibility:
- WCAG 2.1 Level AA compliance (target)
- Screen reader compatibility
- Keyboard navigation support
- High contrast mode
- Adjustable font sizes

**Note**: Full WCAG compliance requires manual testing with assistive technologies and expert accessibility review.

## Cookie Policy

SmartCart uses cookies for:
- Session management
- Authentication state
- User preferences
- Analytics (with consent)

Users can manage cookie preferences in browser settings.

## Third-Party Services

SmartCart integrates with:
- **Firebase**: Authentication and database (Google Privacy Policy applies)
- **Payment Processors**: Razorpay/Stripe (respective privacy policies apply)
- **Analytics**: Google Analytics (with user consent)
- **Error Tracking**: Sentry (error data only, no PII)

## Compliance Checklist

### Pre-Launch

- [ ] Privacy policy published and accessible
- [ ] Terms of service published and accessible
- [ ] Cookie consent banner implemented
- [ ] Age verification system tested
- [ ] Data retention policies configured
- [ ] GDPR compliance verified (if applicable)
- [ ] Security audit completed
- [ ] Accessibility audit completed

### Ongoing

- [ ] Regular security audits (quarterly)
- [ ] Privacy policy reviews (annually)
- [ ] Compliance training for staff
- [ ] Data breach response plan tested
- [ ] User data requests processed within 30 days
- [ ] Incident logs maintained

## Contact Information

For privacy concerns, data requests, or compliance questions:

**Data Protection Officer**: [Contact Email]  
**Legal Department**: [Contact Email]  
**Security Team**: [Contact Email]

## Updates to This Document

This document is reviewed and updated regularly. Last updated: April 15, 2026

Users will be notified of material changes via email or in-app notification.

## Jurisdiction

This service is governed by the laws of [Your Jurisdiction]. Any disputes will be resolved in the courts of [Your Jurisdiction].

---

**Disclaimer**: This document provides general guidance. Consult with legal counsel to ensure compliance with all applicable laws and regulations in your jurisdiction.
