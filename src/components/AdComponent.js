import { useEffect } from "react";

export default function AdComponent() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-6137752235774964"
        data-ad-slot="1158618127"  // Use your Ad slot ID here
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
