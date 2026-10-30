import React, { useEffect, useRef, useState } from 'react';
import './ChatCamera.css';

const MAX_BYTES = 20 * 1024 * 1024;

export default function ChatCamera({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const activeRef = useRef(true);
  const closeRef = useRef(null);
  const [mode, setMode] = useState('photo');
  const [facing, setFacing] = useState('environment');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [capture, setCapture] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    activeRef.current = true;
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    return () => {
      activeRef.current = false;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    if (capture) return;
    let cancelled = false;
    let stream;
    setReady(false);
    setError('');
    async function openCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is unavailable. Open this site using HTTPS in a supported browser.');
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: mode === 'video',
        });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch (err) {
        if (cancelled) return;
        stream?.getTracks().forEach(track => track.stop());
        setError(err.name === 'NotAllowedError'
          ? `Allow camera${mode === 'video' ? ' and microphone' : ''} access in your browser, then try again.`
          : err.name === 'NotFoundError'
          ? 'No camera or microphone was found on this device.'
          : err.message || 'Could not open the camera. Please try again.');
      }
    }
    openCamera();
    return () => {
      cancelled = true;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null;
        recorder.stop();
      }
      stream?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };
  }, [mode, facing, capture, retry]);

  useEffect(() => {
    if (!capture) return;
    return () => URL.revokeObjectURL(capture.url);
  }, [capture]);

  useEffect(() => {
    if (!recording) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(elapsed);
      if (elapsed >= 60 && recorderRef.current?.state === 'recording') recorderRef.current.stop();
    }, 250);
    return () => clearInterval(timer);
  }, [recording]);

  function review(blob, extension) {
    if (!activeRef.current) return;
    if (!blob.size || blob.size > MAX_BYTES) {
      setError('Capture must be under 20 MB. Please try a shorter video.');
      return;
    }
    const file = new File([blob], `camera-${Date.now()}.${extension}`, { type: blob.type });
    setCapture({ file, url: URL.createObjectURL(file) });
  }

  function takePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth || busy) return;
    setBusy(true);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!activeRef.current) return;
      setBusy(false);
      if (blob) review(blob, 'jpg');
      else setError('Could not capture the photo. Please try again.');
    }, 'image/jpeg', 0.9);
  }

  function recordVideo() {
    if (recording) {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      return;
    }
    try {
      if (typeof MediaRecorder === 'undefined') throw new Error('Video recording is unavailable in this browser. You can still take a photo.');
      const mimeType = ['video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm']
        .find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(streamRef.current, {
        ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 1500000,
      });
      recorderRef.current = recorder;
      const chunks = [];
      let bytes = 0;
      recorder.ondataavailable = event => {
        if (!event.data.size) return;
        chunks.push(event.data);
        bytes += event.data.size;
        if (bytes >= 19 * 1024 * 1024 && recorder.state === 'recording') recorder.stop();
      };
      recorder.onerror = () => {
        recorder.onstop = null;
        if (recorder.state !== 'inactive') recorder.stop();
        if (activeRef.current) {
          setRecording(false);
          setError('Video recording failed. Please try again.');
        }
      };
      recorder.onstop = () => {
        if (!activeRef.current) return;
        setRecording(false);
        const type = recorder.mimeType.split(';')[0];
        review(new Blob(chunks, { type }), type === 'video/mp4' ? 'mp4' : 'webm');
      };
      recorder.start(500);
      setSeconds(0);
      setRecording(true);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not start video recording.');
    }
  }

  return (
    <div className="chat-camera-backdrop" onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
      if (event.key === 'Tab') {
        const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), video[controls]')];
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      <section className="chat-camera" role="dialog" aria-modal="true" aria-labelledby="chat-camera-title">
        <header>
          <h2 id="chat-camera-title">{capture ? 'Review capture' : 'Camera'}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close camera">Close</button>
        </header>
        <div className="chat-camera-preview">
          {capture ? capture.file.type.startsWith('video/')
            ? <video src={capture.url} controls playsInline />
            : <img src={capture.url} alt="Captured photo" />
            : <video ref={videoRef} autoPlay muted playsInline onLoadedData={() => setReady(true)} />}
          {!capture && !ready && !error && <p className="chat-camera-status" role="status">Opening camera…</p>}
          {recording && <p className="chat-camera-timer" role="status">Recording · {seconds}s / 60s</p>}
        </div>
        {error && <p className="chat-camera-error" role="alert">{error}</p>}
        <footer>
          {capture ? <>
            <button type="button" onClick={() => { setCapture(null); setError(''); }}>Retake</button>
            <button type="button" className="camera-primary" onClick={() => { onCapture([capture.file]); onClose(); }}>Use {capture.file.type.startsWith('video/') ? 'video' : 'photo'}</button>
          </> : <>
            <div className="chat-camera-modes" role="group" aria-label="Capture mode">
              <button type="button" aria-pressed={mode === 'photo'} disabled={recording || busy} onClick={() => setMode('photo')}>Photo</button>
              <button type="button" aria-pressed={mode === 'video'} disabled={recording || busy} onClick={() => setMode('video')}>Video</button>
            </div>
            <div className="chat-camera-actions">
              <button type="button" disabled={recording || busy} onClick={() => setFacing(value => value === 'environment' ? 'user' : 'environment')}>Switch camera</button>
              <button type="button" className="camera-primary" disabled={!ready || busy}
                onClick={mode === 'photo' ? takePhoto : recordVideo}>
                {mode === 'photo' ? 'Take photo' : recording ? 'Stop recording' : 'Record video'}
              </button>
              {error && <button type="button" onClick={() => setRetry(value => value + 1)} disabled={recording || busy}>Try again</button>}
            </div>
          </>}
        </footer>
      </section>
    </div>
  );
}
