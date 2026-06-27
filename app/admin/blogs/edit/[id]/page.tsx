"use client";

import { use } from "react";
import BlogForm from "../../BlogForm";

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">编辑博客</h2>
      <BlogForm blogId={parseInt(id)} />
    </div>
  );
}
