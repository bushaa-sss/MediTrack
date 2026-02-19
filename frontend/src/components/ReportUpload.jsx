// Upload control for reports (camera/file).
import { useEffect, useRef, useState } from 'react';

const ReportUpload = ({ onUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const previewUrlRef = useRef('');

  useEffect(() => {
    // Generate an object URL so the user can preview captured images.
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }

    if (!selectedFile || !selectedFile.type?.startsWith('image/')) {
      setPreviewUrl('');
      return;
    }

    const nextUrl = URL.createObjectURL(selectedFile);
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = '';
      }
    };
  }, [selectedFile]);

  useEffect(() => {
    // Clean up camera stream on unmount.
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
    setIsCameraOpen(false);
  };

  const handleFileChange = (event) => {
    setError('');
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      setError('Only images or PDFs are allowed.');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const triggerFilePicker = () => {
    setError('');
    fileInputRef.current?.click();
  };

  const triggerCameraFallback = () => {
    // Fallback to native camera picker when getUserMedia is not available.
    cameraInputRef.current?.click();
  };

  const startCamera = async () => {
    setError('');
    setIsStartingCamera(true);
    setIsCameraReady(false);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Live camera is not supported in this browser.');
        triggerCameraFallback();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });

      streamRef.current = stream;
      // if (videoRef.current) {
      //   videoRef.current.srcObject = stream;
      //   await videoRef.current.play();
      // }
      if (videoRef.current) {
  videoRef.current.srcObject = stream;
  videoRef.current.onloadedmetadata = () => {
    videoRef.current.play().catch(err => console.log('Video play error', err));
    console.log('Video dimensions', videoRef.current.videoWidth, videoRef.current.videoHeight);
  };
}

      setIsCameraOpen(true);
    } catch (err) {
      setError('Unable to access the camera. Check permissions and try again.');
      triggerCameraFallback();
    } finally {
      setIsStartingCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (!isCameraReady) {
      setError('Camera is still loading. Please wait.');
      return;
    }
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    if (!video.videoWidth || !video.videoHeight) {
      setIsCapturing(false);
      setError('Camera is not ready yet. Please try again.');
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      setIsCapturing(false);
      setError('Unable to capture photo.');
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setIsCapturing(false);
          setError('Unable to capture photo.');
          return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const photoFile = new File([blob], `report-photo-${timestamp}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(photoFile);
        setIsCapturing(false);
        stopCamera();
      },
      'image/jpeg',
      0.9
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!selectedFile) {
      setError('Select or capture a file first.');
      return;
    }

    // Prepare FormData for backend upload.
    const formData = new FormData();
    formData.append('report', selectedFile);

    setIsUploading(true);
    try {
      if (typeof onUpload !== 'function') {
        throw new Error('Upload handler not configured.');
      }
      await onUpload(formData);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } catch (err) {
      const message = err?.response?.data?.message || 'Upload failed. Please try again.';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form className="card stack-form" onSubmit={handleSubmit}>
      <div className="section-title">Upload Report</div>
      {error && <div className="notice">{error}</div>}

      <div className="inline-actions">
        <button type="button" className="secondary" onClick={triggerFilePicker}>
          Choose File
        </button>
        <button
          type="button"
          className="secondary"
          onClick={startCamera}
          disabled={isStartingCamera || isCameraOpen}
        >
          {isStartingCamera ? 'Opening Camera...' : 'Take Photo'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/*
        capture="environment" hints mobile browsers to open the back camera.
        On desktop, the same input falls back to the file picker.
      */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {isCameraOpen && (
        <div className="card" style={{ marginTop: '12px' }}>
          <div className="section-title">Live Camera</div>
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            onLoadedData={() => setIsCameraReady(true)}
            onCanPlay={() => setIsCameraReady(true)}
            style={{
              width: '100%',
              borderRadius: '10px',
              backgroundColor: '#000',
              aspectRatio: '16 / 9',
              objectFit: 'cover'
            }}
          />
          {!isCameraReady && <div className="notice">Camera loading...</div>}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="inline-actions" style={{ marginTop: '12px' }}>
            <button type="button" onClick={capturePhoto} disabled={isCapturing || !isCameraReady}>
              {isCapturing ? 'Capturing...' : 'Capture Photo'}
            </button>
            <button type="button" className="secondary" onClick={stopCamera}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedFile && <div className="badge">Selected: {selectedFile.name}</div>}

      {previewUrl && (
        <div className="form-row">
          <div className="badge">Preview</div>
          <img src={previewUrl} alt="Captured report" style={{ width: '100%', borderRadius: '10px' }} />
        </div>
      )}

      <button type="submit" disabled={!selectedFile || isUploading}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
};

export default ReportUpload;
