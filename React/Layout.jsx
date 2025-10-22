import { Outlet, useNavigate, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const canManage = user && ['Admin', 'Sekretariat'].includes(user.role);

    // Style untuk NavLink aktif
    const activeLinkStyle = {
        color: '#2563EB',
        fontWeight: '600',
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <nav className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/dashboard" className="text-xl font-bold text-blue-600">SIMANTRA</Link>
                        
                        {/* Navigasi Utama */}
                        <div className="hidden md:flex items-center space-x-6">
                            <NavLink to="/dashboard" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-600 hover:text-blue-600 font-medium text-sm">Dashboard Kasus</NavLink>
                            {/* PENAMBAHAN: Link ke Halaman Dashboard Penilaian */}
                            <NavLink to="/penilaian" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-600 hover:text-blue-600 font-medium text-sm">Dashboard Penilaian</NavLink>
                            
                            {canManage && (
                                <>
                                    <NavLink to="/pemegangs" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-600 hover:text-blue-600 font-medium text-sm">Pemegang Usaha</NavLink>
                                    <NavLink to="/tims" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-600 hover:text-blue-600 font-medium text-sm">Manajemen Tim</NavLink>
                                </>
                            )}
                        </div>

                        {/* Info User dan Logout */}
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-600 text-sm">Halo, {user ? user.nama : ''}</span>
                            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
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
