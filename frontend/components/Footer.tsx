// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h3 className="text-xl font-bold mb-4">Highlands Coffee</h3>
            <p className="text-gray-400 mb-4">
              Phục vụ những tách cà phê chất lượng từ 1999
            </p>
            <div className="space-y-2 text-gray-400">
              <p>📍 125-127 Nguyễn Cơ Thạch, Q.2, TP.HCM</p>
              <p>📞 1900 1755</p>
              <p>✉️ customerservice@highlandscoffee.com.vn</p>
            </div>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-xl font-bold mb-4">Chính sách</h3>
            <ul className="space-y-2">
              {['Chính sách đặt hàng', 'Chính sách bảo mật', 'Chính sách thanh toán', 'Chính sách giao hàng'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xl font-bold mb-4">Hỗ trợ</h3>
            <ul className="space-y-2">
              {['Câu hỏi thường gặp', 'Liên hệ', 'Tìm cửa hàng', 'Góp ý'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xl font-bold mb-4">Đăng ký nhận tin</h3>
            <p className="text-gray-400 mb-4">
              Nhận ưu đãi đặc biệt và thông tin mới nhất
            </p>
            <div className="flex mb-4">
              <input
                type="email"
                placeholder="Nhập email"
                className="flex-1 px-4 py-2 rounded-l-lg text-gray-800"
              />
              <button className="bg-[#8B4513] hover:bg-[#7a3c12] px-4 py-2 rounded-r-lg">
                Đăng ký
              </button>
            </div>
            <div className="flex space-x-4">
              {['📱', '📘', '📷', '🎬'].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>© 2024 Highlands Coffee. All rights reserved.</p>
          <p className="mt-2">Mã số thuế: 1234567890</p>
        </div>
      </div>
    </footer>
  );
}