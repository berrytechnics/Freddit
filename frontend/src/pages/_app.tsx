import type { AppProps } from "next/app";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "../store";
import { getCurrentUser } from "../store/slices/authSlice";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Check if user is authenticated on app load
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        store.dispatch(getCurrentUser());
      }
    }
  }, []);

  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}
