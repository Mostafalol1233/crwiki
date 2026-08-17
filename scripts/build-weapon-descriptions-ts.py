import json
import re
from pathlib import Path

ROOT = Path('/home/ubuntu/crwiki')
raw = json.loads((ROOT / 'shared/weapon-enrichment.raw.json').read_text())
translations = json.loads((ROOT / 'shared/weapon-description-arabic-google.json').read_text())

LABEL_AR = {
    'Black Market': 'السوق السوداء',
    'Item Shop': 'متجر العناصر',
    'Mileage Shop': 'متجر الأميال',
    'Coupon Exchange': 'استبدال القسائم',
    'Coupon': 'قسيمة',
    'Event': 'فعالية',
    'Events': 'فعاليات',
    'Battle Pass': 'تذكرة المعركة',
    'CF Pass': 'تذكرة CF',
    'Mercenary Pass': 'تذكرة المرتزقة',
    'VVIP System': 'نظام VVIP',
    'VVIP Lucky Crate': 'صندوق VVIP المحظوظ',
    'VVIP Lucky Wheel': 'عجلة VVIP المحظوظة',
    'VVIP Legendary Lotto Spin': 'سحب VVIP الأسطوري',
    'Weapon Master': 'إتقان السلاح',
    'Ranked Match': 'مباراة مصنفة',
    'ZM Reward': 'مكافأة وضع الزومبي',
    'Reward Crates': 'صناديق المكافآت',
    'Basic Weapon': 'سلاح أساسي',
    'Beginner': 'مكافآت المبتدئين',
    'Achievement': 'نظام الإنجازات',
    'Attendance': 'نظام الحضور',
    'Trade': 'نظام التبادل',
    'Webshop': 'المتجر الإلكتروني',
    'Point Mall': 'متجر النقاط',
    'AI Ticket': 'تذاكر الذكاء الاصطناعي',
    'AI Reward': 'مكافأة الذكاء الاصطناعي',
    'Supply Box': 'صندوق الإمدادات',
    'Reward': 'مكافأة',
    'Challenge Mode': 'صناديق نمط التحدي',
    'Defense Mode': 'مكافآت نمط الدفاع',
    'Adventure Mode': 'نمط المغامرة',
    'Battle Royale': 'باتل رويال',
    'Clan Match': 'مكافأة مباراة القبيلة',
    'Rank': 'مكافأة التصنيف',
}

PRIMARY_RULES = [
    ('Black Market', 'black_market', 'Black Market', 'السوق السوداء'),
    ('Item Shop', 'item_shop', 'Item Shop', 'متجر العناصر'),
    ('Mileage Shop', 'mileage_shop', 'Mileage Shop', 'متجر الأميال'),
    ('Battle Pass', 'battle_pass', 'Battle Pass', 'تذكرة المعركة'),
    ('CF Pass', 'battle_pass', 'CF Pass', 'تذكرة CF'),
    ('Mercenary Pass', 'battle_pass', 'Mercenary Pass', 'تذكرة المرتزقة'),
    ('VVIP', 'vvip', 'VVIP system or crate', 'نظام أو صندوق VVIP'),
    ('Coupon', 'coupon_exchange', 'Coupon Exchange', 'استبدال القسائم'),
    ('Event', 'event', 'Event', 'فعالية'),
    ('Rank', 'ranked_reward', 'Ranked or rank reward', 'مكافأة مباراة أو تصنيف'),
    ('ZM', 'mode_reward', 'Zombie Mode reward', 'مكافأة من وضع الزومبي'),
    ('Zombie', 'mode_reward', 'Zombie Mode reward', 'مكافأة من وضع الزومبي'),
    ('Reward', 'reward', 'Reward system or crate', 'نظام أو صندوق مكافآت'),
]


def translate_label(label: str) -> str:
    value = label.strip()
    for prefix, arabic in sorted(LABEL_AR.items(), key=lambda item: len(item[0]), reverse=True):
        if value.startswith(prefix):
            return arabic + value[len(prefix):]
    return value


def primary_acquisition(labels: list[str]):
    joined = ' | '.join(labels)
    for needle, kind, en, ar in PRIMARY_RULES:
        if needle.casefold() in joined.casefold():
            return kind, en, ar
    if labels:
        return 'other', labels[0], translate_label(labels[0])
    return 'unverified', 'Unverified', 'غير متحقق منه'


def clean_description(value: str) -> str:
    return ' '.join((value or '').split()).strip()

records = {}
for row in raw['weapons']:
    name = row.get('name') or row.get('matchedName') or row.get('pageTitle') or ''
    description_en = clean_description(row.get('descriptionEn') or row.get('overviewEn') or '')
    description_ar = clean_description(translations.get(description_en, '')) if description_en else ''
    labels = [str(value).strip() for value in (row.get('obtainable') or []) if str(value).strip()]
    kind, primary_en, primary_ar = primary_acquisition(labels)
    if labels:
        details_en = 'The reference entry lists: ' + '; '.join(labels) + '. Official regional confirmation is still required.'
        details_ar = 'يذكر السجل المرجعي طرق الاقتناء التالية: ' + '؛ '.join(translate_label(value) for value in labels) + '. وما زال تأكيد المنطقة من المصدر الرسمي مطلوبًا.'
    else:
        details_en = 'No acquisition method is recorded in the reference entry. Verify the regional official shop or release announcement before publishing availability.'
        details_ar = 'لا يذكر السجل المرجعي طريقة اقتناء محددة. يجب التحقق من متجر المنطقة الرسمي أو إعلان الإصدار قبل اعتماد الإتاحة.'
    if description_en and description_ar:
        description_status = 'reference-described'
    else:
        description_status = 'unverified'
        description_en = description_en or ''
        description_ar = description_ar or ''
    records[name] = {
        'id': str(row.get('id') or ''),
        'name': name,
        'category': str(row.get('category') or row.get('type') or 'Uncategorized'),
        'descriptionEn': description_en,
        'descriptionAr': description_ar,
        'descriptionStatus': description_status,
        'availabilityEn': clean_description(row.get('availabilityEn') or ''),
        'availabilityAr': '',
        'acquisitionKind': kind,
        'acquisitionLabelEn': primary_en,
        'acquisitionLabelAr': primary_ar,
        'acquisitionDetailsEn': details_en,
        'acquisitionDetailsAr': details_ar,
        'acquisitionSources': labels,
        'acquisitionVerified': False,
        'sourceUrl': row.get('sourceUrl') or '',
        'officialCatalogueUrl': row.get('officialCatalogueUrl') or 'https://crossfire.z8games.com/weapons.html',
        'sourceKind': row.get('sourceKind') or 'secondary_reference',
        'matchMode': row.get('matchMode') or 'not-found',
    }

# JSON is valid TypeScript and keeps the generated module easy to audit.
out = ROOT / 'shared/weapon-descriptions.ts'
header = '''/**\n * Generated, source-linked weapon enrichment.\n *\n * Descriptions are extracted from the linked reference page and translated\n * locally. Acquisition labels are reproduced as source notes, not official\n * regional confirmations; the UI must keep that distinction visible.\n */\nexport type WeaponAcquisitionKind =\n  | "black_market"\n  | "item_shop"\n  | "mileage_shop"\n  | "battle_pass"\n  | "vvip"\n  | "coupon_exchange"\n  | "event"\n  | "ranked_reward"\n  | "mode_reward"\n  | "reward"\n  | "other"\n  | "unverified";\n\nexport interface WeaponDescriptionRecord {\n  id: string;\n  name: string;\n  category: string;\n  descriptionEn: string;\n  descriptionAr: string;\n  descriptionStatus: "reference-described" | "unverified";\n  availabilityEn: string;\n  availabilityAr: string;\n  acquisitionKind: WeaponAcquisitionKind;\n  acquisitionLabelEn: string;\n  acquisitionLabelAr: string;\n  acquisitionDetailsEn: string;\n  acquisitionDetailsAr: string;\n  acquisitionSources: string[];\n  acquisitionVerified: boolean;\n  sourceUrl: string;\n  officialCatalogueUrl: string;\n  sourceKind: string;\n  matchMode: string;\n}\n\nexport const WEAPON_DESCRIPTIONS: Record<string, WeaponDescriptionRecord> = '''
out.write_text(header + json.dumps(records, ensure_ascii=False, indent=2) + ';\n\n' + '''const keyFor = (value: string) => value.trim().toLocaleLowerCase();\nconst BY_NAME = new Map(Object.entries(WEAPON_DESCRIPTIONS).map(([name, record]) => [keyFor(name), record]));\n\nexport function getWeaponDescription(name: string): WeaponDescriptionRecord | undefined {\n  return BY_NAME.get(keyFor(name));\n}\n''')
print(f'written={out} records={len(records)} described={sum(r["descriptionStatus"] == "reference-described" for r in records.values())} unverified={sum(r["descriptionStatus"] == "unverified" for r in records.values())}')
