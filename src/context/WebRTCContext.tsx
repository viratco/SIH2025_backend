'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

type WebRTCContextType = {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallActive: boolean;
  roomId: string;
  createRoom: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  endCall: () => void;
  isCallInitiator: boolean;
};

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export const WebRTCProvider = ({ children }: { children: ReactNode }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [isCallInitiator, setIsCallInitiator] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = ({ roomId }: { roomId: string }) => {
      console.log('Room created:', roomId);
      setRoomId(roomId);
      setIsCallInitiator(true);
      setIsCallActive(true);
      
      // Create peer connection immediately after room creation
      if (!peerConnection.current) {
        createPeerConnection();
      }
    };

    const handleUserJoined = ({ userId }: { userId: string }) => {
      console.log('User joined:', userId);
      // Only create offer if we're the call initiator
      if (isCallInitiator) {
        createOffer();
      }
    };

    const handleExistingParticipants = ({ participants }: { participants: string[] }) => {
      console.log('Existing participants:', participants);
      if (participants.length > 0) {
        // If there are existing participants, create an offer
        createOffer();
      }
    };

    const handleSignal = async ({ signal, from }: { signal: any; from: string }) => {
      console.log('Received signal:', signal);
      try {
        if (signal.type === 'offer') {
          await handleOffer(signal, from);
        } else if (signal.type === 'answer') {
          await handleAnswer(signal);
        } else if (signal.type === 'candidate') {
          await handleNewICECandidate(signal.candidate);
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    };

    socket.on('room-created', handleRoomCreated);
    socket.on('user-joined', handleUserJoined);
    socket.on('existing-participants', handleExistingParticipants);
    socket.on('signal', handleSignal);

    return () => {
      socket.off('room-created', handleRoomCreated);
      socket.off('user-joined', handleUserJoined);
      socket.off('existing-participants', handleExistingParticipants);
      socket.off('signal', handleSignal);
    };
  }, [socket, isCallInitiator]);

  // Initialize local media stream
  const initializeLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      });
      setLocalStream(stream);
      console.log('Local stream initialized:', stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Camera and microphone access denied. Please allow permissions and try again.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No camera or microphone found. Please check your devices.');
        } else {
          throw new Error('Failed to access camera and microphone. Please check your devices and permissions.');
        }
      } else {
        throw new Error('Failed to access camera and microphone. Please check your devices and permissions.');
      }
    }
  };

  // Create a new RTCPeerConnection
  const createPeerConnection = () => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnection.current = pc;

    // Add local stream to peer connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Set up remote stream
    const remoteStream = new MediaStream();
    setRemoteStream(remoteStream);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('signal', {
          to: roomId,
          from: socket.id,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    return pc;
  };

  // Create an offer
  const createOffer = async () => {
    if (!socket) return;

    try {
      const pc = peerConnection.current || createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('signal', {
        to: roomId,
        from: socket.id,
        signal: { type: 'offer', sdp: pc.localDescription },
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Handle incoming offer
  const handleOffer = async (offer: RTCSessionDescriptionInit, from: string) => {
    if (!socket) return;

    try {
      const pc = peerConnection.current || createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('signal', {
        to: from,
        from: socket.id,
        signal: { type: 'answer', sdp: pc.localDescription },
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  // Handle incoming answer
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) return;
    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  // Handle new ICE candidate
  const handleNewICECandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnection.current) return;
    try {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  // Create a new room
  const createRoom = async () => {
    try {
      await initializeLocalStream();
      if (socket) {
        socket.emit('create-room');
        // Set call as active immediately since we're creating the room
        setIsCallActive(true);
        setIsCallInitiator(true);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  };

  // Join an existing room
  const joinRoom = async (roomId: string) => {
    try {
      await initializeLocalStream();
      if (socket) {
        socket.emit('join-room', { roomId });
        setRoomId(roomId);
        setIsCallActive(true);
        setIsCallInitiator(false);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  };

  // End the current call
  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    
    setIsCallActive(false);
    setRoomId('');
    setIsCallInitiator(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      endCall();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <WebRTCContext.Provider
      value={{
        localStream,
        remoteStream,
        isCallActive,
        roomId,
        createRoom,
        joinRoom,
        endCall,
        isCallInitiator,
      }}
    >
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (context === undefined) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};
