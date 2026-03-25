# AEGIS 🛡️
**Tamper-Proof Certificate Verification Platform**

AEGIS shifts the trust from vulnerable centralized databases to immutable mathematics. Every certificate uploaded is cryptographically hashed (SHA-256) and signed (RSA-PSS) to guarantee authenticity.

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Setup](#quick-setup)
- [Configuration](#configuration)
- [Architecture Highlights](#architecture-highlights)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## 🎯 Overview
AEGIS is a blockchain-inspired certificate verification platform that eliminates the need for centralized trust. Instead of relying on vulnerable databases, AEGIS uses cryptographic principles to ensure every certificate is tamper-proof and verifiable. The platform is designed to be lightweight, serverless, and deployable on modern cloud infrastructure like Vercel.

### Use Cases
- Digital credential verification
- Educational certificate authentication
- Professional certification validation
- Document authenticity verification

## ✨ Features
- **Cryptographic Verification:** SHA-256 hashing and RSA-PSS signing for maximum security
- **QR Code Integration:** HMAC-signed tokens embedded in QR codes to prevent ID enumeration
- **Serverless Architecture:** Fully deployed on Next.js with Vercel support
- **Audit Logging:** Tracks suspicious behavior like multiple failed verification attempts
- **No Python Dependency:** Pure Node.js implementation using native crypto module
- **RLS Policies:** Row-level security on Supabase for data protection

## 📦 Prerequisites

Before installing AEGIS, ensure you have the following:

### System Requirements
- **Node.js:** v16.0.0 or higher
- **npm:** v7.0.0 or higher
- **Git:** For version control

### External Services
You'll need accounts and API keys from:
- **Supabase:** For database management (PostgreSQL-based)
- **Cloudinary:** For certificate image hosting

### Development Tools (Optional but Recommended)
- Visual Studio Code or preferred code editor
- Postman or Insomnia for API testing

## 🚀 Quick Setup

Follow these steps to get AEGIS running locally:

### 1. Clone the Repository
```bash
git clone https://github.com/Shashivanth009/Aegis.git
cd Aegis
```

### 2. Install Dependencies
```bash
pm install
```

### 3. Generate RSA Keys
Generate your private/public key pair for cryptographic signing:
```bash
node scripts/generate-keys.js
```

This creates:
- `private.pem` - Private key for signing certificates
- `public.pem` - Public key for verification

⚠️ **Important:** Keep your private key secure and never commit it to version control!

### 4. Configure Environment Variables
Copy the environment template and fill in your credentials:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# RSA Keys
RSA_PRIVATE_KEY=contents_of_private.pem
RSA_PUBLIC_KEY=contents_of_public.pem

# Signing Secret
HMAC_SECRET=your_random_secret_key
```

### 5. Set Up the Database
Run the SQL schema to create tables and enable RLS:
```bash
# Copy the contents of database/schema.sql
# Go to your Supabase dashboard → SQL Editor
# Create a new query and paste the contents
# Execute the query
```

This creates:
- `certificates` table - Stores certificate data and signatures
- `audit_logs` table - Tracks verification attempts and security events

### 6. Run the Development Server
```bash
npm run dev
```

The application will start at `http://localhost:3000`

## ⚙️ Configuration

### Database Schema
The application uses two main tables:

**certificates table:**
- `id` - Unique certificate identifier (UUID)
- `certificate_hash` - SHA-256 hash of the certificate
- `signature` - RSA-PSS signature
- `issued_by` - Issuer name
- `issued_to` - Certificate holder name
- `issue_date` - Date of issuance
- `expiry_date` - Expiration date
- `document_url` - Cloudinary URL of the certificate image
- `created_at` - Creation timestamp

**audit_logs table:**
- `id` - Log entry ID
- `certificate_id` - Reference to certificate
- `ip_address` - IP of verification attempt
- `status` - Success/failure status
- `timestamp` - When the verification occurred
- `user_agent` - Browser/client information

### Environment Variables Reference

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for server operations | Supabase Dashboard → Settings |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary account name | Cloudinary Dashboard |
| `RSA_PRIVATE_KEY` | Private key for signing | Generated via `generate-keys.js` |
| `HMAC_SECRET` | Secret for token signing | Create a strong random string |

## 🏗️ Architecture Highlights

- **No Python Backend Needed:** Hashing and RSA natively handled via Node.js `crypto` module
- **Serverless Ready:** Designed entirely for Next.js App Router API Routes. Deploys to Vercel for free
- **Antigravity Intelligence:** Evaluates verification requests, logging suspicious behavior (like >10 failed verifications from the same IP) in `audit_logs`
- **HMAC Tokens:** To prevent ID enumeration and exposure, QR codes embed HMAC signed verification tokens, not the raw UUID of the certificate
- **Stateless Verification:** Each certificate can be verified independently without server state

## 🔌 API Endpoints

### Upload Certificate
```
POST /api/certificates/upload
Content-Type: multipart/form-data

Body:
{
  file: <image_file>,
  issuedBy: "University Name",
  issuedTo: "Student Name",
  issueDate: "2024-01-15",
  expiryDate: "2026-01-15"
}

Response:
{
  id: "uuid",
  hash: "sha256_hash",
  signature: "rsa_signature",
  qrCode: "qr_code_url"
}
```

### Verify Certificate
```
POST /api/certificates/verify
Content-Type: application/json

Body:
{
  token: "hmac_signed_token",
  hash: "certificate_hash"
}

Response:
{
  valid: true,
  certificateData: {...}
}
```

### Get Certificate Details
```
GET /api/certificates/:id
Response:
{
  id: "uuid",
  issuedBy: "...",
  issuedTo: "...",
  documentUrl: "...",
  signature: "..."
}
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Go to [Vercel.com](https://vercel.com) and sign in
3. Click "New Project" and select your Aegis repository
4. Add your environment variables in the Vercel dashboard
5. Click "Deploy"

Your application will be live at `https://your-project.vercel.app`

### Deploy to Other Platforms
AEGIS works with any Node.js hosting:
- Netlify Functions
- AWS Lambda with Next.js adapter
- Google Cloud Run
- DigitalOcean App Platform

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Run Integration Tests
```bash
npm run test:integration
```

### Manual Testing with cURL

**Upload a certificate:**
```bash
curl -X POST http://localhost:3000/api/certificates/upload \
  -F "file=@certificate.pdf" \
  -F "issuedBy=MIT" \
  -F "issuedTo=John Doe" \
  -F "issueDate=2024-01-15" \
  -F "expiryDate=2026-01-15"
```

**Verify a certificate:**
```bash
curl -X POST http://localhost:3000/api/certificates/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your_hmac_token",
    "hash": "certificate_hash"
  }'
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Issue: "Cannot find module 'crypto'"
**Solution:** Ensure you're using Node.js v16+. Check your version:
```bash
node --version
```

#### Issue: "Supabase connection failed"
**Solution:** 
- Verify your `NEXT_PUBLIC_SUPABASE_URL` and keys are correct
- Check if your Supabase project is active
- Ensure your IP is not blocked by Supabase firewall

#### Issue: "ENOENT: no such file or directory 'private.pem'"
**Solution:** Run the key generation script again:
```bash
node scripts/generate-keys.js
```

#### Issue: "Failed to upload certificate - 413 Payload Too Large"
**Solution:** 
- Reduce the image file size
- Increase the body size limit in your Next.js config:
```javascript
// next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}
```

#### Issue: "Cloudinary upload failed"
**Solution:**
- Verify your Cloudinary API credentials
- Check your upload preset in Cloudinary dashboard
- Ensure your account is active and hasn't exceeded upload limits

#### Issue: "RLS policy violation"
**Solution:**
- Check that your `SUPABASE_SERVICE_ROLE_KEY` has admin privileges
- Verify RLS policies are correctly configured in Supabase
- Run `database/schema.sql` again to reset policies

### Debug Mode
Enable detailed logging by setting:
```bash
DEBUG=aegis:* npm run dev
```

### Get Help
- Check existing [GitHub Issues](https://github.com/Shashivanth009/Aegis/issues)
- Review Supabase documentation: https://supabase.com/docs
- Check Cloudinary API docs: https://cloudinary.com/documentation

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Prerequisites for Contributors
- Fork the repository
- Create a new branch for your feature: `git checkout -b feature/my-feature`
- Follow the existing code style and conventions

### Development Workflow
1. Make your changes
2. Run tests: `npm test`
3. Commit with clear messages: `git commit -m "Add: detailed description"`
4. Push to your fork: `git push origin feature/my-feature`
5. Open a Pull Request with a description of changes

### Code Standards
- Use ESLint: `npm run lint`
- Format code with Prettier: `npm run format`
- Write tests for new features
- Update documentation as needed

### Commit Message Format
```
[Type]: Description

Types: Add, Fix, Improve, Refactor, Docs, Test
Examples:
- Add: Certificate verification API endpoint
- Fix: RSA signature validation error
- Improve: Error handling in upload process
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

### Getting Help
- **Documentation:** Check the [Wiki](https://github.com/Shashivanth009/Aegis/wiki)
- **Issues:** Open a [GitHub Issue](https://github.com/Shashivanth009/Aegis/issues) for bugs
- **Discussions:** Use [GitHub Discussions](https://github.com/Shashivanth009/Aegis/discussions) for questions
- **Email:** [Add your contact email]

### Report Security Issues
Found a security vulnerability? Please email security@aegis.dev instead of using the issue tracker.

---

**Made with ❤️ by the Aegis Team**

Last Updated: 2026-03-25 14:53:54