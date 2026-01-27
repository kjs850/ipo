export default function Navbar() {
    return (
        <nav className="border-b border-[rgba(255,255,255,0.05)] bg-[rgba(15,23,42,0.8)] backdrop-blur-md sticky top-0 z-50">
            <div className="container h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        G
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">공모주 가이드</span>
                </div>
                <div className="flex gap-6 text-sm font-medium text-gray-300">
                    <a href="#schedule" className="hover:text-white transition-colors">수요예측 분석</a>
                </div>
            </div>
        </nav>
    );
}
