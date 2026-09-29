# Tool Đếm Mã Sản Phẩm

Website đọc file Excel và đếm sản phẩm theo **MÃ + MÀU + SIZE**.  
Chạy hoàn toàn trên trình duyệt — không upload dữ liệu lên server.

---

## Cài đặt & Chạy

```bash
# Cài dependencies
npm install

# Chạy development (http://localhost:5173)
npm run dev

# Build production
npm run build

# Xem thử bản build
npm run preview
```

---

## Deploy lên Vercel

### Cách 1: Import từ GitHub (Khuyến nghị)

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → **New Project** → Import repo
3. Vercel tự nhận diện Vite, nhấn **Deploy**

### Cách 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

Framework preset: **Vite**  
Build command: `npm run build`  
Output directory: `dist`

---

## Hướng dẫn sử dụng

1. **Chọn file Excel** — kéo thả hoặc nhấn chọn (hỗ trợ `.xlsx`, `.xls`, nhiều file cùng lúc)
2. **Hệ thống tự đọc** cột `SẢN PHẨM` trong tất cả các sheet
3. **Xem kết quả** trong bảng MÃ / MÀU / SIZE / SỐ LƯỢNG
4. **Tìm kiếm & lọc** theo mã, màu, size
5. **Xuất Excel** hoặc **Copy** kết quả

---

## Quy tắc dữ liệu

Mỗi ô trong cột `SẢN PHẨM` có dạng:

```
MÃ MÀU SIZE
```

Ví dụ:
```
G98 HỒNG L
G98 XANH RÊU XL
```

Hỗ trợ nhiều sản phẩm trong một ô:
```
G98 HỒNG L + ĐEN XL + TRẮNG M
```

Phần sau dấu `+` tự động kế thừa mã nếu không có mã riêng.

---

## Bổ sung SIZE mới

Mở file `src/utils/productParser.js` và thêm vào mảng `SIZE_LIST`:

```js
export const SIZE_LIST = [
  'XXXL', 'XXL', 'XL', 'XS',
  '7XL', '6XL', '5XL', '4XL', '3XL', '2XL',
  'L', 'M', 'S',
  'FREESIZE',  // ← thêm vào đây
]
```
