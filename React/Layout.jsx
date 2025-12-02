import { Outlet, useNavigate, Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // Untuk mentrigger refresh notifikasi saat pindah halaman
    const [notifCount, setNotifCount] = useState(0);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Fungsi untuk mengambil jumlah notifikasi
    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications/count');
            setNotifCount(response.data.count);
        } catch (error) {
            console.error("Gagal mengambil notifikasi:", error);
        }
    };

    // Ambil notifikasi saat komponen di-mount dan setiap kali lokasi berubah (user navigasi)
    // Ini memastikan badge update setelah user membuka halaman penilaian, misalnya.
    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Opsional: Polling setiap 30 detik agar notifikasi real-time
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user, location.pathname]);

    const canManage = user && ['Admin', 'Sekretariat'].includes(user.role);

    // Style untuk NavLink aktif
    const activeLinkStyle = {
        color: '#2563EB',
        fontWeight: '600',
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <nav className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/dashboard" className="text-xl font-bold text-blue-600 flex-shrink-0">SIMANTRA</Link>
                        
                        {/* Navigasi Utama */}
                        <div className="hidden md:flex items-center space-x-6">
                            <NavLink to="/dashboard" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">Dashboard Kasus</NavLink>
                            <NavLink to="/penilaian" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">Dashboard Penilaian</NavLink>
                            
                            {canManage && (
                                <>
                                    <NavLink to="/pemegangs" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">Pemegang Usaha</NavLink>
                                    <NavLink to="/tims" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">Manajemen Tim</NavLink>
                                </>
                            )}
                        </div>

                        {/* Info User, Notifikasi dan Logout */}
                        <div className="flex items-center gap-4">
                            {/* --- FITUR NOTIFIKASI --- */}
                            <Link 
                                to="/penilaian" 
                                className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100 focus:outline-none"
                                title="Lihat Daftar Tugas / Penilaian"
                            >
                                {/* Ikon Lonceng (SVG) */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                
                                {/* Badge Notifikasi */}
                                {notifCount > 0 && (
                                    <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full min-w-[18px] h-[18px] border-2 border-white shadow-sm animate-pulse">
                                        {notifCount > 99 ? '99+' : notifCount}
                                    </span>
                                )}
                            </Link>
                            {/* --- AKHIR FITUR NOTIFIKASI --- */}

                            <div className="hidden sm:block text-right">
                                <span className="block text-gray-800 text-sm font-semibold">{user ? user.nama : 'Guest'}</span>
                                <span className="block text-gray-500 text-xs">{user ? user.role : ''}</span>
                            </div>
                            
                            <div className="h-8 w-px bg-gray-300 mx-1 hidden sm:block"></div>

                            <button onClick={handleLogout} className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-semibold py-2 px-4 rounded-lg text-sm transition-colors border border-red-200">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Outlet />
            </main>
        </div>
    );
}