/**
 * MINIMAL TEST PAGE - NO CLERK, NO COMPLEX COMPONENTS
 * DELETE AFTER DEBUGGING
 */

export default function MinimalPage() {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f9f9f9',
      color: '#333'
    }}>
      <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
        ✅ MINIMAL PAGE WORKS!
      </h1>
      
      <p style={{ fontSize: '18px', marginBottom: '30px' }}>
        This page has NO Clerk, NO complex components, NO dependencies.
      </p>
      
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2>Next.js is Working ✅</h2>
        <p>Date: {new Date().toLocaleDateString()}</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
        
        <div style={{ marginTop: '30px' }}>
          <a 
            href="/test" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              margin: '0 10px'
            }}
          >
            🔍 Diagnostic Page
          </a>
          
          <a 
            href="/" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#dc2626',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              margin: '0 10px'
            }}
          >
            🏠 Home (Broken?)
          </a>
        </div>
      </div>
      
      <div style={{ marginTop: '40px', fontSize: '14px', color: '#666' }}>
        If this page works but the home page doesn&apos;t, the issue is in the layout or Clerk setup.
      </div>
    </div>
  );
}
