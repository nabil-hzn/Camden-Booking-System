import { useEffect, useRef } from 'react';
import { GOOGLE_CLIENT_ID } from '../config';
import LucideIcon from './LucideIcon';

interface LoginProps {
  onCredential: (idToken: string) => void;
}

export default function Login({ onCredential }: LoginProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tryInit = () => {
      if (!window.google || !buttonRef.current) return false;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 280,
        text: 'signin_with',
        shape: 'pill',
      });
      return true;
    };

    if (tryInit()) return;
    const interval = setInterval(() => {
      if (tryInit()) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [onCredential]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4" id="login-screen">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-100/60 p-8 w-full max-w-sm flex flex-col items-center text-center">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#0f172b] to-[#0a1023] flex items-center justify-center text-white shadow-md shadow-[#0f172b]/10 mb-4">
          <LucideIcon name="Calendar" size={22} className="text-white stroke-[2.5px]" />
        </div>
        <h1 className="font-serif italic text-2xl tracking-wide leading-none mb-1">
          <span className="font-extrabold text-black">CM</span><span className="font-bold text-slate-400">Scheduler</span>
        </h1>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          Sign in with your Google account to book facilities.
        </p>
        <div ref={buttonRef} id="google-signin-button" />
      </div>
    </div>
  );
}
