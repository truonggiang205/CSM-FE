export function Footer() {
  return (
    <footer className="bg-neutral-100 border-t border-neutral-300 mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-brand-primary mb-4">CSM - Convenience Store</h3>
            <p className="text-neutral-600 text-sm max-w-md">
              Hệ thống cửa hàng tiện lợi cung cấp đa dạng sản phẩm chất lượng, tươi ngon mỗi ngày. Phục vụ 24/7 với nhiều ưu đãi hấp dẫn.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Về chúng tôi</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li><a href="#" className="hover:text-brand-primary">Giới thiệu</a></li>
              <li><a href="#" className="hover:text-brand-primary">Hệ thống cửa hàng</a></li>
              <li><a href="#" className="hover:text-brand-primary">Tuyển dụng</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li><a href="#" className="hover:text-brand-primary">Chính sách đổi trả</a></li>
              <li><a href="#" className="hover:text-brand-primary">Hướng dẫn mua hàng</a></li>
              <li><a href="#" className="hover:text-brand-primary">Liên hệ: 1900 1234</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-neutral-300 text-center text-sm text-neutral-600">
          © {new Date().getFullYear()} CSM. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
