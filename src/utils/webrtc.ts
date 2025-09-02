import { io, Socket } from 'socket.io-client';

type PeerConnection = {
  pc: RTCPeerConnection;
  socket: Socket;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  init: (isCaller: boolean, roomId: string, onRemoteStream: (stream: MediaStream) => void) => Promise<void>;
  createOffer: () => Promise<void>;
  createAnswer: () => Promise<void>;
  addAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => void;
  close: () => void;
};

export const createPeerConnection = (): PeerConnection => {
  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const pc = new RTCPeerConnection(configuration);
  const socket = io('http://localhost:5000');
  let localStream: MediaStream | null = null;
  let remoteStream: MediaStream | null = null;
  let currentRoomId: string | null = null;

  // Set up event listeners for ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('signal', {
        to: currentRoomId,
        from: socket.id,
        signal: { type: 'candidate', candidate: event.candidate },
      });
    }
  };

  // Set up event listener for remote stream
  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      remoteStream = event.streams[0];
      if (onRemoteStreamCallback) {
        onRemoteStreamCallback(remoteStream);
      }
    }
  };

  let onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;

  const init = async (isCaller: boolean, roomId: string, onRemoteStream: (stream: MediaStream) => void) => {
    currentRoomId = roomId;
    onRemoteStreamCallback = onRemoteStream;
    
    // Get local media stream
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Add local stream to peer connection
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream!);
      });

      // Set up socket event listeners
      socket.on('signal', async ({ signal, from }) => {
        if (signal.type === 'offer' && !isCaller) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          await createAnswer();
        } else if (signal.type === 'answer' && isCaller) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.type === 'candidate') {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        }
      });

      // Join the room
      socket.emit(isCaller ? 'create-room' : 'join-room', { roomId });

      // If we're the caller, create an offer
      if (isCaller) {
        await createOffer();
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
      throw err;
    }
  };

  const createOffer = async () => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('signal', {
        to: currentRoomId,
        from: socket.id,
        signal: { type: 'offer', sdp: pc.localDescription },
      });
    } catch (err) {
      console.error('Error creating offer:', err);
      throw err;
    }
  };

  const createAnswer = async () => {
    try {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('signal', {
        to: currentRoomId,
        from: socket.id,
        signal: { type: 'answer', sdp: pc.localDescription },
      });
    } catch (err) {
      console.error('Error creating answer:', err);
      throw err;
    }
  };

  const addAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error('Error adding answer:', err);
      throw err;
    }
  };

  const addIceCandidate = (candidate: RTCIceCandidateInit) => {
    pc.addIceCandidate(new RTCIceCandidate(candidate));
  };

  const close = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (pc) {
      pc.close();
    }
    if (socket) {
      socket.disconnect();
    }
  };

  return {
    pc,
    socket,
    localStream,
    remoteStream,
    init,
    createOffer,
    createAnswer,
    addAnswer,
    addIceCandidate,
    close,
  };
};
