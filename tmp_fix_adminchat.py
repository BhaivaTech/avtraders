import sys

path = '/home/chethan/Documents/bhaivatech project/avtraders/frontend/src/pages/admin/AdminChat.jsx'
with open(path, 'r') as f:
    content = f.read()

replacements = [
    (
        """  async function sendAudioDraft() {
    if (!sel || !audioDraft) return;
    const fd = new FormData();
    fd.append('mobile', sel.mobile);
    fd.append('sender_role', 'admin');
    fd.append('text', '');
    if (replyTo?.id) fd.append('reply_to', replyTo.id);
    fd.append(
      'file',
      new File(
        [audioDraft.blob],
        `voice-${Date.now()}.webm`,
        { type: audioDraft.mime },
      ),
    );
    fd.append(
      'audio_duration',
      Math.max(
        1,
        Math.round(audioDraft.duration || 0),
      ),
    );
    await api.post('/chat/message', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    discardAudioDraft();
    setReplyTo(null);
    await loadThread(sel.id);
    await loadChats();
  }""",
        """  async function sendAudioDraft() {
    if (!sel || !audioDraft || uploading) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('mobile', sel.mobile);
      fd.append('sender_role', 'admin');
      fd.append('text', '');
      if (replyTo?.id) fd.append('reply_to', replyTo.id);
      fd.append(
        'file',
        new File(
          [audioDraft.blob],
          `voice-${Date.now()}.webm`,
          { type: audioDraft.mime },
        ),
      );
      fd.append(
        'audio_duration',
        Math.max(
          1,
          Math.round(audioDraft.duration || 0),
        ),
      );
      await api.post('/chat/message', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      discardAudioDraft();
      setReplyTo(null);
      await loadThread(sel.id);
      await loadChats();
    } catch (err) {
      toast.error('Failed to send voice note');
    } finally {
      setUploading(false);
    }
  }"""
    ),
    (
        """                  <button
                    className="send"
                    onClick={() => {
                      if (mediaFiles.length > 0) {
                        setMediaPreviewOpen(true);
                      } else {
                        sendMessage();
                      }
                    }}
                    disabled={
                      (!text &&
                        !file &&
                        !mediaFiles.length) ||
                      blocked
                    }
                  >""",
        """                  <button
                    className="send"
                    onClick={() => {
                      if (mediaFiles.length > 0) {
                        setMediaPreviewOpen(true);
                      } else {
                        sendMessage();
                      }
                    }}
                    disabled={
                      (!text &&
                        !file &&
                        !mediaFiles.length) ||
                      blocked || uploading
                    }
                  >"""
    ),
    (
        """                  <button
                    className={'mic ' + (recording ? 'rec' : '')}
                    title={recording ? 'Stop' : 'Voice'}
                    disabled={blocked}
                    onClick={async () => {
                      if (!recording) await start();
                      else await stopToDraft();
                    }}
                  >""",
        """                  <button
                    className={'mic ' + (recording ? 'rec' : '')}
                    title={recording ? 'Stop' : 'Voice'}
                    disabled={blocked || uploading}
                    onClick={async () => {
                      if (!recording) await start();
                      else await stopToDraft();
                    }}
                  >"""
    ),
    (
        """                  <button
                    className="send-btn"
                    title="Send"
                    onClick={sendAudioDraft}
                  >""",
        """                  <button
                    className="send-btn"
                    title="Send"
                    onClick={sendAudioDraft}
                    disabled={uploading}
                  >"""
    ),
    (
        """                  <button
                    className="btn primary"
                    onClick={sendMediaBatch}
                  >
                    <Icon.Send /> Send
                  </button>""",
        """                  <button
                    className="btn primary"
                    onClick={sendMediaBatch}
                    disabled={uploading}
                  >
                    <Icon.Send /> Send
                  </button>"""
    ),
]

for old, new in replacements:
    if old not in content:
        print('WARNING: could not find block', old[:60].replace('\n', '\\n'))
        sys.exit(1)
    content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)

print('AdminChat.jsx updated successfully')
