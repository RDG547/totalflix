'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getComments,
  addComment,
  likeComment,
  dislikeComment,
  deleteComment,
  Comment,
} from '@/lib/comments';
import { updateAchievementProgress, initializeAchievements } from '@/lib/achievements';
import { ThumbsUp, ThumbsDown, Reply, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface CommentsSectionProps {
  contentId: number;
  contentType: 'movie' | 'tv';
}

export function CommentsSection({ contentId, contentType }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [contentId, contentType]);

  async function loadComments() {
    try {
      const allComments = await getComments(contentId, contentType);
      setComments(allComments);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitComment() {
    if (!user) {
      toast.error('Você precisa estar logado para comentar');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Digite um comentário antes de enviar');
      return;
    }

    setSubmitting(true);
    try {
      await addComment(
        contentId,
        contentType,
        user.uid,
        user.displayName || 'Usuário',
        newComment,
        user.photoURL || undefined
      );
      setNewComment('');
      await loadComments();
      toast.success('Comentário adicionado!');

      // Atualizar conquistas de comentários
      await initializeAchievements(user.uid);
      await updateAchievementProgress(user.uid, 'comment');
    } catch (error: any) {
      console.error('Erro detalhado ao adicionar comentário:', error);

      // Mensagens de erro mais específicas
      if (error.code === 'permission-denied') {
        toast.error('Permissão negada. Verifique as regras do Firestore.');
      } else if (error.code === 'failed-precondition') {
        toast.error('Índice do Firestore não criado. Verifique o console do navegador para o link.');
      } else if (error.message) {
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.error('Erro ao adicionar comentário. Verifique o console.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitReply(parentId: string) {
    if (!user) {
      toast.error('Você precisa estar logado para responder');
      return;
    }

    if (!replyText.trim()) {
      toast.error('Digite uma resposta antes de enviar');
      return;
    }

    setSubmitting(true);
    try {
      await addComment(
        contentId,
        contentType,
        user.uid,
        user.displayName || 'Usuário',
        replyText,
        user.photoURL || undefined,
        parentId
      );
      setReplyText('');
      setReplyingTo(null);
      await loadComments();
      toast.success('Resposta adicionada!');
    } catch (error: any) {
      console.error('Erro detalhado ao adicionar resposta:', error);

      if (error.code === 'permission-denied') {
        toast.error('Permissão negada. Verifique as regras do Firestore.');
      } else if (error.code === 'failed-precondition') {
        toast.error('Índice do Firestore não criado. Verifique o console do navegador para o link.');
      } else if (error.message) {
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.error('Erro ao adicionar resposta. Verifique o console.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(commentId: string) {
    if (!user) {
      toast.error('Faça login para curtir comentários');
      return;
    }

    try {
      await likeComment(
        commentId,
        user.uid,
        user.displayName || 'Usuário',
        user.photoURL || undefined
      );
      await loadComments();
    } catch (error) {
      console.error('Erro ao curtir:', error);
      toast.error('Erro ao curtir comentário');
    }
  }

  async function handleDislike(commentId: string) {
    if (!user) {
      toast.error('Faça login para dar dislike');
      return;
    }

    try {
      await dislikeComment(commentId, user.uid);
      await loadComments();
    } catch (error) {
      console.error('Erro ao dar dislike:', error);
      toast.error('Erro ao dar dislike');
    }
  }

  async function handleDelete(commentId: string) {
    if (!user) return;

    if (confirm('Tem certeza que deseja excluir este comentário?')) {
      try {
        await deleteComment(commentId, user.uid);
        await loadComments();
        toast.success('Comentário excluído');
      } catch (error: any) {
        console.error('Erro ao excluir:', error);
        toast.error(error.message || 'Erro ao excluir comentário');
      }
    }
  }

  // Separar comentários principais e respostas
  const mainComments = comments.filter(c => !c.parentId);
  const getReplies = (commentId: string) =>
    comments.filter(c => c.parentId === commentId);

  function CommentItem({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) {
    const isAuthor = user?.uid === comment.userId;
    const hasLiked = user ? comment.likes.includes(user.uid) : false;
    const hasDisliked = user ? comment.dislikes.includes(user.uid) : false;

    return (
      <div className={`${isReply ? 'ml-12' : ''} mb-4`}>
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {comment.userPhoto ? (
              <img
                src={comment.userPhoto}
                alt={comment.userName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {comment.userName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex-1">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">{comment.userName}</span>
                {isAuthor && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Excluir comentário"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-gray-300 text-sm">{comment.text}</p>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-4 mt-2 text-sm">
              {/* Like */}
              <button
                onClick={() => handleLike(comment.id)}
                className={`flex items-center gap-1 transition-colors ${
                  hasLiked ? 'text-purple-400' : 'text-gray-400 hover:text-purple-400'
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{comment.likes.length}</span>
              </button>

              {/* Dislike */}
              <button
                onClick={() => handleDislike(comment.id)}
                className={`flex items-center gap-1 transition-colors ${
                  hasDisliked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                }`}
              >
                <ThumbsDown className="h-4 w-4" />
                <span>{comment.dislikes.length}</span>
              </button>

              {/* Responder (apenas em comentários principais) */}
              {!isReply && user && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="flex items-center gap-1 text-gray-400 hover:text-purple-400 transition-colors"
                >
                  <Reply className="h-4 w-4" />
                  <span>Responder</span>
                </button>
              )}

              {/* Tempo */}
              <span className="text-gray-500 ml-auto">
                {new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Input de resposta */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escreva sua resposta..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitReply(comment.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyText.trim() || submitting}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                  className="text-gray-400 hover:text-white px-3"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Comentários</h2>
        <div className="text-gray-400">Carregando comentários...</div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">
        Comentários ({mainComments.length})
      </h2>

      {/* Input novo comentário */}
      {user ? (
        <div className="mb-6">
          <div className="flex gap-3">
            {/* Avatar do usuário */}
            <div className="flex-shrink-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuário'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {(user.displayName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-400">Faça login para comentar</p>
        </div>
      )}

      {/* Lista de comentários */}
      <div className="space-y-4">
        {mainComments.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Seja o primeiro a comentar!
          </p>
        ) : (
          mainComments.map(comment => (
            <div key={comment.id}>
              <CommentItem comment={comment} />
              {/* Respostas */}
              {getReplies(comment.id).map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
