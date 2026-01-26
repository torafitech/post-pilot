// app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm text-slate-600 mb-4">
          This Privacy Policy explains how Starling Post collects, uses, and protects
          information when you use our services.
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">Information We Collect</h2>
        <p className="text-sm text-slate-600 mb-2">
          We collect account information you provide (such as your email address) and
          data from connected social accounts (such as post metadata and performance
          metrics). We do not store your social media passwords.
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">How We Use Data</h2>
        <p className="text-sm text-slate-600 mb-2">
          We use your data to let you schedule posts, sync analytics, improve the
          product, and provide support. We do not sell your personal data.
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">Data Sharing</h2>
        <p className="text-sm text-slate-600 mb-2">
          We share data only with service providers we use to operate Starling Post
          (such as hosting, analytics, and error tracking), subject to appropriate
          safeguards.
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">Your Rights</h2>
        <p className="text-sm text-slate-600 mb-2">
          You can request access to, correction of, or deletion of your account and
          associated data by contacting support@starlingpost.com.
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">Contact</h2>
        <p className="text-sm text-slate-600">
          If you have questions about this Privacy Policy, contact us at
          support@starlingpost.com.
        </p>
      </div>
    </main>
  );
}
