import { useState, useEffect } from 'react';
import { useAccessStore } from '../store/accessStore';
import { supabase } from '../supabase';

export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    userEmail: null,
    hasSession: false,
    isUnlocked: false,
    activationInfo: null,
    localStorageContent: {}
  });

  const { isUnlocked } = useAccessStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const updateDebugInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const activationInfo = localStorage.getItem('activationInfo');
        const localStorageContent = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          try {
            localStorageContent[key] = JSON.parse(localStorage.getItem(key));
          } catch {
            localStorageContent[key] = localStorage.getItem(key);
          }
        }

        setDebugInfo({
          userEmail: user?.email || null,
          hasSession: !!user,
          isUnlocked: isUnlocked,
          activationInfo: activationInfo ? JSON.parse(activationInfo) : null,
          localStorageContent: localStorageContent
        });
      } catch (error) {
        console.error('获取调试信息失败:', error);
      }
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);
    return () => clearInterval(interval);
  }, [isVisible, isUnlocked]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
        <span className="font-bold text-sm">🔧 Debug Panel</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Shift+D</span>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-3 text-xs max-h-96 overflow-y-auto">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">User Email:</span>
            <span className={debugInfo.userEmail ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.userEmail || 'Not logged in'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Session:</span>
            <span className={debugInfo.hasSession ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.hasSession ? '✓ Exists' : '✗ Not exists'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Unlocked:</span>
            <span className={debugInfo.isUnlocked ? 'text-green-400' : 'text-yellow-400'}>
              {debugInfo.isUnlocked ? '✓ Yes' : '✗ No'}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-3">
          <div className="text-gray-400 mb-1">Activation Info:</div>
          {debugInfo.activationInfo ? (
            <div className="space-y-1 bg-gray-800 rounded p-2">
              <div>Code: <span className="text-cyan-400">{debugInfo.activationInfo.code}</span></div>
              <div>User: <span className="text-cyan-400">{debugInfo.activationInfo.user}</span></div>
              <div>At: <span className="text-cyan-400">{debugInfo.activationInfo.activatedAt}</span></div>
              <div className="text-gray-500">Source: localStorage</div>
            </div>
          ) : (
            <div className="text-gray-500">No activation info in localStorage</div>
          )}
        </div>

        <div className="border-t border-gray-700 pt-3">
          <div className="text-gray-400 mb-1">LocalStorage:</div>
          <div className="bg-gray-800 rounded p-2 break-all">
            <pre className="text-xs text-gray-300">
              {JSON.stringify(debugInfo.localStorageContent, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
