'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWebRTC } from '@/context/WebRTCContext';

export default function DoctorPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  
  const {
    localStream,
    remoteStream,
    isCallActive,
    roomId,
    createRoom,
    endCall,
  } = useWebRTC();
  
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callLinkRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);
  
  const handleCreateRoom = async () => {
    try {
      setIsLoading(true);
      setError('');
      await createRoom();
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    if (callLinkRef.current) {
      callLinkRef.current.select();
      document.execCommand('copy');
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Doctor's Consultation Room</h1>
        
        {!isCallActive ? (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Start a New Consultation</h2>
            <p className="text-gray-600 mb-6">
              Create a new consultation room and share the link with your patient.
            </p>
            
            <button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Creating Room...' : 'Create Consultation Room'}
            </button>
            
            {error && (
              <p className="mt-4 text-red-600 text-sm">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Consultation in Progress</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">You</h3>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 bg-gray-200 rounded-md"
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Patient</h3>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 bg-gray-200 rounded-md"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={endCall}
                  className="flex items-center justify-center w-full sm:w-auto bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 3.293a1 1 0 010 1.414L11.414 10l5.293 5.293a1 1 0 01-1.414 1.414L10 11.414l-5.293 5.293a1 1 0 01-1.414-1.414L8.586 10 3.293 4.707a1 1 0 011.414-1.414L10 8.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  End Call
                </button>
                
                <div className="w-full sm:w-auto">
                  <div className="flex rounded-md shadow-sm w-full">
                    <input
                      ref={callLinkRef}
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/patient?room=${roomId}`}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 text-sm rounded-r-md hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {isLinkCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  Share this link with your patient: <br />
                  <span className="font-mono text-blue-600 break-all">
                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/patient?room=${roomId}`}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
