'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
} from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function NotificationsDropdown() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();

      // Atualizar a cada 30 segundos
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  async function loadNotifications() {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getUserNotifications(user.uid);
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUnreadCount() {
    if (!user) return;

    try {
      const count = await getUnreadCount(user.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error('Erro ao carregar contagem:', error);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markAsRead(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }

  async function handleMarkAllAsRead() {
    if (!user) return;

    try {
      await markAllAsRead(user.uid);
      await loadNotifications();
      await loadUnreadCount();
      toast.success('Todas marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar como lidas');
    }
  }

  async function handleDelete(notificationId: string) {
    try {
      await deleteNotification(notificationId);
      await loadNotifications();
      await loadUnreadCount();
      toast.success('Notificação excluída');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir notificação');
    }
  }

  function handleNotificationClick(notification: Notification) {
    // Marcar como lida
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navegar para o conteúdo
    if (notification.contentId && notification.contentType) {
      router.push(`/details/${notification.contentType}/${notification.contentId}`);
      setIsOpen(false);
    }
  }

  function getNotificationIcon(type: Notification['type']) {
    switch (type) {
      case 'comment_reply':
        return '💬';
      case 'comment_like':
        return '👍';
      case 'favorite_activity':
        return '⭐';
      default:
        return '🔔';
    }
  }

  function formatTime(timestamp: number) {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `há ${minutes}m`;
    if (hours < 24) return `há ${hours}h`;
    return `há ${days}d`;
  }

  if (!user) return null;

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 rounded-full hover:bg-gray-800 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu de notificações */}
          <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-[600px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-white">Notificações</h3>
              {notifications.length > 0 && unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Lista de notificações */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-400">
                  Carregando...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                      !notification.read ? 'bg-gray-800/50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Avatar ou ícone */}
                      <div className="flex-shrink-0">
                        {notification.fromUserPhoto ? (
                          <img
                            src={notification.fromUserPhoto}
                            alt={notification.fromUserName || ''}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="text-left w-full"
                        >
                          <p className="text-sm font-semibold text-white mb-1">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </button>
                      </div>

                      {/* Ações */}
                      <div className="flex-shrink-0 flex items-start gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-purple-400 hover:text-purple-300 p-1"
                            title="Marcar como lida"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-gray-400 hover:text-red-400 p-1"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
