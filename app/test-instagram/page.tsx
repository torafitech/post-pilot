'use client';

import { useState } from 'react';

export default function TestInstagram() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/instagram/test');
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          🚀 PostPilot - Instagram API Test
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-gray-600 mb-4">
            Click the button below to test your Instagram API connection.
          </p>
          
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Testing...' : 'Test Instagram Connection'}
          </button>
        </div>

        {/* Success Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4">
              ✅ Success!
            </h2>
            
            {result.data.instagramAccountId && (
              <div className="bg-white rounded p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  🎉 Your Instagram Business Account ID:
                </p>
                <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono block">
                  {result.data.instagramAccountId}
                </code>
                <p className="text-xs text-gray-500 mt-2">
                  💾 Save this ID in your .env.local file!
                </p>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                View Full Response
              </summary>
              <pre className="mt-2 bg-gray-100 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">
              ❌ Error
            </h2>
            <pre className="bg-white p-4 rounded overflow-x-auto text-sm text-red-600">
              {error}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
