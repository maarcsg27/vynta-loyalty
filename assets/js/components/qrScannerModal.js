/**
 * VYNTA LOYALTY ? QR Scanner Camera Engine & Modal
 */

export class CameraQRScanner {
  constructor(readerElementId, onScanSuccess, onScanError) {
    this.readerElementId = readerElementId;
    this.onScanSuccess = onScanSuccess;
    this.onScanError = onScanError;
    this.html5QrCode = null;
    this.isScanning = false;
  }

  async start() {
    if (typeof Html5Qrcode === 'undefined') {
      throw new Error('Librer\u00EDa de escaneo de QR no disponible.');
    }

    try {
      this.html5QrCode = new Html5Qrcode(this.readerElementId);
      this.isScanning = true;

      const config = {
        fps: 15,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      };

      await this.html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (this.isScanning) {
            this.onScanSuccess(decodedText);
          }
        },
        (errorMessage) => {
          if (this.onScanError) this.onScanError(errorMessage);
        }
      );
    } catch (err) {
      this.isScanning = false;
      throw err;
    }
  }

  async stop() {
    if (this.html5QrCode && this.isScanning) {
      this.isScanning = false;
      try {
        await this.html5QrCode.stop();
        this.html5QrCode.clear();
      } catch (e) {
        console.warn('Error stopping QR scanner:', e);
      }
    }
  }
}