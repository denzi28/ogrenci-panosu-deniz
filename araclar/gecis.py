#!/usr/bin/env python3
"""
ESKİ YEDEKTEN YENİ GÜVENLİ SİSTEME GEÇİŞ ARACI

Eski sitenin "Sistem Yedekleme" bölümünden alınan .json dosyasını, giriş sistemli (Firebase Authentication)
yeni yapıya aktarır:
  - Her öğrenci/öğretmen için bir giriş hesabı açar (kullanıcı adı ve şifre aynı kalır)
  - Kullanıcı bilgilerini herkese açık (users) ve gizli (users_gizli) olarak ayırır
  - roller tablosunu oluşturur
  - Diğer tüm tabloları (davranış, kitap, rozet, oyun puanları...) kayıt numaraları korunarak kopyalar

Aynı kullanıcı adına sahip birden fazla kayıt varsa EN ESKİSİ alınır (eski sistemin kendiliğinden
oluşturduğu fazladan "ogretmen / r123" hesapları bu yüzden aktarılmaz).

Önce firestore.rules yayınlanmış olmalı. Araç, kurucu öğretmen ("ogretmen") hesabıyla giriş yapıp
yazma işlemlerini o yetkiyle yapar; yani kurallar açık olmadan da güvenle çalışır.

Kullanım:
  python3 araclar/gecis.py YEDEK.json --proje ogrenci-panosu-deniz --api-key AIza...
  (Deneme için Firebase emülatörü:  --emulator)

Tekrar çalıştırmak güvenlidir: var olan hesaplar yeniden açılmaz, kayıtlar üzerine yazılır.
"""
import argparse, json, sys, urllib.request, urllib.error, urllib.parse
from concurrent.futures import ThreadPoolExecutor

SIFRE_EKI = '#3D-pano'          # js/hesaplar.js ile aynı olmalı
EPOSTA_ALANI = 'sinifpanosu.app'  # js/hesaplar.js ile aynı olmalı
KURUCU_KULLANICI_ADI = 'ogretmen' # firestore.rules içindeki kurucu() ile aynı olmalı
ACIK_ALANLAR = {'name', 'role', 'createdAt'}  # js/db.js ile aynı olmalı


def eposta(kullanici_adi):
    return 'k' + str(kullanici_adi).strip().encode('utf-8').hex() + '@' + EPOSTA_ALANI


def istek(url, veri=None, yontem='POST', token=None):
    basliklar = {'Content-Type': 'application/json'}
    if token:
        basliklar['Authorization'] = 'Bearer ' + token
    govde = json.dumps(veri).encode() if veri is not None else None
    req = urllib.request.Request(url, data=govde, headers=basliklar, method=yontem)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        hata = e.read().decode(errors='replace')
        raise RuntimeError(f'{e.code}: {hata[:300]}') from None


def deger(v):
    """Python değerini Firestore REST biçimine çevirir."""
    if v is None: return {'nullValue': None}
    if isinstance(v, bool): return {'booleanValue': v}
    if isinstance(v, int): return {'integerValue': str(v)}
    if isinstance(v, float): return {'doubleValue': v}
    if isinstance(v, str): return {'stringValue': v}
    if isinstance(v, list): return {'arrayValue': {'values': [deger(x) for x in v]}}
    if isinstance(v, dict): return {'mapValue': {'fields': {k: deger(x) for k, x in v.items()}}}
    raise TypeError(f'Desteklenmeyen tür: {type(v)}')


class Firebase:
    def __init__(self, proje, api_key, emulator):
        self.proje, self.key = proje, api_key
        self.auth_url = ('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1' if emulator
                         else 'https://identitytoolkit.googleapis.com/v1')
        fs = 'http://127.0.0.1:8080/v1' if emulator else 'https://firestore.googleapis.com/v1'
        self.belge_url = f'{fs}/projects/{proje}/databases/(default)/documents'

    def hesap(self, kullanici_adi, sifre):
        """Hesabı açar; zaten varsa giriş yapar. (uid, token) döner."""
        bilgi = {'email': eposta(kullanici_adi), 'password': str(sifre) + SIFRE_EKI, 'returnSecureToken': True}
        try:
            r = istek(f'{self.auth_url}/accounts:signUp?key={self.key}', bilgi)
        except RuntimeError as e:
            if 'EMAIL_EXISTS' not in str(e):
                raise
            r = istek(f'{self.auth_url}/accounts:signInWithPassword?key={self.key}', bilgi)
        return r['localId'], r['idToken']

    def yaz(self, tablo, belge_id, alanlar, token):
        url = f"{self.belge_url}/{tablo}/{urllib.parse.quote(belge_id, safe='')}"
        istek(url, {'fields': {k: deger(v) for k, v in alanlar.items()}}, 'PATCH', token)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('yedek')
    ap.add_argument('--proje', required=True)
    ap.add_argument('--api-key', default='emulator')
    ap.add_argument('--emulator', action='store_true')
    a = ap.parse_args()
    if a.proje == 'davranis-pano':
        sys.exit('⛔ Orijinal sitenin veritabanına yazılamaz.')

    yedek = json.load(open(a.yedek, encoding='utf-8'))['veriler']
    fb = Firebase(a.proje, a.api_key, a.emulator)

    # 1) Kullanıcılar: aynı kullanıcı adından en eskisini al
    secilen = {}
    for k in sorted(yedek.get('users', []), key=lambda r: r.get('createdAt', '')):
        secilen.setdefault(k['username'], k)
    kullanicilar = list(secilen.values())
    atlanan = len(yedek.get('users', [])) - len(kullanicilar)

    kurucu = secilen.get(KURUCU_KULLANICI_ADI)
    if not kurucu or kurucu.get('role') != 'teacher':
        sys.exit(f'⛔ Yedekte "{KURUCU_KULLANICI_ADI}" kullanıcı adlı öğretmen bulunamadı.')

    # 2) Kurucu öğretmen giriş yapar ve kendi rolünü oluşturur
    kurucu_uid, token = fb.hesap(kurucu['username'], kurucu['password'])
    fb.yaz('roller', kurucu_uid, {'role': 'teacher', 'userId': kurucu['id']}, token)
    print(f'✔ Kurucu öğretmen hazır')

    # 3) Diğer kullanıcıların giriş hesapları
    def hesap_ac(k):
        if k is kurucu: return k, kurucu_uid
        return k, fb.hesap(k['username'], k['password'])[0]
    with ThreadPoolExecutor(4) as ex:
        uidler = dict((k['id'], uid) for k, uid in ex.map(hesap_ac, kullanicilar))
    print(f'✔ {len(uidler)} giriş hesabı hazır ({atlanan} tekrar eden kayıt atlandı)')

    # 4) Tüm yazma işlemleri (öğretmen yetkisiyle)
    isler = []
    for k in kullanicilar:
        acik = {x: v for x, v in k.items() if x in ACIK_ALANLAR}
        gizli = {x: v for x, v in k.items() if x not in ACIK_ALANLAR and x != 'id'}
        gizli['uid'] = uidler[k['id']]
        isler += [('users', k['id'], acik), ('users_gizli', k['id'], gizli),
                  ('roller', uidler[k['id']], {'role': k['role'], 'userId': k['id']})]
    for tablo, kayitlar in yedek.items():
        if tablo == 'users': continue
        for r in kayitlar:
            isler.append((tablo, r['id'], {x: v for x, v in r.items() if x != 'id'}))
    tablolar = sorted(set(yedek) | {'users_gizli', 'roller'})
    isler.append(('system_settings', 'koleksiyon_listesi', {'isimler': tablolar}))

    hatalar = []
    def yaz(is_):
        try: fb.yaz(*is_, token)
        except Exception as e: hatalar.append((is_[0], is_[1], str(e)[:200]))
    with ThreadPoolExecutor(8) as ex:
        list(ex.map(yaz, isler))

    print(f'✔ {len(isler) - len(hatalar)}/{len(isler)} kayıt yazıldı, {len(tablolar)} tablo')
    for h in hatalar[:10]:
        print('  ✖', h)
    sys.exit(1 if hatalar else 0)


if __name__ == '__main__':
    main()
