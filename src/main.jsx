import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Permanent Cache Buster: Aggressively seek and destroy lingering Rogue Service Workers
// This guarantees the browser instantly drops old corrupted UI caches and loads the pristine dev build!
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
      console.log('Successfully wiped corrupted Service Worker ghost from the DOM cache!');
    }
  }).catch((err) => console.log('Service Worker cleanup skip:', err));
}

// Bulletproof Global Error Boundary Tracker
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("FATAL CRASH:", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#990000', color: 'white', zIndex: 999999, position: 'absolute', top: 0, left: 0, width: '100vw', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>⚠️ FATAL REACT RUNTIME ERROR ⚠️</h1>
          <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Please copy this exact text and paste it to the AI!</h2>
          <div style={{ padding: '15px', background: '#330000', borderRadius: '8px', overflowX: 'auto' }}>
            <h3 style={{ color: '#ffaaaa', marginBottom: '10px' }}>{this.state.error && this.state.error.toString()}</h3>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#ffdddd', fontSize: '13px' }}>
              {this.state.info && this.state.info.componentStack}
            </pre>
          </div>
          <button onClick={() => { 
            localStorage.clear(); 
            indexedDB.deleteDatabase('keyval-store');
            indexedDB.deleteDatabase('void-app-storage');
            setTimeout(() => window.location.reload(), 500);
          }} style={{ marginTop: '20px', padding: '10px 20px', background: 'white', color: 'red', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Nuke Local State & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
