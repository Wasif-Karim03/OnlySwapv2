import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@/context/UserContext";
import api from "@/services/api";
import moment from "moment";

interface Comment {
  _id: string;
  content: string;
  isAnonymous: boolean;
  university: string;
  createdAt: string;
  replies?: Comment[]; // Nested replies
  userId?: {
    _id?: string;
    firstName: string;
    lastName: string;
    university: string;
  };
}

interface PostInfo {
  _id: string;
  userId?: {
    _id?: string;
  };
}

export default function CommentsScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { user, isAuthenticated } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // Comment ID being replied to
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [postInfo, setPostInfo] = useState<PostInfo | null>(null);
  const isPostOwner = postInfo?.userId?._id === user?.id;

  const fetchComments = useCallback(async (showRefreshIndicator = false) => {
    if (!postId) return;

    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Fetch comments
      const commentsResponse = await api.get<{ success: boolean; count: number; data: Comment[] }>(
        `/api/feed/${postId}/comments`
      );

      if (commentsResponse.data.success) {
        setComments(commentsResponse.data.data || []);
      }

      // Fetch post info to check if user is the owner
      try {
        const feedResponse = await api.get<{ success: boolean; data: PostInfo[] }>(
          `/api/feed`
        );
        if (feedResponse.data.success) {
          const post = feedResponse.data.data.find((p: PostInfo) => p._id === postId);
          if (post) {
            setPostInfo(post);
          }
        }
      } catch (err) {
        // If we can't fetch post info, that's okay - continue without it
        console.log("Could not fetch post info for ownership check");
      }
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      Alert.alert("Error", "Failed to load comments. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [postId, user?.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    if (commentText.length > 500) {
      Alert.alert("Error", "Comment cannot exceed 500 characters");
      return;
    }

    if (!isAuthenticated || !user) {
      Alert.alert("Error", "Please log in to comment");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post<{ success: boolean; data: Comment }>(
        `/api/feed/${postId}/comments`,
        {
          content: commentText.trim(),
          isAnonymous: true,
          parentCommentId: replyingTo || undefined, // Include if replying to a comment
        }
      );

      if (response.data.success) {
        setCommentText("");
        setReplyingTo(null); // Clear reply state
        fetchComments();
      }
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    // Focus on input - the placeholder will show "Reply to comment..."
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const formatTimeAgo = (dateString: string) => {
    return moment(dateString).fromNow();
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.commentsList}
        contentContainerStyle={styles.commentsContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchComments(true)} />
        }
      >
        {comments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySubtext}>Be the first to comment!</Text>
          </View>
        ) : (
          comments.map((comment) => (
            <View key={comment._id}>
              <View style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAuthor}>
                    <Ionicons name="person-circle-outline" size={20} color="#6b7280" />
                    <Text style={styles.commentAuthorName}>Anonymous Student</Text>
                    <Text style={styles.commentUniversity}>· {comment.university}</Text>
                  </View>
                  <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
                <Pressable
                  style={styles.replyButton}
                  onPress={() => handleReply(comment._id)}
                >
                  <Ionicons name="arrow-undo-outline" size={16} color="#6b7280" />
                  <Text style={styles.replyButtonText}>Reply</Text>
                </Pressable>
              </View>

              {/* Render replies nested under the comment */}
              {comment.replies && comment.replies.length > 0 && (
                <View style={styles.repliesContainer}>
                  {comment.replies.map((reply) => (
                    <View key={reply._id} style={styles.replyCard}>
                      <View style={styles.commentHeader}>
                        <View style={styles.commentAuthor}>
                          <Ionicons name="person-circle-outline" size={18} color="#6b7280" />
                          <Text style={styles.commentAuthorName}>Anonymous Student</Text>
                          <Text style={styles.commentUniversity}>· {reply.university}</Text>
                        </View>
                        <Text style={styles.commentTime}>{formatTimeAgo(reply.createdAt)}</Text>
                      </View>
                      <Text style={styles.commentContent}>{reply.content}</Text>
                      <Pressable
                        style={styles.replyButton}
                        onPress={() => handleReply(comment._id)}
                      >
                        <Ionicons name="arrow-undo-outline" size={16} color="#6b7280" />
                        <Text style={styles.replyButtonText}>Reply</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        {isPostOwner && !replyingTo && (
          <View style={styles.postOwnerIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
            <Text style={styles.postOwnerText}>You can reply to comments on your post</Text>
          </View>
        )}
        {replyingTo && (
          <View style={styles.replyingIndicator}>
            <Text style={styles.replyingText}>Replying to a comment</Text>
            <Pressable onPress={cancelReply} style={styles.cancelReplyButton}>
              <Ionicons name="close-circle" size={18} color="#6b7280" />
            </Pressable>
          </View>
        )}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={
              replyingTo
                ? "Write a reply..."
                : isPostOwner
                ? "Write a comment or reply..."
                : "Write a comment..."
            }
            placeholderTextColor="#9ca3af"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Pressable
            style={[styles.sendButton, (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled]}
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#ffffff" />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  placeholder: {
    width: 32,
  },
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
  },
  commentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAuthor: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  commentAuthorName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 6,
  },
  commentUniversity: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 4,
  },
  commentTime: {
    fontSize: 11,
    color: "#9ca3af",
  },
  commentContent: {
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 8,
  },
  postOwnerIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    gap: 6,
  },
  postOwnerText: {
    fontSize: 12,
    color: "#15803d",
    fontWeight: "500",
  },
  replyingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eff6ff",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
  },
  cancelReplyButton: {
    padding: 4,
  },
  repliesContainer: {
    marginLeft: 24,
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#e5e7eb",
    paddingLeft: 12,
  },
  replyCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  replyButtonText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 4,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1f2937",
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4caf50",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

