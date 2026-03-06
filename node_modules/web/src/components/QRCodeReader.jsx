import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, X, Hash } from 'lucide-react';

const QRCodeReader = ({ onTableDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const animationFrameRef = useRef(null);

  const startScanning = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        scanQRCode();
      }
    } catch (err) {
      setError('Não foi possível acessar a câmera. Use a entrada manual abaixo.');
      console.error('Camera error:', err);
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        const tableNumber = parseInt(code.data);
        if (!isNaN(tableNumber)) {
          onTableDetected(tableNumber);
          stopScanning();
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const tableNumber = parseInt(manualInput);
    if (!isNaN(tableNumber) && tableNumber > 0) {
      onTableDetected(tableNumber);
      setManualInput('');
    } else {
      setError('Por favor, insira um número de mesa válido');
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
        <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
          <Camera className="w-6 h-6 text-amber-600" />
          Escanear QR Code da Mesa
        </h3>

        {!scanning ? (
          <Button onClick={startScanning} className="w-full gap-2" size="lg">
            <Camera className="w-5 h-5" />
            Abrir Câmera
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              <Button
                onClick={stopScanning}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 gap-2"
              >
                <X className="w-4 h-4" />
                Fechar
              </Button>
            </div>
            <p className="text-sm text-stone-600 text-center">
              Aponte a câmera para o QR code da sua mesa
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 mt-4 bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
        <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
          <Hash className="w-6 h-6 text-amber-600" />
          Ou Digite o Número da Mesa
        </h3>
        <form onSubmit={handleManualSubmit} className="flex gap-3">
          <Input
            type="number"
            placeholder="Ex: 5"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="flex-1 text-lg"
            min="1"
          />
          <Button type="submit" size="lg">
            Confirmar
          </Button>
        </form>
      </div>
    </div>
  );
};

export default QRCodeReader;