"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page({ params }) {
  const router = useRouter();

  useEffect(() => {
    const cat = params?.cat ? encodeURIComponent(decodeURIComponent(params.cat)) : "";
    router.replace(`/#/cat/${cat}`);
  }, [router, params]);

  return null;
}
