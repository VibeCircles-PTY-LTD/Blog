"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page({ params }) {
  const router = useRouter();

  useEffect(() => {
    const slug = params?.slug ? encodeURIComponent(params.slug) : "";
    router.replace(`/#/post/${slug}`);
  }, [router, params]);

  return null;
}
