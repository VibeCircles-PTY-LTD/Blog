"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page({ params }) {
  const router = useRouter();

  useEffect(() => {
    const name = params?.name ? encodeURIComponent(decodeURIComponent(params.name)) : "";
    router.replace(`/#/author/${name}`);
  }, [router, params]);

  return null;
}
