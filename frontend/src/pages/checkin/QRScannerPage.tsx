import { USE_MOCK } from '../../config/env';
import React, { useState, useEffect, useRef } from 'react';
import { Toast } from '../../components/ui/Toast';
import { CheckCircle2, Camera, AlertCircle, Loader2, QrCode } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { checkinQrApi, CheckinQrResponse } from '../../api/checkinApi';
import { getErrorMessage } from '../../api/errorMessages';
import { mockStore, getCurrentMockUser } from '../../api/mock/mockStore';
import { buildMemberQrCode } from '../../utils/qrCode';

interface ScanResultState {
  status: 'SUCCESS' | 'ERROR';
  msg?: string;
  bookingId?: string;
  roomCode?: string;
  checkInTime?: string;
  student?: {
    studentCode: string;
    studentName: string;
  };
  checkedInCount?: number;
  totalMembers?: number;
}

export const QRScannerPage: React.FC = () => {
  const [manualCode, setManualCode] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [scanResult, setScanResult] = useState<ScanResultState | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanRegionId = 'qr-reader';

  useEffect(() => {
    // Check for cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setHasCamera(true);
        } else {
          setHasCamera(false);
          setCamError('Không tìm thấy camera trên thiết bị này.');
        }
      })
      .catch(() => {
        setHasCamera(false);
        setCamError('Trình duyệt không hỗ trợ hoặc bạn đã từ chối quyền truy cập camera.');
      });
  }, []);

  const startScanner = () => {
    if (!hasCamera) return;
    setIsScanning(true);
    setScanResult(null);
    setCamError(null);

    setTimeout(() => {
      const html5QrCode = new Html5Qrcode(scanRegionId);
      scannerRef.current = html5QrCode;

      html5QrCode
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            html5QrCode.stop().then(() => {
              setIsScanning(false);
              scannerRef.current = null;
              processQRCode(decodedText);
            });
          },
          () => {}
        )
        .catch((err) => {
          setIsScanning(false);
          setCamError('Lỗi khi khởi động camera: ' + err);
        });
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          setIsScanning(false);
          scannerRef.current = null;
        })
        .catch((err) => console.error(err));
    } else {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const processQRCode = async (code: string) => {
    if (!code.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const now = new Date();
      const tzOffset = 7 * 60; // minutes
      const localTime = new Date(now.getTime() + tzOffset * 60 * 1000);
      const scannedAt = localTime.toISOString().replace('Z', '+07:00');

      const res = await checkinQrApi({
        qrData: code.trim(),
        scannedAt,
        deviceLocation: 'Browser Client',
      });

      if (res.success && res.data) {
        setToastType('success');
        setToastMessage(res.message);
        setScanResult({
          status: 'SUCCESS',
          bookingId: res.data.bookingId,
          roomCode: res.data.roomCode,
          checkInTime: res.data.checkInTime || now.toLocaleTimeString(),
          student: res.data.student,
          checkedInCount: res.data.checkedInCount,
          totalMembers: res.data.totalMembers,
          msg: 'Điểm danh thành công',
        });
      } else {
        const errorMsg = getErrorMessage(res);
        setToastType('error');

        if ((res as any).errorCode === 'ERR_OUTSIDE_GRACE_PERIOD') {
          setScanResult({
            status: 'ERROR',
            msg: res.message || 'Chưa đến giờ check-in hoặc đã quá hạn 15 phút so với giờ bắt đầu.',
          });
          setToastMessage(res.message || 'Lượt đặt đã ngoài thời gian cho phép check-in.');
        } else {
          setScanResult({ status: 'ERROR', msg: errorMsg });
          setToastMessage(errorMsg);
        }
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      setToastType('error');
      setToastMessage(msg);
      setScanResult({ status: 'ERROR', msg });
    } finally {
      setIsLoading(false);
      setManualCode('');
    }
  };

  // Giả lập quét mã QR của người dùng đang đăng nhập từ booking CONFIRMED gần nhất
  const handleDevSimulateScan = () => {
    const user = getCurrentMockUser();
    const currentCode = user?.studentCode || '52100888';
    const state = mockStore.getState();

    const confirmedBookings = state.bookings
      .filter(
        (b) =>
          b.status === 'CONFIRMED' &&
          (b.studentCode === currentCode || b.members?.some((m) => m.studentCode === currentCode))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const targetBooking = confirmedBookings[0];
    if (!targetBooking) {
      setToastType('error');
      setToastMessage('Không tìm thấy lượt đặt phòng CONFIRMED nào của bạn để giả lập.');
      return;
    }

    const member = targetBooking.members?.find((m) => m.studentCode === currentCode);
    const code = member?.qrCode || buildMemberQrCode(targetBooking.id, currentCode);
    processQRCode(code);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Điểm Danh Quét Mã QR</h1>
        <p className="text-xs text-slate-500 font-medium">
          Quét mã QR cá nhân tại cửa phòng hoặc nhập mã thủ công để bắt đầu sử dụng phòng.
        </p>
      </div>

      <div className="bg-slate-900 rounded-3xl p-6 text-white text-center shadow-2xl relative overflow-hidden border-4 border-slate-800 min-h-[350px] flex flex-col justify-center items-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-sm font-bold">Đang xử lý điểm danh...</p>
          </div>
        ) : scanResult ? (
          <div className="flex flex-col items-center justify-center space-y-4 max-w-md">
            {scanResult.status === 'ERROR' ? (
              <>
                <AlertCircle className="w-16 h-16 text-rose-500 mb-2" />
                <h3 className="text-lg font-bold text-rose-400">Thất bại</h3>
                <p className="text-sm text-slate-300 px-4">{scanResult.msg}</p>
                <button
                  onClick={() => {
                    setScanResult(null);
                    startScanner();
                  }}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-xs transition-colors"
                >
                  Quét lại
                </button>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-2" />
                <h3 className="text-lg font-bold text-emerald-400">
                  Điểm danh thành công: {scanResult.student?.studentName} ({scanResult.student?.studentCode})
                </h3>
                <p className="text-sm text-slate-300">
                  Phòng: <strong className="text-white">{scanResult.roomCode}</strong>
                </p>
                <p className="text-xs text-slate-400">Thời gian: {scanResult.checkInTime}</p>
                <div className="mt-2 inline-block px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-xs font-bold text-emerald-300">
                  {scanResult.checkedInCount}/{scanResult.totalMembers} đã điểm danh
                </div>

                <button
                  onClick={() => {
                    setScanResult(null);
                    startScanner();
                  }}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-500/20"
                >
                  Quét người tiếp theo
                </button>
              </>
            )}
          </div>
        ) : isScanning ? (
          <div className="w-full flex flex-col items-center">
            <div
              id={scanRegionId}
              className="w-full max-w-[300px] overflow-hidden rounded-xl bg-black border-2 border-slate-700"
            ></div>
            <button
              onClick={stopScanner}
              className="mt-6 px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
            >
              Hủy quét
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-64 h-64 mx-auto rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center bg-slate-950/60 mb-6">
              <QrCode className="w-16 h-16 text-slate-600 mb-4" />
              <span className="text-xs font-semibold text-slate-400 px-8">
                Nhấn nút bên dưới để mở camera
              </span>
            </div>

            {camError && (
              <div className="mb-4 text-xs font-semibold text-rose-400 bg-rose-950/50 px-4 py-2 rounded-lg border border-rose-900">
                {camError}
              </div>
            )}

            <button
              onClick={startScanner}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> Bật Camera Quét Mã
            </button>

            {USE_MOCK && (
              <button
                onClick={handleDevSimulateScan}
                className="mt-4 text-[11px] text-blue-400 hover:text-blue-300 underline"
              >
                Giả lập quét mã QR của tôi từ lượt đặt gần nhất (Dev)
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Dự Phòng: Nhập Mã QR Thủ Công</h3>
        <p className="text-xs text-slate-500">
          Nếu camera không hoạt động, bạn có thể nhập thủ công chuỗi mã QR cá nhân hiển thị dưới mã QR.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="VD: SMART-CAMPUS-BK-8901-52100888"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => processQRCode(manualCode)}
            disabled={!manualCode.trim() || isLoading}
            className="py-2.5 px-5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Điểm danh
          </button>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};
