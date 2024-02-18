import { useContext, useEffect, useRef, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { SockectContext } from '@/contexts/SockectContext';

import { socketAtom } from '@/states/socketAtom';
import { userAtom } from '@/states/userAtom';

type OnlineUserProps = {
  data: {
    username: string;
    nickname: string;
    uuid: string;
  };
  onCall: (username: string) => void;
};
const OnlineUserItem: React.FC<OnlineUserProps> = ({ data, onCall }) => {
  const user = useAtomValue(userAtom);
  const { nickname } = data;
  return (
    <li className="py-1">
      <div className="flex items-center">
        <div className="mr-2 size-2 rounded-full bg-green-600" />
        {nickname}
        {user?.nickname !== nickname && (
          <button
            type="button"
            className="ml-4 rounded-lg bg-green-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-600"
            onClick={() => onCall(data.uuid)}>
            通話
          </button>
        )}
      </div>
    </li>
  );
};

const ChatSideMenu = () => {
  const { onlineUsers } = useContext(SockectContext);
  const [socket, setSocket] = useAtom(socketAtom);

  const [isCall, setIsCall] = useState<boolean>(false);

  const [pc, setPc] = useState<RTCPeerConnection>();
  const [pc2, setPc2] = useState<RTCPeerConnection>();

  const localStream = useRef(new MediaStream());
  const remoteStream = useRef(new MediaStream());

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setPc(new RTCPeerConnection());
    setPc2(new RTCPeerConnection());

    // 開啟本地媒體流
    openMedia();
  }, []);

  useEffect(() => {
    // 監聽收電話
    listenPhone();
  }, [socket, localStream, pc2]);

  /** 開啟本地媒體流 */
  async function openMedia() {
    try {
      // 獲取本地媒體流
      const constraints = { video: true, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 更新 localStream 和 remoteStream
      localStream.current = stream;
      remoteStream.current = new MediaStream();
      console.log(localStream.current, remoteStream.current);
    } catch (error) {
      console.log(error);
      window.alert('請確認已開啟視訊及麥克風');
    }
  }

  /** 當撥打電話 */
  const handleCall = async (uuid: string) => {
    // 如果 socket 或 localStream 未定義，則返回
    if (!socket || !localStream || !pc) return;

    setIsCall(true);

    // ICE 候選者
    collectIceCandidates(pc, uuid);

    // 將 localStream 中的媒體加入至 pc 中
    localStream.current
      .getTracks()
      .forEach((track) => pc.addTrack(track, localStream.current));

    // 從事件中取得 streams
    // 檢查是否已經存在 remoteStream，如果存在，將媒體軌道添加到其中
    pc.ontrack = (event) => {
      console.log(event.streams);
      event.streams[0].getTracks().forEach((track) => {
        if (remoteStream.current) {
          remoteStream.current.addTrack(track);
        }
      });

      // 將 remoteVideoRef 的 srcObject 設定為 remoteStream
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream.current;
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', offer, uuid);

    // 監聽 Answer 事件
    socket!.on(
      'answer',
      async (answer: RTCSessionDescriptionInit, senderSocketId: string) => {
        console.log('收到 answer');

        const remoteDescription = new RTCSessionDescription(answer);
        await pc.setRemoteDescription(remoteDescription);

        // setRemoteStream(localStream);
      },
    );
  };

  /** ICE 候選者 */
  async function collectIceCandidates(pc: RTCPeerConnection, uuid: string) {
    // 如果 socket 或 localStream 未定義，則返回
    if (!socket || !localStream || !pc) return;

    try {
      // 當收集到一個本地 ICE 候選者時，將觸發這個事件
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', event.candidate.toJSON(), uuid);
        }
      };

      // 收集到一個本地 ICE 候選者時錯誤則觸發
      pc.onicecandidateerror = (error) => {
        console.log('error', error);
      };

      // 監聽 ICE Candidate 事件
      socket!.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
        console.log('收到 ICE candidate');

        if (candidate) {
          try {
            // 對於每個新增的遠程 ICE 候選者，將其轉換為 RTCIceCandidate
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error(error);
          }
        }
      });
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }

  /** 監聽收電話 */
  const listenPhone = () => {
    // 如果 socket 或 localStream 未定義，則返回
    if (!socket || !localStream || !pc2) return;

    // 監聽 Offer 事件
    socket.on(
      'offer',
      async (offer: RTCSessionDescriptionInit, senderSocketId: string) => {
        console.log('收到 offer');

        // ICE 候選者
        collectIceCandidates(pc2, senderSocketId);

        setIsCall(true);

        localStream.current
          .getTracks()
          .forEach((track) => pc2.addTrack(track, localStream.current));

        pc2.ontrack = (event) => {
          console.log(event.streams);
          event.streams[0].getTracks().forEach((track) => {
            remoteStream.current.addTrack(track);
          });

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream.current;
          }
        };

        const remoteDescription = new RTCSessionDescription(offer);
        await pc2.setRemoteDescription(remoteDescription);

        const answer = await pc2.createAnswer();
        await pc2.setLocalDescription(answer);

        socket.emit('answer', answer, senderSocketId);
      },
    );
  };

  return (
    <nav className="w-64 border-r-2 p-4">
      <div className="text-sm font-bold text-gray-500">在線成員</div>
      <ul className="my-2">
        {onlineUsers.map((user, index) => (
          <OnlineUserItem key={index} data={user} onCall={handleCall} />
        ))}
      </ul>

      <div className="mb-4">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="h-48 w-64"></video>
      </div>
      {isCall && (
        <div className="mb-4">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-48 w-64"></video>
        </div>
      )}
    </nav>
  );
};

export default ChatSideMenu;
