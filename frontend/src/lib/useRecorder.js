// src/lib/useRecorder.js
import { useEffect, useRef, useState } from 'react';

export function useRecorder(){
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const startTs = useRef(0);
  const tickRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds

  function clearTick(){
    if (tickRef.current){ clearInterval(tickRef.current); tickRef.current = null; }
  }

  async function start(){
    if (recording) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Microphone not supported on this browser');
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
    const mr = new MediaRecorder(stream, { mimeType: mime });
    mediaRef.current = mr;
    chunksRef.current = [];
    startTs.current = Date.now();
    setElapsed(0);

    mr.ondataavailable = (e)=>{ if (e.data.size) chunksRef.current.push(e.data); };
    mr.onstop = ()=> stream.getTracks().forEach(t=>t.stop());
    mr.start(250);

    clearTick();
    tickRef.current = setInterval(()=>{
      const secs = Math.max(0, Math.round((Date.now() - startTs.current)/1000));
      setElapsed(secs);
    }, 250);

    setRecording(true);
  }

  async function stop(){
    return new Promise((resolve)=>{
      const mr = mediaRef.current;
      if (!mr) return resolve(null);
      mr.onstop = ()=> {
        clearTick();
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const secs = Math.max(1, Math.round((Date.now() - startTs.current)/1000));
        setRecording(false);
        resolve({ blob, mime: mr.mimeType, duration: secs });
      };
      mr.stop();
    });
  }

  useEffect(()=>()=>{ try{
    mediaRef.current?.stream?.getTracks().forEach(t=>t.stop());
    clearTick();
  }catch{} },[]);

  return { start, stop, recording, elapsed };
}
