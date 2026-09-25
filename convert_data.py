import pandas as pd
import json
import os

print("=== MEMULAI PROSES KONVERSI DATA INDEXVAL.XLSX ===")

# 1. Buka File Excel
excel_file = 'IndexVal.xlsx'
if not os.path.exists(excel_file):
    print(f"Error: File {excel_file} tidak ditemukan di folder proyek!")
    exit()

print("Membaca data Excel (293,000+ baris transaksi)... Mohon tunggu sebentar...")
try:
    df = pd.read_excel(excel_file, sheet_name='Data Detail')
except Exception as e:
    print(f"Gagal membaca sheet 'Data Detail': {e}")
    exit()

# 2. Bersihkan Koordinat
def clean_coord(val, is_lat=True):
    if pd.isna(val):
        return None
    try:
        val = float(val)
        if is_lat and (-11.0 <= val <= 10.0):
            return round(val, 6)
        elif (not is_lat) and (90.0 <= val <= 145.0):
            return round(val, 6)
    except:
        return None
    return None

df['clean_lat'] = df['LATITUTE'].apply(lambda x: clean_coord(x, is_lat=True))
df['clean_lng'] = df['LONGTITUDE'].apply(lambda x: clean_coord(x, is_lat=False))

# Filter hanya yang punya koordinat valid
valid_df = df[df['clean_lat'].notna() & df['clean_lng'].notna()].copy()
print(f"Data valid dengan koordinat: {len(valid_df)} transaksi.")

# 3. Agregasi per Outlet (SHIP_TO_SITE_USE_ID)
outlets = []
grouped = valid_df.groupby('SHIP_TO_SITE_USE_ID')

print("Mengompresi dan menghitung omset per outlet...")
for ship_id, group in grouped:
    first = group.iloc[0]
    
    # Hitung Omset per Brand
    brand_sales = group.groupby('BRAND')['TOTAL_SALES'].sum().to_dict()
    top_brands = sorted(
        [{'brand': str(b), 'sales': float(s)} for b, s in brand_sales.items() if pd.notna(b)], 
        key=lambda x: x['sales'], reverse=True
    )
    
    # Hitung Omset per Grup
    grup_sales = group.groupby('GRUP')['TOTAL_SALES'].sum().to_dict()
    by_grup = [{'grup': str(g), 'sales': float(s)} for g, s in grup_sales.items() if pd.notna(g)]
    
    total_sales = float(group['TOTAL_SALES'].sum())
    
    outlet_obj = {
      'id': str(ship_id),
      'name': str(first['CUSTOMER_NAME']) if pd.notna(first['CUSTOMER_NAME']) else 'Tanpa Nama',
      'address': str(first['ADDRESS1']) if pd.notna(first['ADDRESS1']) else '',
      'kodya': str(first['KODYA']) if pd.notna(first['KODYA']) else '',
      'kecamatan': str(first['KECAMATAN']) if pd.notna(first['KECAMATAN']) else '',
      'class': str(first['CLASS_OUTLET']) if pd.notna(first['CLASS_OUTLET']) else '-',
      'tipe': str(first['TIPE_OUTLET']) if pd.notna(first['TIPE_OUTLET']) else '-',
      'lat': first['clean_lat'],
      'lng': first['clean_lng'],
      'total_sales': round(total_sales, 2),
      'brands': [b['brand'] for b in top_brands],
      'top_brands': top_brands[:5],
      'groups': [g['grup'] for g in by_grup]
    }
    outlets.append(outlet_obj)

# 4. Simpan ke Folder data/outlets.json
os.makedirs('data', exist_ok=True)
output_path = os.path.join('data', 'outlets.json')

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(outlets, f, ensure_ascii=False, indent=2)

file_size = os.path.getsize(output_path) / (1024 * 1024)
print(f"✅ KONVERSI SUKSES!")
print(f"Total Outlet Terproses: {len(outlets)} Toko/Outlet.")
print(f"File Hasil Simpan: {output_path} ({file_size:.2f} MB)")