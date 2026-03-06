import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Hash, X, QrCode } from 'lucide-react';
import jsQR from 'jsqr';

const TableSelectionModal = ({ isOpen, onSelectTable }) => {
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
      setError('Não foi possível acessar a câmera. Use a entrada manual.');
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
        let tableNumber = parseInt(code.data);
        
        // If it's a URL, try to extract the 'mesa' parameter
        if (isNaN(tableNumber)) {
          try {
            const url = new URL(code.data);
            tableNumber = parseInt(url.searchParams.get('mesa'));
          } catch (e) {
            // Not a valid URL or missing parameter
          }
        }

        if (!isNaN(tableNumber) && tableNumber > 0) {
          stopScanning();
          onSelectTable(tableNumber);
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const tableNumber = parseInt(manualInput);
    if (!isNaN(tableNumber) && tableNumber > 0 && tableNumber <= 50) {
      onSelectTable(tableNumber);
      setManualInput('');
    } else {
      setError('Por favor, insira um número de mesa válido (1-50)');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanning();
    }
    return () => {
      stopScanning();
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing if no table is selected (handled by parent)
      if (!open) stopScanning();
    }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <QrCode className="w-6 h-6 text-amber-600" />
            Identificar Mesa
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="qr" className="w-full mt-4" onValueChange={(val) => {
          if (val !== 'qr') stopScanning();
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr" className="gap-2">
              <Camera className="w-4 h-4" />
              Escanear QR
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Hash className="w-4 h-4" />
              Digitar Número
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="mt-6">
            <div className="space-y-4">
              {!scanning ? (
                <Button onClick={startScanning} className="w-full h-32 text-lg gap-3 flex flex-col" variant="outline">
                  <Camera className="w-8 h-8 text-amber-600" />
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
                      Parar
                    </Button>
                  </div>
                  <p className="text-sm text-stone-600 text-center">
                    Aponte a câmera para o QR code da sua mesa
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-6">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="tableNumber" className="text-sm font-medium text-stone-700">
                  Número da Mesa (1-50)
                </label>
                <Input
                  id="tableNumber"
                  type="number"
                  placeholder="Ex: 5"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="text-lg h-12 text-center"
                  min="1"
                  max="50"
                />
              </div>
              <Button type="submit" className="w-full h-12 text-lg">
                Confirmar Mesa
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {error && (
          <p className="text-sm text-red-600 mt-4 bg-red-50 p-3 rounded-lg border border-red-200 text-center">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TableSelectionModal;