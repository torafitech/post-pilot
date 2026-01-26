// app/terms/page.tsx
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
        <p className="text-sm text-slate-600 mb-4">
          These Terms govern your use of Starling Post. By using the app, you agree
          to these Terms.
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">Use of Service</h2>
        <p className="text-sm text-slate-600 mb-2">
          You are responsible for activity on your account and for complying with
          the terms of each social platform you connect.
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">Acceptable Use</h2>
        <p className="text-sm text-slate-600 mb-2">
          You agree not to use Starling Post to send spam, abuse, or violate any
          applicable law or platform policy.
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">No Warranty</h2>
        <p className="text-sm text-slate-600 mb-2">
          Starling Post is provided “as is” without warranties of any kind. We do not
          guarantee uptime or that third‑party APIs will remain available.
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">Limitation of Liability</h2>
        <p className="text-sm text-slate-600 mb-2">
          To the extent permitted by law, our liability is limited to the amount you
          paid for the service in the last 3 months.
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">Changes</h2>
        <p className="text-sm text-slate-600">
          We may update these Terms from time to time. If changes are material, we
          will notify you within the app or by email.
        </p>
      </div>
    </main>
  );
}
