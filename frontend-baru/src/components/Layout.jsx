import { Outlet, useNavigate, Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // State Notifikasi
    const [notifCount, setNotifCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // 1. Fetch Jumlah Notifikasi
    const fetchNotificationCount = async () => {
        try {
            const response = await api.get('/notifications/count');
            setNotifCount(response.data.count);
        } catch (error) {
            console.error("Gagal mengambil jumlah notifikasi:", error);
        }
    };

    // 2. Fetch Detail Notifikasi (Saat dropdown dibuka)
    const fetchNotificationsList = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error("Gagal mengambil data notifikasi:", error);
        }
    };

    // 3. Handler Klik Bell
    const toggleDropdown = () => {
        if (!isDropdownOpen) {
            fetchNotificationsList(); // Load data saat dibuka
        }
        setIsDropdownOpen(!isDropdownOpen);
    };

    // 4. Handler Klik Item Notifikasi
    const handleNotificationClick = async (notif) => {
        try {
            // A. Tandai sudah dibaca di backend
            await api.post(`/notifications/${notif.id}/read`);

            // B. Update UI lokal
            setNotifCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.filter(n => n.id !== notif.id));
            setIsDropdownOpen(false);

            // C. Arahkan ke halaman tujuan
            // --- PERBAIKAN: Cek action_url terlebih dahulu (untuk Edit Request) ---
            if (notif.data.action_url) {
                navigate(notif.data.action_url);
                return;
            }
            // --- AKHIR PERBAIKAN ---

            // Fallback: Logic lama untuk AssessmentAssigned (berbasis permohonan_id)
            const permohonanId = notif.data.permohonan_id;

            if (permohonanId) {
                // LOGIKA BARU: Arahkan ke Dashboard Penilaian dengan filter ID
                // Ini akan memicu PenilaianPage untuk hanya menampilkan item ini.
                navigate(`/penilaian?id=${permohonanId}`);
            } else {
                // Fallback jika tidak ada ID
                navigate('/penilaian');
            }

        } catch (error) {
            console.error("Gagal memproses notifikasi:", error);
        }
    };

    // 5. Handler Tandai Semua Dibaca
    const handleMarkAllRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifCount(0);
            setNotifications([]);
            setIsDropdownOpen(false);
        } catch (error) {
            console.error("Gagal menandai semua dibaca:", error);
        }
    };

    // Tutup dropdown jika klik di luar
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    // Initial load & Polling count
    useEffect(() => {
        if (user) {
            fetchNotificationCount();
            const interval = setInterval(fetchNotificationCount, 30000); // Poll setiap 30s
            return () => clearInterval(interval);
        }
    }, [user, location.pathname]);

    // PERBAIKAN: Tambahkan 'Ketua Tim' untuk akses Manajemen Tim
    // Ketua Tim perlu akses untuk menambah/mengelola anggota tim
    const canManage = user && ['Admin', 'Sekretariat', 'Ketua Tim'].includes(user.role);
    // --- PENAMBAHAN: Cek role untuk menu persetujuan ---
    const canApprove = user && ['Admin', 'Ketua Tim'].includes(user.role);
    // --- AKHIR PENAMBAHAN ---
    const activeLinkStyle = { color: '#2563EB', fontWeight: '600' };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <nav className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/penilaian" className="text-xl font-bold text-blue-600 flex-shrink-0">SIMANTRA</Link>

                        {/* Navigasi Utama */}
                        <div className="hidden md:flex items-center space-x-6">
                            <NavLink to="/penilaian" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">Dashboard Penilaian</NavLink>

                            {/* --- PENAMBAHAN: Menu Persetujuan Edit --- */}
                            {canApprove && (
                                <NavLink to="/penilaian/persetujuan-edit" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
                                    Persetujuan Edit
                                </NavLink>
                            )}
                            {/* --- AKHIR PENAMBAHAN --- */}

                            {canManage && (
                                <>
                                    <NavLink to="/pemegangs" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">Pemegang Usaha</NavLink>
                                    <NavLink to="/tims" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">Manajemen Tim</NavLink>
                                </>
                            )}
                        </div>

                        {/* Info User, Notifikasi dan Logout */}
                        <div className="flex items-center gap-4">

                            {/* --- KOMPONEN NOTIFIKASI DROPDOWN --- */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={toggleDropdown}
                                    className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100 focus:outline-none"
                                    title="Notifikasi"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>

                                    {notifCount > 0 && (
                                        <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full min-w-[18px] h-[18px] border-2 border-white shadow-sm animate-pulse">
                                            {notifCount > 99 ? '99+' : notifCount}
                                        </span>
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-100 animate-fade-in-down">
                                        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                                            <h3 className="text-sm font-semibold text-gray-700">Notifikasi</h3>
                                            {notifications.length > 0 && (
                                                <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">
                                                    Tandai semua dibaca
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                                    Tidak ada notifikasi baru.
                                                </div>
                                            ) : (
                                                <ul className="divide-y divide-gray-100">
                                                    {notifications.map((notif) => (
                                                        <li key={notif.id}>
                                                            <button
                                                                onClick={() => handleNotificationClick(notif)}
                                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-150 group"
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700">
                                                                        {notif.type.includes('EditRequest') ? 'Permohonan Edit' : 'Permohonan Baru'}
                                                                    </p>
                                                                    <span className="text-xs text-gray-400">
                                                                        {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                                    {notif.data.message || `Permohonan #${notif.data.nomor_permohonan} dari ${notif.data.nama_pelaku_usaha}`}
                                                                </p>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        <div className="px-4 py-2 bg-gray-50 border-t text-center">
                                            <Link
                                                to="/penilaian"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                Lihat Semua Permohonan &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* --- AKHIR NOTIFIKASI DROPDOWN --- */}

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