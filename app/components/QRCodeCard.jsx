'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Smartphone, Camera, Check, Copy, ExternalLink, Image as ImageIcon, Sparkles } from 'lucide-react';
import { APP_CONFIG } from '../data/planets';

export default function QRCodeCard({ onOpenAROnPhone, onSelectTargetImage }) {
  const [qrUrl, setQrUrl] = useState(APP_CONFIG.deployedUrl + '/?ar=1#ar');
  const [qrSvg, setQrSvg] = useState('');
  const [copied, setCopied] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Detect if client is running on a mobile browser
    if (typeof window !== 'undefined') {
      const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) || window.innerWidth <= 768;
      setIsMobileDevice(isMobile);

      // Point QR code to current live HTTPS origin if on Vercel, else default production URL
      if (window.location.protocol === 'https:' && window.location.origin) {
        setQrUrl(`${window.location.origin}/?ar=1#ar`);
      } else {
        setQrUrl(`${APP_CONFIG.deployedUrl}/?ar=1#ar`);
      }
    }
  }, []);

  useEffect(() => {
    if (!qrUrl) return;
    QRCode.toString(qrUrl, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#070a13',
        light: '#ffffff'
      }
    })
      .then(svg => setQrSvg(svg))
      .catch(err => console.error('QR Code render error:', err));
  }, [qrUrl]);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file && onSelectTargetImage) {
      onSelectTargetImage(file);
    }
  };

  return (
    <section id="phone-qr-section" style={{
      maxWidth: '1000px',
      margin: '0 auto 80px',
      padding: '0 1.5rem'
    }}>
      <div className="glass-panel" style={{
        padding: 'clamp(1.5rem, 4vw, 2.75rem)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 20px 50px -20px rgba(56, 189, 248, 0.2)'
      }}>
        {/* On Mobile Device Banner (Solves the "cannot scan code shown on same phone" requirement) */}
        {isMobileDevice && (
          <div style={{
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '14px',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8' }}>
              <Smartphone size={20} />
              <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>
                Browsing on your phone right now?
              </strong>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', maxWidth: '600px', margin: 0 }}>
              You don’t need to scan a QR code on this screen. Tap the button below to launch the live AR Camera directly on this device!
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={onOpenAROnPhone}
                className="btn-primary"
                style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
              >
                <Camera size={18} />
                <span>Open AR on this phone</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
                style={{ padding: '0.75rem 1.25rem', fontSize: '0.875rem' }}
              >
                <ImageIcon size={16} />
                <span>Select Target Image</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                capture="environment"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Desktop / Cross-Device Scanning View */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2.5rem',
          alignItems: 'center'
        }}>
          {/* Left Column: Clear Step-by-Step Instructions */}
          <div>
            <div className="badge" style={{ marginBottom: '1rem' }}>
              <Sparkles size={12} />
              <span>Mobile WebAR Scanner</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: '1rem',
              color: '#f8fafc'
            }}>
              Instant Phone Launch via QR Code
            </h2>

            <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Experience the solar system floating in your living room or classroom. Scan with any modern iPhone or Android smartphone:
            </p>

            {/* 3 Explicit Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  flexShrink: 0
                }}>
                  1
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.2rem' }}>
                    Scan QR Code
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    Open your phone’s camera app and point it at the code. Tap the link banner to open the secure HTTPS page.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(129, 140, 248, 0.15)',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  flexShrink: 0
                }}>
                  2
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.2rem' }}>
                    Allow Camera Permission
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    When your browser requests access, tap <strong>Allow</strong>. Camera video streams locally in memory and is never recorded.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  flexShrink: 0
                }}>
                  3
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.2rem' }}>
                    View &amp; Interact in AR
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    Point your device at your room, desk, or target image. The Sun and planets appear floating in real 3D space with touch orbit controls.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct HTTPS Link Display */}
            <div style={{
              marginTop: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              padding: '0.5rem 0.75rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <span style={{ fontSize: '0.775rem', color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {qrUrl}
              </span>
              <button
                onClick={handleCopy}
                className="btn-outline"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.25rem' }}
                title="Copy Direct Phone URL"
              >
                {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#94a3b8', padding: '4px', display: 'flex', alignItems: 'center' }}
                title="Open directly in new tab"
              >
                <ExternalLink size={15} />
              </a>
            </div>
          </div>

          {/* Right Column: High-Contrast Large QR Code Display */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <div className="qr-display-box" style={{
              maxWidth: '280px',
              width: '100%',
              aspectRatio: '1',
              padding: '1.25rem'
            }}>
              {qrSvg ? (
                <div
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Rendering QR Code...</div>
              )}
            </div>

            <span style={{
              marginTop: '0.875rem',
              fontSize: '0.775rem',
              color: '#94a3b8',
              letterSpacing: '0.02em'
            }}>
              Tested for iOS Safari &amp; Android Chrome
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
