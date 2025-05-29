import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:8080/api",
  withCredentials: true, // ✅ Nếu bạn enable allowCredentials = true
});

export const getPosts = async () => {
  try {
    const response = await API.get("/blog/posts");
    console.log("✅ GET posts thành công:", response.data);
    return response;
  } catch (error) {
    console.error("❌ Lỗi khi gọi GET /posts:", error);
    throw error;
  }
};

export interface CommentDTO {
  postId: number;
  content: string;
  fromUser: string;
  toUser: string;
}

export const createComment = (data: CommentDTO) =>
  API.post("/blog/comments", data);
