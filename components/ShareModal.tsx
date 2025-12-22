'use client';

import { useState } from 'react';
import { X, Instagram, Facebook, Twitter, Link2, MapPin, Copy, Check, Share2 } from 'lucide-react';

interface ShareModalProps {
  venue: {
    name: string;
    district?: string;
    instagram?: string;
  };
  onClose: () => void;
}

export default function ShareModal({ venue, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `📍 ${venue.name}'dayım! ${venue.district ? `#${venue.district.replace(/\s/g, '')}` : ''} #ORDER`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleInstagramShare = () => {
    const instagramUrl = `instagram://story-camera`;
    window.open(instagramUrl, '_blank');
    setTimeout(() => {
      window.open('https://instagram.com', '_blank');
    }, 1000);
  };

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Kopyalama başarısız');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: venue.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Paylaşım iptal edildi');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center">
      <div className="w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold">Buradayım!</h2>
              <p className="text-sm text-gray-400">{venue.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#242424] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4">
          <div className="bg-[#242424] rounded-xl p-4 mb-4">
            <p className="text-sm">{shareText}</p>
            {venue.instagram && (
              <p className="text-orange-500 text-sm mt-1">@{venue.instagram}</p>
            )}
          </div>

          {/* Share Options */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <button
              onClick={handleInstagramShare}
              className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-colors"
            >
              <Instagram className="w-6 h-6 text-pink-500" />
              <span className="text-xs">Instagram</span>
            </button>

            <button
              onClick={handleFacebookShare}
              className="flex flex-col items-center gap-2 p-3 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition-colors"
            >
              <Facebook className="w-6 h-6 text-blue-500" />
              <span className="text-xs">Facebook</span>
            </button>

            <button
              onClick={handleTwitterShare}
              className="flex flex-col items-center gap-2 p-3 bg-gray-500/20 rounded-xl hover:bg-gray-500/30 transition-colors"
            >
              <Twitter className="w-6 h-6 text-gray-400" />
              <span className="text-xs">X</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-2 p-3 bg-green-500/20 rounded-xl hover:bg-green-500/30 transition-colors"
            >
              {copied ? (
                <Check className="w-6 h-6 text-green-500" />
              ) : (
                <Copy className="w-6 h-6 text-green-500" />
              )}
              <span className="text-xs">{copied ? 'Kopyalandı' : 'Kopyala'}</span>
            </button>
          </div>

          {/* Native Share (Mobile) */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Diğer Uygulamalar
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-0">
          <p className="text-xs text-gray-500 text-center">
            Paylaşımlarınız ORDER hesabınızla ilişkilendirilmez
          </p>
        </div>
      </div>
    </div>
  );
}
