// Landing page temporarily disabled - will fix icons after core features
export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">SubWise</h1>
        <p className="text-muted-foreground">Smart subscription tracking for everyone</p>
        <a href="/dashboard" className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
          Go to Dashboard →
        </a>
      </div>
    </div>
  );
}