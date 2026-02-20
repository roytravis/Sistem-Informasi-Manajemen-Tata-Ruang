import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
    const { user, loading } = useAuth();
    
    // Log untuk melacak status otentikasi
    console.log(`ProtectedRoute: loading=${loading}, user=`, user);

    if (loading) {
        console.log("ProtectedRoute: Menampilkan status loading...");
        return <div className="flex justify-center items-center h-screen"><p>Memuat aplikasi...</p></div>;
    }
    
    if (!user) {
        console.log("ProtectedRoute: Tidak ada user, mengalihkan ke /login");
        return <Navigate to="/login" replace />;
    }

    console.log("ProtectedRoute: User ditemukan, menampilkan konten...");
    return <Outlet />;
}
