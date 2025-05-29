import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment, getPosts, type CommentDTO } from "./api/blog.api";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Notification from "./components/notification";

interface Comment {
  id: number;
  content: string;
  fromUser: string;
  toUser: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  comments: Comment[];
}

function App() {
  const queryClient = useQueryClient();
  const [newComments, setNewComments] = useState<{ [key: number]: string }>({});
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
  };

  useEffect(() => {
    const socket = new SockJS("http://localhost:8082/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        stompClient.subscribe("/topic/notifications", (message) => {
          showNotification(message.body);

          // ✅ Thêm dòng này để tab hiện tại gọi lại API posts
          queryClient.invalidateQueries({ queryKey: ["posts"] });
        });
      },
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate().catch((err) => {
        console.error("Lỗi khi deactivate STOMP client:", err);
      });
    };
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  const posts: Post[] = data?.data || [];
  console.log("Data: " + posts);

  const mutation = useMutation({
    mutationFn: (comment: CommentDTO) => createComment(comment),
    onSuccess: () => {
      setNotification("💬 Comment sent successfully!");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleCommentChange = (postId: number, value: string) => {
    setNewComments((prev) => ({ ...prev, [postId]: value }));
  };

  const handleCommentSubmit = (
    e: React.FormEvent,
    postId: number,
    toUser: string
  ) => {
    e.preventDefault();
    const content = newComments[postId]?.trim();
    if (!content) return;

    const comment: CommentDTO = {
      postId,
      content,
      fromUser: "userA", // hardcoded for demo
      toUser,
    };

    mutation.mutate(comment);
    setNewComments((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-600">My Blog</h1>
        <nav className="space-x-6">
          <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">
            Home
          </a>
          <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">
            Posts
          </a>
          <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">
            About
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Latest Posts
          </h2>

          {isLoading && <p>Loading...</p>}
          {error && <p className="text-red-500">Error loading posts.</p>}

          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {post.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                By <span className="font-medium">{post.author}</span>
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                {post.content}
              </p>

              {/* Comments */}
              <div className="mt-6 border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Comments
                </h4>
                <div className="space-y-4">
                  {post.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-50 p-3 rounded-md border"
                    >
                      <p className="text-sm text-gray-900 font-medium">
                        {comment.fromUser}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add Comment Form */}
                <form
                  className="mt-6"
                  onSubmit={(e) => handleCommentSubmit(e, post.id, post.author)}
                >
                  <textarea
                    placeholder="Add a comment..."
                    className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={newComments[post.id] || ""}
                    onChange={(e) =>
                      handleCommentChange(post.id, e.target.value)
                    }
                  ></textarea>
                  <button
                    type="submit"
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Post Comment
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white text-center p-4 shadow-inner mt-10">
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} My Blog. All rights reserved.
        </p>
      </footer>
      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default App;
