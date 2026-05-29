import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useToast } from './Toast';
import { getSocket, waitForSocket } from '../socket';
import { isLoggedIn, getCurrentUserId } from '../auth';

// 로그인 직후/페이지 이동 시 소켓 확보하고 전역 알림(like:received, match:made)을
// 토스트로 띄움. 매칭 모달 등 페이지별 상세 처리는 각 페이지에서 같은 이벤트를 또 듣게 함.
export default function NotifyProvider({ children }) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoggedIn()) return;

    // 로그인된 상태에서는 페이지가 어디든 항상 소켓 연결을 유지
    // (이렇게 해야 채팅 페이지 마운트 전에 도착한 메시지가 글로벌 버퍼에 들어감)
    waitForSocket().catch(() => {});

    const socket = getSocket();
    if (!socket) return;

    const onLikeReceived = ({ from }) => {
      const name = from?.nickname || '누군가';
      showToast({
        kind: 'like',
        title: `${name}님이 좋아요를 보냈어요!`,
        message: '당신도 좋아요를 누르면 매칭이 성사돼요.',
        duration: 5000,
      });
    };

    const onMatchMade = ({ partner }) => {
      const name = partner?.nickname || '상대';
      showToast({
        kind: 'match',
        title: `매칭 성공: ${name}`,
        message: '채팅방으로 이동하려면 알림을 클릭하세요.',
        duration: 6000,
        onClick: () => {
          if (!partner?.id) return;
          sessionStorage.setItem(
            'currentMatch',
            JSON.stringify({
              id: partner.id,
              userId: partner.id,
              name: partner.nickname,
              tag: 'KR1',
              img: partner.profile_image,
            })
          );
          navigate('/chat');
        },
      });
    };

    // 채팅 페이지 밖에 있을 때 새 메시지 알림
    const onChatNotify = (row) => {
      // 채팅 페이지에서 그 사람과 대화 중이면 알림 생략 (그쪽 useEffect가 처리)
      const me = getCurrentUserId();
      if (Number(row.receiver_id) !== Number(me)) return;

      const onChatPage = location.pathname === '/chat';
      const currentMatch = (() => {
        try {
          return JSON.parse(sessionStorage.getItem('currentMatch'));
        } catch {
          return null;
        }
      })();
      const chattingWithSender =
        onChatPage &&
        currentMatch &&
        Number(currentMatch.userId || currentMatch.id) ===
          Number(row.sender_id);

      if (chattingWithSender) return;

      showToast({
        kind: 'like',
        title: '새 메시지',
        message: row.message?.slice(0, 60) || '...',
        duration: 4000,
        onClick: () => {
          sessionStorage.setItem(
            'currentMatch',
            JSON.stringify({
              id: row.sender_id,
              userId: row.sender_id,
            })
          );
          navigate('/chat');
        },
      });
    };

    socket.on('like:received', onLikeReceived);
    socket.on('match:made', onMatchMade);
    socket.on('chat:notify', onChatNotify);

    return () => {
      socket.off('like:received', onLikeReceived);
      socket.off('match:made', onMatchMade);
      socket.off('chat:notify', onChatNotify);
    };
    // location이 바뀌면 isLoggedIn() 다시 확인하기 위해 의존성에 포함
  }, [showToast, navigate, location.pathname]);

  return children;
}
