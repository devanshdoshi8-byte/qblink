import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Automatically scrolls to top (0, 0) whenever the route path changes.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
