import "./globals.css";
import NavBar from "./components/NavBar";
import { ToastContainer } from "react-toastify";
import { AuthContext } from "./context/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`bg-gray-300 antialiased`}>
        <AuthContext>
          <NavBar />
          <main className="">{children}</main>
          <ToastContainer />
        </AuthContext>
      </body>
    </html>
  );
}
