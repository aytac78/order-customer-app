'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const { verifyOTP } = useAuth();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    setError('');

    const { error: verifyError } = await verifyOTP(phone, code);

    if (verifyError) {
      setError('Kod hatalı. Lütfen tekrar deneyin.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setCountdown(60);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <div className="p-4">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-2">Doğrulama Kodu</h1>
          <p className="text-gray-400 text-center mb-8">
            <span className="text-white font-medium">{phone}</span> numarasına gönderilen 6 haneli kodu girin
          </p>

          <div className="flex justify-center gap-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 bg-[#1a1a1a] border border-white/10 rounded-xl text-center text-xl font-bold focus:outline-none focus:border-orange-500"
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
          {loading && <div className="flex justify-center mb-4"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>}

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-gray-500">Tekrar gönder ({countdown}s)</p>
            ) : (
              <button onClick={handleResend} className="text-orange-500 font-medium">Kodu Tekrar Gönder</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
