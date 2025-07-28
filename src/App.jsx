import { useState, useEffect } from 'react';
import { Log } from '../logger_middleware/logger';
import './App.css';

function App() {
  const [urlInputs, setUrlInputs] = useState([{ longUrl: '', customCode: '', validity: 30 }]);
  const [urls, setUrls] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Log('frontend', 'info', 'url-shortener', 'Application started');
    return () => {
      Log('frontend', 'info', 'url-shortener', 'Application closed');
    };
  }, []);

  const addUrlInput = () => {
    if (urlInputs.length < 5) {
      setUrlInputs([...urlInputs, { longUrl: '', customCode: '', validity: 30 }]);
    }
  };

  const handleInputChange = (index, field, value) => {
    const newInputs = [...urlInputs];
    newInputs[index][field] = value;
    setUrlInputs(newInputs);
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    for (const input of urlInputs) {
      if (!validateUrl(input.longUrl)) {
        Log('frontend', 'error', 'url-shortener', `Invalid URL format: ${input.longUrl}`);
        setError(`Invalid URL format: ${input.longUrl}`);
        return;
      }
      if (input.validity < 1) {
        Log('frontend', 'error', 'url-shortener', 'Invalid validity period');
        setError('Validity period must be at least 1 minute');
        return;
      }
    }

    // Process valid URLs
    const newUrls = urlInputs.map(input => {
      const shortcode = input.customCode || Math.random().toString(36).substr(2, 6);
      Log('frontend', 'info', 'url-shortener', `URL shortened: ${input.longUrl} to ${shortcode}`);
      return {
        longUrl: input.longUrl,
        shortcode,
        created: new Date(),
        expiry: new Date(Date.now() + input.validity * 60000),
        clicks: 0,
        clickDetails: []
      };
    });

    setUrls([...urls, ...newUrls]);
    setUrlInputs([{ longUrl: '', customCode: '', validity: 30 }]);
  };

  const handleRedirect = (shortcode) => {
    const urlIndex = urls.findIndex(u => u.shortcode === shortcode);
    if (urlIndex !== -1) {
      const url = urls[urlIndex];
      const now = new Date();
      if (now < url.expiry) {
        Log('frontend', 'info', 'url-shortener', `URL accessed: ${shortcode}`);
        const updatedUrls = [...urls];
        updatedUrls[urlIndex] = {
          ...url,
          clicks: url.clicks + 1,
          clickDetails: [...url.clickDetails, now]
        };
        setUrls(updatedUrls);
        window.open(url.longUrl, '_blank');
      } else {
        Log('frontend', 'warn', 'url-shortener', `Expired URL accessed: ${shortcode}`);
        setError('This URL has expired');
      }
    }
  };

  return (
    <>
      <header className="header">
        <h1>URL Shortener</h1>
      </header>

      <div className="container">
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            {urlInputs.map((input, index) => (
              <div key={index} className="input-group">
                <input
                  type="url"
                  value={input.longUrl}
                  onChange={(e) => handleInputChange(index, 'longUrl', e.target.value)}
                  placeholder="Enter long URL"
                  required
                />
                <input
                  type="text"
                  value={input.customCode}
                  onChange={(e) => handleInputChange(index, 'customCode', e.target.value)}
                  placeholder="Custom shortcode (optional)"
                />
                <input
                  type="number"
                  value={input.validity}
                  onChange={(e) => handleInputChange(index, 'validity', parseInt(e.target.value))}
                  placeholder="Validity (minutes)"
                  min="1"
                />
              </div>
            ))}
            
            {error && <div className="error">{error}</div>}

            <div className="button-group">
              <button type="submit">Shorten URLs</button>
              {urlInputs.length < 5 && (
                <button type="button" onClick={addUrlInput}>
                  Add Another URL
                </button>
              )}
            </div>
          </form>
        </div>

        <h2>Statistics</h2>
        <div className="urls-list">
          {urls.map((url) => (
            <div key={url.shortcode} className="url-item">
              <p>Long URL: {url.longUrl}</p>
              <p>
                Short URL: 
                <a href="#" onClick={() => handleRedirect(url.shortcode)}>
                  http://localhost:3000/{url.shortcode}
                </a>
              </p>
              <p>Created: {url.created.toLocaleString()}</p>
              <p>Expires: {url.expiry.toLocaleString()}</p>
              <p>Total Clicks: {url.clicks}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="footer">
        <p>© 2025 URL Shortener. All rights reserved.</p>
      </footer>
    </>
  );
}

export default App;
