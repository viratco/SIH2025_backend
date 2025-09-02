'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWebRTC } from '@/context/WebRTCContext';

export default function PatientPage() {
  const searchParams = useSearchParams();
  const [roomId, setRoomId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const {
    localStream,
    remoteStream,
    isCallActive,
    joinRoom,
    endCall,
  } = useWebRTC();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const router = useRouter();
  const roomIdFromUrl = searchParams.get('room');

  useEffect(() => {
    if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl);
    }
  }, [roomIdFromUrl]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await joinRoom(roomId);
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room. Please check the room ID and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Patient Portal</h1>
        
        {!isCallActive ? (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Join Consultation</h2>
            <p className="text-gray-600 mb-6">
              Enter the room ID provided by your doctor to join the consultation.
            </p>
            
            <div className="mb-4">
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
                Room ID
              </label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              onClick={handleJoinRoom}
              disabled={isLoading || !roomId.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Joining...' : 'Join Consultation'}
            </button>
            
            {error && (
              <p className="mt-4 text-red-600 text-sm">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-4">Consultation in Progress</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div className="bg-black rounded-lg overflow-hidden">
                  <h3 className="text-sm md:text-base font-medium mb-2 text-white bg-gray-800 p-2">You</h3>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-48 md:h-64 object-cover"
                  />
                </div>
                
                <div className="bg-black rounded-lg overflow-hidden">
                  <h3 className="text-sm md:text-base font-medium mb-2 text-white bg-gray-800 p-2">Doctor</h3>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-48 md:h-64 object-cover bg-gray-900"
                  />
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={endCall}
                  className="flex items-center justify-center bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 3.293a1 1 0 010 1.414L11.414 10l5.293 5.293a1 1 0 01-1.414 1.414L10 11.414l-5.293 5.293a1 1 0 01-1.414-1.414L8.586 10 3.293 4.707a1 1 0 011.414-1.414L10 8.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  End Call
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
